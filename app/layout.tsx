import "@/app/styles/root.css";
import Header from "@/components/Header";

export const metadata = {
  title: "Auth",
  Description: "Authentication system from scratch",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
