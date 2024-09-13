"use server";
import { db } from "./db";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { formData, verifyResponse, commonResponse } from "./types";
import settings from "@/config/settings";
import { hash, compare } from "bcryptjs";
import { z } from "zod";
import axios from "axios";
import { googleProvider, reCAPTCHA } from "@/config/config";
import { sendPasswordResetMail, sendVerificationMail } from "./mail";
import { generateSecureKey } from "@/lib/utils";

// Auth configuration

const secret = "g6_kg5GSGHd52fGDgdN5BVx53KHF20gX";
const key = new TextEncoder().encode(secret);

const passwordSchema = z
  .string()
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .min(8, "Password must contain at least 8 characters");

const UserSchema = z
  .object({
    username: z.string().min(4, "Username must be at least 4 characters"),
    email: z.string().email("Invalid email format"),
    password: passwordSchema,
    passwordC: z.string(),
  })
  .refine((data) => data.password === data.passwordC, {
    message: "Passwords didn't match",
    path: ["passwordC"],
  });

// To encrypt and Descrypt JWT for sessions

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1 hr from now")
    .sign(key);
}

export async function decrypt(encryptedInput: string): Promise<any> {
  const { payload } = await jwtVerify(encryptedInput, key, {
    algorithms: ["HS256"],
  });
  return payload;
}

// Session Management functions

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  if (!session) return;
  const parsed = await decrypt(session);
  if (parsed.type === "oauth2") {
    try {
      const refresh = await refreshAccessToken(parsed.email);
      if (!refresh.refreshed) await logout();
    } catch (err: any) {
      return Response.json({ error: "Error: " + err.message }, { status: 400 });
    }
  }
  const res = NextResponse.next();
  parsed.expires = new Date(Date.now() + settings.sessionExpiracy);
  res.cookies.set({
    name: "session",
    value: await encrypt(parsed),
    httpOnly: true,
    expires: parsed.expires,
  });
  return res;
}

export async function getSession() {
  const session = cookies().get("session")?.value;
  if (!session) return null;
  return await decrypt(session);
}

// Main Authentication functions

export const login = async (formData: formData): Promise<commonResponse> => {
  if (!formData.username || !formData.password) {
    return {
      success: false,
      message: `${formData.username ? "password" : "username"} is not provided`,
    };
  }
  // Check the db for username
  const userExists = await db.user.findUnique({
    where: {
      username: formData.username,
    },
    select: {
      password: true,
      isVerified: true,
    },
  });
  if (!userExists) return { success: false, message: "User not Found" };
  const passwordCheck = await compare(formData.password, userExists.password);
  if (!passwordCheck)
    return { success: false, message: "Incorrect Password, Try again" };
  if (!userExists.isVerified)
    return { success: false, message: "This user is not verified" };
  // Creatin session
  const expires = new Date(Date.now() + settings.sessionExpiracy);
  const session = await encrypt({
    user: {
      username: formData.username,
      password: formData.password,
      type: "g6account",
    },
    expires,
  });
  cookies().set("session", session, { expires, httpOnly: true });
  return { success: true, message: "logged in" };
};

export const register = async (formData: formData): Promise<commonResponse> => {
  if (!formData.username || !formData.password || !formData.email) {
    return {
      success: false,
      message: "Either username,email or password is not provided",
    };
  }
  // Check the db for username
  const usernameExists = await db.user.findUnique({
    where: {
      username: formData.username,
    },
  });
  const emailExists = await db.user.findUnique({
    where: {
      email: formData.email,
    },
  });

  if (usernameExists)
    return { success: false, message: "Username already exists" };
  if (emailExists)
    return { success: false, message: "User with this email already exists" };

  const hashedPassword = await hash(formData.password, 10);
  const token = generateSecureKey();
  const tokenExpiry = new Date(Date.now() + settings.tokenExpiracy);

  const newUser = await db.user.create({
    data: {
      username: formData.username,
      email: formData.email,
      password: hashedPassword,
      token: token,
      tokenExpiracy: tokenExpiry,
    },
  });
  if (!newUser) return { success: false, message: "Database error" };
  // send verification email
  const verifyEmail = await sendVerificationMail(
    formData.email,
    token,
    formData.username
  );
  console.log(verifyEmail);
  return { success: true, message: "user registered" };
};

export async function logout() {
  cookies().set("session", "", { expires: new Date(0) });
}

