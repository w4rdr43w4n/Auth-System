import styles from "@/components/Auth/providers/styles/providers.module.css";
import { images } from "@/config/assets";
import { authUrl } from "@/config/config";
import Image from "next/image";

export default function GoogleProvider() {
  return (
      <a className={styles.googleBtn} href={authUrl} >
        <Image
        width={20}
        height={20}
        alt="google_logo"
        src={images.GoogleLogo}
        className={styles.googleLogo}
      />
        Sign in with Google
      </a>
  );
}
