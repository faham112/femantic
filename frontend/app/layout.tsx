import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Femantic – Google Analytics Alternative for Publishers",
  description: "Accurate real-time and true-traffic analytics. GA4-style reports, fully responsive from 320px to desktop.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