export async function validate(formData: formData) {
  try {
    const user = UserSchema.parse(formData);
    return { valid: true, errors: [] };
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const refinedErrors = err.errors.reduce((acc, curr) => {
        acc[curr.path[0]] = curr.message;
        return acc;
      }, {} as { [key: string]: string });
      return { valid: false, errors: refinedErrors };
    }
    return { valid: false, errors: err.message };
  }
}
export const verifyUser = async (
  email: string,
  token: string
): Promise<verifyResponse> => {
  if (!email || !token)
    return {
      verified: false,
      error: `${!email ? "email" : "token"} is not provided`,
    };
  const user = await db.user.findUnique({
    where: {
      email: email,
    },
    select: {
      token: true,
      tokenExpiracy: true,
    },
  });
  if (!user)
    return { verified: false, error: "User with given email not found" };
  if (token !== user.token)
    return { verified: false, error: "Tokens did not match" };
  const now = new Date();
  if (user.tokenExpiracy && user.tokenExpiracy < now)
    return { verified: false, error: "Token Expired", tokenExpired: true };
  const userVerified = await db.user.update({
    where: {
      email: email,
    },
    data: {
      isVerified: true,
      verificationDate: now,
    },
  });
  if (!userVerified) return { verified: false, error: "Database error" };
  return { verified: true, error: "" };
};

export const refreshUserToken = async (
  email: string
): Promise<commonResponse> => {
  if (!email) return { success: false, message: "Email address not provided" };
  const getUser = await db.user.findUnique({
    where: {
      email: email,
    },
    select: {
      username: true,
    },
  });
  if (!getUser)
    return { success: false, message: "User with given email not found" };
  const newToken = generateSecureKey();
  const expires = new Date(Date.now() + settings.tokenExpiracy);
  const updateToken = await db.user.update({
    where: {
      email: email,
    },
    data: {
      token: newToken,
      tokenExpiracy: expires,
    },
  });
  if (!updateToken) return { success: false, message: "Database error" };
  const resetEmail = await sendVerificationMail(
    email,
    newToken,
    getUser.username
  );
  if (!resetEmail) return { success: false, message: "Email not sent" };
  return {
    success: true,
    message: "Email with new token sent to your address",
  };
};

export const resetPassword = async (
  email: string,
  password: string
): Promise<commonResponse> => {
  if (!email) return { success: false, message: "Email address not provided" };
  const getUser = await db.user.findUnique({
    where: {
      email: email,
    },
    select: {
      password: true,
    },
  });
  if (!getUser)
    return { success: false, message: "User with given email not found" };
  const checkPassword = await compare(password, getUser.password);
  if (checkPassword)
    return {
      success: false,
      message: "You can't enter your old password again",
    };
  const newPassword = await hash(password, 10);
  const updatePassword = await db.user.update({
    where: {
      email: email,
    },
    data: {
      password: newPassword,
    },
  });
  if (!updatePassword) return { success: false, message: "Database error" };
  return { success: true, message: "Password reset successfully" };
};

export async function refreshAccessToken(email: string) {
  // Fetch the user from the database
  const user = await db.oAuthUser.findUnique({
    where: { email: email },
    select: {
      refreshToken: true,
    },
  });

  if (!user || !user.refreshToken) {
    return {
      refreshed: false,
      access_token: null,
      error: "No refresh token available",
    };
  }

  // Request new access token using the refresh token
  try {
    const response = await axios.post(googleProvider.urls.token_url, null, {
      params: {
        client_id: googleProvider.credentials.client_id,
        client_secret: googleProvider.credentials.client_secret,
        refresh_token: user.refreshToken,
        grant_type: "refresh_token",
      },
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const { access_token, expires_in } = response.data;

    // Calculate new token expiry time
    const newTokenExpiry = new Date(Date.now() + expires_in * 1000);

    // Update user with new access token and expiry
    await db.oAuthUser.update({
      where: { email: email },
      data: {
        accessToken: access_token,
        tokenExpiry: newTokenExpiry,
      },
    });

    return { refreshed: true, access_token: access_token, error: "" };
  } catch (error: any) {
    console.error(
      "Error refreshing access token:",
      error.response?.data || error.message
    );
    return {
      refreshed: false,
      access_token: "",
      error: "Failed to refresh access token",
    };
  }
}
export const checkToken = async (
  email: string,
  token: string
): Promise<commonResponse> => {
  const getToken = await db.user.findUnique({
    where: {
      email: email,
    },
    select: {
      token: true,
    },
  });
  if (!getToken) return { success: false, message: "User with given email not found" };
  if (token !== getToken.token)
    return { success: false, message: "Token didn't match" };
  return { success: true, message: "Token Verified" };
};

export const checkReCAPTCHA = async (
  token: string
): Promise<commonResponse> => {
  if (!token)
    return { success: false, message: "ReCAPTCHA token not provided" };
  const captchaURL = new URL(reCAPTCHA.urls.verify_url);
  captchaURL.searchParams.set("secret", reCAPTCHA.credintials.secret_key);
  captchaURL.searchParams.set("response", token);

  try {
    const response = await axios.post(captchaURL.toString());
    const data = response.data;
    console.log(data)
    if (data.success) {
      return { success: true, message: "Human check completed" };
    } else {
      return { success: false, message: data["error-codes"] };
    }
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};
