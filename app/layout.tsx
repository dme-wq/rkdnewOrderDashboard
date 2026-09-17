import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Karigar Production Dashboard — RKD Furnishings Pvt. Ltd.",
  description:
    "Live production tracker for RKD Furnishings Private Limited — Bathmat Tufting. Monitor karigar output daily, weekly, monthly, and quarterly.",
  keywords: ["karigar", "production", "bathmat", "tufting", "dashboard", "rkd", "furnishings"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Plus Jakarta Sans — premium modern font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
