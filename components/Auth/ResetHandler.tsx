"use client";

import styles from "@/components/styles/auth.module.css";
import { checkToken, resetPassword } from "@/lib/auth";
import {useEffect, useState } from "react";
import { useMsg } from "@/context/MsgContext";
import { useRouter } from "next/navigation";
import Captcha from "./Recaptcha";

interface props {
  email: string;
  token: string;
}

export default function ResetHandler({ email, token }: props) {
  const [data, setData] = useState({ password: "", passwordC: "" });
  const [validToken, setValid] = useState(false);
  const { showMsg } = useMsg();
  const router = useRouter();
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (data.password !== data.passwordC) {
      showMsg("Passwords did not match", "error");
      return;
    }
    const reset = await resetPassword(email, data.password);
    if (reset.success) {
      showMsg("Yout G6 Account Password Reset successfully", "success");
      router.push("/auth/login");
    } else showMsg(reset.message, "error");
  }
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };
  useEffect(() => {
    async function check() {
      const res = await checkToken(email, token);
      setValid(res.success);
      showMsg(res.message, "info");
    }
    check();
  }, [email, showMsg, token]);
  return (
    <>
      {!validToken ? (
        <p className={styles.verifyPageText}>Reseting your password...</p>
      ) : (
        <form className={styles.resetForm} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              New Password
            </label>
            <input
              className={styles.entry}
              placeholder="Password"
              name="password"
              value={data.password}
              onChange={handleChange}
              type="password"
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="passwordC">
              Confirm Password
            </label>
            <input
              className={styles.entry}
              placeholder="Confirm Password"
              name="passwordC"
              value={data.passwordC}
              onChange={handleChange}
              type="password"
              required
            />
          </div>
          <button className={styles.resetBtn} type="submit">
            Reset Your Password
          </button>
        </form>
      )}
      <Captcha action="homepage" />
    </>
  );
}
