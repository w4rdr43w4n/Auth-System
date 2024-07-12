"use server";

import settings from "@/config/settings";
import { Resend } from "resend";
import { db } from "./db";
import { generateSecureKey } from "./utils";
import { commonAuthResponse } from "./types";
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationMail(
  email: string,
  token: string,
  username: string
) {
  const url = new URL(`${settings.origin_url}/auth/verify`);
  url.searchParams.set("email", email);
  url.searchParams.set("token", token);
  try {
    const data = await resend.emails.send({
      from: "G6 Account <G6Account@chatg6.ai>",
      to: [`${email}`],
      subject: "Email verification",
      html: `<p>Dear user: ${username} <br/> Please verify your <strong>G6 Account </strong> email <a href='${url.toString()}'>Here</a></p><br/>Note that this token will expire within ${
        settings.tokenExpiracyMinutes
      } minutes.`,
    });
    if (data) return { success: true, message: "verification email sent" };
    return { success: false, message: "Email not sent" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export const sendPasswordResetMail = async (
  email: string
): Promise<commonAuthResponse> => {
  const getUser = await db.user.findUnique({
    where: {
      email: email,
    },
    select: {
      username: true,
    },
  });
  const token = generateSecureKey();
  const storeToken = await db.user.update({
    where: {
      email: email,
    },
    data: {
      token: token,
    },
  });
  if (!storeToken) return { success: false, message: "Database error" };
  const url = new URL(`${settings.origin_url}/auth/reset_password`);
  url.searchParams.set("email", email);
  url.searchParams.set("token", token);
  try {
    const data = await resend.emails.send({
      from: "G6 Account <G6Account@chatg6.ai>",
      to: [`${email}`],
      subject: "Account Password Reset",
      html: `<p>Dear user: ${
        getUser?.username
      } <br/> Please follow the provided link to reset your <strong>G6 Account </strong> password <a href='${url.toString()}'>Here</a></p>`,
    });
    if (data) return { success: true, message: "Reset email sent" };
    return { success: false, message: "Email not sent" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};
