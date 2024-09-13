import { googleProvider } from "@/config/config";
import { encrypt } from "@/lib/auth";
import { db } from "@/lib/db";
import axios from "axios";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function handler(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  if (error) {
    console.log(
      { error: `Google authentication error: ${error}` },
      { status: 400 }
    );
    redirect("/");
  }
  if (!code) {
    return Response.json(
      { msg: "Code is missing from query parameters" },
      { status: 400 }
    );
  }

  try {
    // Exchange the authorization code for an access token
    const tokenResponse = await axios.post(
      googleProvider.urls.token_url,
      null,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        params: {
          code: code,
          client_id: googleProvider.credentials.client_id,
          client_secret: googleProvider.credentials.client_secret,
          redirect_uri: googleProvider.urls.redirect_uri,
          grant_type: "authorization_code",
        },
      }
    );
    const tokenData = tokenResponse.data;
    if (tokenData.error) {
      return Response.json({ msg: tokenData.error }, { status: 400 });
    }

    const access_token = tokenData.access_token;
    // Fetch the user's profile information
    const userInfoResponse = await axios.get(
      googleProvider.urls.user_info_url,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    // Store user's info in db

    const userInfo = userInfoResponse.data;
    const expires = new Date(Date.now() + tokenData.expires_in * 1000);
    const userExists = await db.oAuthUser.findUnique({
      where: {
        email: userInfo.email,
      },
      select: {
        name: true,
        refreshToken: true,
        tokenExpiry: true,
      },
    });
    if (userExists) {
      const updateRefreshToken = await db.oAuthUser.update({
        where: {
          email: userInfo.email,
        },
        data: {
          refreshToken: tokenData.refresh_token,
          accessToken: tokenData.access_token,
          tokenExpiry: expires,
        },
      });
      if (!updateRefreshToken) {
        return Response.json(
          { error: "Refresh token not updated, databse error" },
          { status: 400 }
        );
      }
    } else {
      const newUser = await db.oAuthUser.create({
        data: {
          name: userInfo.name,
          email: userInfo.email,
          provider: "google",
          refreshToken: tokenData.refresh_token,
          accessToken: tokenData.access_token,
          tokenExpiry: expires,
        },
      });
      if (!newUser) {
        return Response.json({ error: "Database error" }, { status: 400 });
      }
    }
    const session = await encrypt({
      user: { username: userInfo.name, email: userInfo.email, type: "oauth2" },
      expires,
    });
    cookies().set("session", session, { expires, httpOnly: true });

    return Response.redirect("http://localhost:3000/");
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export { handler as GET };
