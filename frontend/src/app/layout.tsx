import type { Metadata } from "next";
import { Inter } from "next/font/google";

import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gemini Media Search",
  description: "AI-Powered Video Discovery",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="p-4 border-b">
          <Link className="text-xl font-semibold" href="/">
            Gemini Media Search
          </Link>
        </header>
        <main className="p-4">{children}</main>
      </body>
    </html>
  );
}
