"use client";
import { useMsg } from "@/context/MsgContext";
import { refreshUserToken, verifyUser } from "@/lib/auth";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "@/components/styles/auth.module.css";
export default function VerifyHandler() {
  const [isTokenExpired, setExpiredStatus] = useState(false);
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const token = searchParams.get("token");
  const { showMsg } = useMsg();
  useEffect(() => {
    async function verify() {
      const result = await verifyUser(email as string, token as string);
      if (!result.verified) {
        if (result.tokenExpired) setExpiredStatus(true);
        showMsg(result.error, "error", 6000);
      } else {
        showMsg("Your account has been verified successfully", "success", 6000);
      }
    }
    verify();
  }, [email, showMsg, token]);
  async function handleReset() {
    const refresh = await refreshUserToken((email as string))
    if(!refresh.success){
      showMsg(refresh.message, "error", 6000);
    } else{
      showMsg(refresh.message, "success", 6000);
    }
  }
  return (
    <>
      <section className={styles.verifyPageText}>
        {isTokenExpired ? (
          <div className={styles.resetContainer}>
            <p>
              Your verification token expired, click below to reset it
            </p>
            <button onClick={handleReset} className={styles.submitBtn}>Reset Token</button>
          </div>
        ) : (
          <p>Verifing your account</p>
        )}
      </section>
    </>
  );
}
