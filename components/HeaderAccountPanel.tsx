import { getSession, logout } from "@/lib/auth";
import styles from "./styles/header.module.css";
export async function HeaderAccountPanel() {
  const session = await getSession();
  return (
    <>
      {session ? (
        <form
          className={styles.account}
          action={async () => {
            "use server";
            await logout();
          }}
        >
          <h1 className={styles.accountAvatar}>{session.user.username[0]}</h1>
          <button className={styles.logout} type="submit">
            Logout
          </button>
        </form>
      ) : (
        <div className={styles.account}>
          <a className={styles.login_control} href="/auth/login">
            Login
          </a>
          <a className={styles.login_control} href="/auth/register">
            Register
          </a>
        </div>
      )}
    </>
  );
}
