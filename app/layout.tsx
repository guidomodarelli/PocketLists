import type { Metadata } from "next";
import { Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import styles from "./layout.module.scss";
import ThemeToggle from "@/components/shared/ThemeToggle/ThemeToggle";

const outfitSans = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PocketLists",
  description: "Listas jerárquicas con completado inteligente",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body
        className={`${outfitSans.variable} ${geistMono.variable} ${styles["root-layout__body"]}`}
      >
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
