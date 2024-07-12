import { getSession } from "@/lib/auth";
import "./styles/home.css";

export default async function Home() {
  const session = await getSession();
  
  return (
    <section>
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </section>
  );
}
