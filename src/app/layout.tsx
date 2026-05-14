import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hip-Hop & R&B Forge",
  description: "AI-powered hip-hop & R&B composition suite",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}