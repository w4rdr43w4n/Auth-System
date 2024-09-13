"use client"
import { Suspense } from "react";
import LoginForm from "@/components/Auth/LoginForm";

export default function Page() {
  return (
      <Suspense fallback={<h1>Loading UI...</h1>}>
        <LoginForm />
      </Suspense>
  );
}
