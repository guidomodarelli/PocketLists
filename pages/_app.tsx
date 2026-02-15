import type { AppProps } from "next/app";
import { Geist_Mono, Outfit } from "next/font/google";
import ThemeToggle from "@/components/shared/ThemeToggle/ThemeToggle";
import "@/app/globals.css";
import styles from "@/app/layout.module.scss";

const outfitSans = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${outfitSans.variable} ${geistMono.variable} ${styles["root-layout__body"]}`}>
      <ThemeToggle />
      <Component {...pageProps} />
    </div>
  );
}
