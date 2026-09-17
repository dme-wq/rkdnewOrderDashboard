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
        {/* Inter font via link tag — avoids CSS @import conflict with Tailwind v4 */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
