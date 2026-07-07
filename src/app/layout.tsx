import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MatchDay GAA — Match Recording App",
  description: "Record Gaelic football and hurling matches pitch-side with offline support",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MatchDay",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
