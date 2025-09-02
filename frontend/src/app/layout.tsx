import type { Metadata } from "next";
import { Inter } from "next/font/google";

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
          <h1 className="text-xl font-semibold">Gemini Media Search</h1>
        </header>
        <main className="p-4">{children}</main>
      </body>
    </html>
  );
}
