export const googleProvider = {
  credentials: {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
  },
  urls: {
    redirect_uri: "http://localhost:3000/api/auth/callback",
    auth_url: "https://accounts.google.com/o/oauth2/v2/auth",
    token_url: "https://oauth2.googleapis.com/token",
    user_info_url: "https://www.googleapis.com/oauth2/v2/userinfo",
  },
};
const state = "G6AuthenticationWithGoogle";
export const authUrl = `${googleProvider.urls.auth_url}?response_type=code&client_id=${googleProvider.credentials.client_id}&redirect_uri=${googleProvider.urls.redirect_uri}&scope=openid%20email%20profile&state=${state}&access_type=offline&prompt=consent`;

export const reCAPTCHA = {
  credintials: {
    site_key: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!,
    secret_key: process.env.RECAPTCHA_SECRET_KEY!,
  },
  urls: {
    verify_url: "https://www.google.com/recaptcha/api/siteverify",
  },
};
