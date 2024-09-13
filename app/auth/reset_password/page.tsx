"use client";

import ResetHandler from "@/components/Auth/ResetHandler";
import { ResetPaswordForm } from "@/components/Auth/ResetPasswordForm";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<h1>Loading...</h1>}>
      <Handler />
    </Suspense>
  );
}

function Handler() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const token = searchParams.get("token");
  return (
    <Suspense fallback={<h1>Loading...</h1>}>
      {token && email ? (
        <ResetHandler email={email} token={token} />
      ) : (
        <ResetPaswordForm />
      )}
    </Suspense>
  );
}
