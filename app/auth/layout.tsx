"use client";

import { reCAPTCHA } from "@/config/config";
import { MsgProvider } from "@/context/MsgContext";
import React from "react";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <MsgProvider>
      <GoogleReCaptchaProvider reCaptchaKey={reCAPTCHA.credintials.site_key}>
        {children}
      </GoogleReCaptchaProvider>
    </MsgProvider>
  );
}
