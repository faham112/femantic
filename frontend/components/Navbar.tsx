"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import {
  BarChart3,
  LogOut,
  LayoutDashboard,
  Users,
  Menu,
  X,
  Shield,
} from "lucide-react";
import { useState } from "react";

interface NavbarProps {
  user?: {
    email: string;
    role: string;
    full_name?: string;
    brand_name?: string;
  };
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const logout = () => {
    Cookies.remove("token");
    router.push("/login");
  };

  const isProOrAdmin = user?.role === "admin" || user?.role === "pro";
  const isClient = user?.role === "client";

  return (
    <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white hidden sm:inline">
              {isClient && user?.brand_name ? user.brand_name : "Femantic"}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            {isProOrAdmin && (
              <Link
                href="/dashboard/invites"
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <Shield className="w-4 h-4" />
                Invites
              </Link>
            )}
            {user?.role === "admin" && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <Users className="w-4 h-4" />
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400 hidden md:inline truncate max-w-[140px]">
              {user?.full_name || user?.email}
              {isClient && (
                <span className="ml-1 text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">
                  Client
                </span>
              )}
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-400 px-2 py-1.5 rounded-lg hover:bg-red-500/10 transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>

            <button
              onClick={() => setOpen(!open)}
              className="sm:hidden p-2 text-slate-400"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="sm:hidden pb-4 space-y-1 border-t border-slate-800 pt-2">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-slate-300 rounded-lg hover:bg-slate-800"
            >
              Dashboard
            </Link>
            {isProOrAdmin && (
              <Link
                href="/dashboard/invites"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-slate-300 rounded-lg hover:bg-slate-800"
              >
                Invite Tokens
              </Link>
            )}
            {user?.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-slate-300 rounded-lg hover:bg-slate-800"
              >
                Admin Panel
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
