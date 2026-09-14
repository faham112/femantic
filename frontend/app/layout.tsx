import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Femantic – Google Analytics Alternative for Publishers",
  description: "Accurate real-time and true-traffic analytics. GA4-style reports, fully responsive from 320px to desktop.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className="min-h-screen min-w-[320px] antialiased overflow-x-hidden">{children}</body>
    </html>
  );
}
