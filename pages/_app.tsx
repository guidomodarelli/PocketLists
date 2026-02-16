import type { AppProps } from "next/app";
import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Geist_Mono, Outfit } from "next/font/google";
import { Toaster } from "sonner";
import ThemeToggle from "@/components/shared/ThemeToggle/ThemeToggle";
import "@/app/globals.css";
import styles from "@/app/layout.module.scss";
import { createQueryClient } from "@/lib/query-client";

const outfitSans = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <div className={`${outfitSans.variable} ${geistMono.variable} ${styles["root-layout__body"]}`}>
        <ThemeToggle />
        <Component {...pageProps} />
        <Toaster richColors />
      </div>
    </QueryClientProvider>
  );
}
