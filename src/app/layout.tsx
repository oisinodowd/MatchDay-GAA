import type { Metadata } from "next";
import "./globals.css";
import Scoreboard from "@/components/scoreboard/Scoreboard";
import UndoButton from "@/components/undo-button/UndoButton";

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
      <body className="min-h-screen bg-gray-50">
        <Scoreboard />
        <main className="pt-16 pb-20">{children}</main>
        <UndoButton />
      </body>
    </html>
  );
}
