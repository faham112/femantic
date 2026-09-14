"use client";
import Link from "next/link";
import { BarChart3 } from "lucide-react";

export default function AuthChrome({
  children,
  active = "login",
}: {
  children: React.ReactNode;
  active?: "login" | "register";
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#071a2e] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#071a2e]/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-700 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Femantic</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-white/80">
            <Link href="/#features" className="hover:text-white">Features</Link>
            <Link href="/#pricing" className="hover:text-white">Pricing</Link>
            <Link href="/#faq" className="hover:text-white">FAQ</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className={`text-sm px-3 py-1.5 rounded-lg ${active === "login" ? "bg-white/15 text-white font-semibold" : "text-white/80 hover:text-white"}`}
            >
              Log in
            </Link>
            <Link
              href="/register"
              className={`text-sm px-3 py-1.5 rounded-lg font-semibold ${active === "register" ? "bg-accent text-white" : "border border-white/30 hover:bg-white/10"}`}
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-14">
        {children}
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-white/50">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Femantic · Track real-time. Track true.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <Link href="/#pricing" className="hover:text-white">Pricing</Link>
            <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
            <Link href="/admin" className="hover:text-white">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
