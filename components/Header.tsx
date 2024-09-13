import { pages } from "@/components/config/headerConfig";
import styles from "./styles/header.module.css";
import { HeaderAccountPanel } from "./HeaderAccountPanel";
import { Suspense } from "react";
export default function Header() {
  return (
    <div className={styles.bar}>
      <h1 className={styles.title}>Auth</h1>
      <div className={styles.links}>
        {pages.map((l, i) => (
          <a className={styles.link} key={i} href={l.link}>
            {l.name}
          </a>
        ))}
      </div>
      <Suspense fallback={<h1>loading...</h1>}>
        <HeaderAccountPanel />
      </Suspense>
    </div>
  );
}
