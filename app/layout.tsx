import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Karigar Production Dashboard — RKD Bathmat Tufting",
  description:
    "Live production tracker for RKD Bathmat Tufting. Monitor karigar output daily, weekly, monthly, and quarterly.",
  keywords: ["karigar", "production", "bathmat", "tufting", "dashboard", "rkd"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body style={{ fontFamily: "'Inter', sans-serif" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
