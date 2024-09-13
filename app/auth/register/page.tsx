"use client";
import RegisterForm from "@/components/Auth/RegisterForm";
import { MsgProvider } from "@/context/MsgContext";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<h1>Loading UI...</h1>}>
      <RegisterForm />
    </Suspense>
  );
}
