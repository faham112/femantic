import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Femantic – Real-time True Traffic Analytics",
  description: "Track real-time and true website traffic. Multi-user Publytics platform. Fully responsive.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased">
        {children}
      </body>
    </html>
  );
}
