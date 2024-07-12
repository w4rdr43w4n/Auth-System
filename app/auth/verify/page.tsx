import VerifyHandler from "@/components/Auth/VerifyHandler";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<h1>Loading...</h1>}>
      <VerifyHandler />
    </Suspense>
  )
}