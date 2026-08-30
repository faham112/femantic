"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import {
  BarChart3, LayoutDashboard, Radio, Users, FileText, Bot, Megaphone, Activity,
  LineChart, Settings, HelpCircle, Menu, X, LogOut, Globe, ChevronDown, Shield,
} from "lucide-react";

type Website = { id: number; name: string; domain: string };
type User = { email: string; role: string; full_name?: string; brand_name?: string };

export default function AppShell({
  user, websites = [], children, title = "Dashboard",
}: { user?: User | null; websites?: Website[]; children: React.ReactNode; title?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [picker, setPicker] = useState(false);
  const siteId = searchParams.get("id");
  const current = websites.find((w) => String(w.id) === siteId) || websites[0];

  useEffect(() => {
    if (!siteId && websites[0] && pathname !== "/dashboard" && pathname !== "/dashboard/sites/new") {
      router.replace(`${pathname}?id=${websites[0].id}`);
    }
  }, [siteId, websites, pathname, router]);

  const logout = () => { Cookies.remove("token"); router.push("/login"); };
  const withId = (href: string) => {
    if (!current?.id || href === "/dashboard") return href;
    return `${href}?id=${current.id}`;
  };

  const item = (href: string, label: string, Icon: any, active: boolean) => (
    <Link key={label} href={withId(href)} onClick={() => setOpen(false)}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium ${active ? "bg-sky-50 text-navy-700" : "text-slate-600 hover:bg-slate-50"}`}>
      <Icon className="w-4 h-4 shrink-0" />{label}
    </Link>
  );

  const isProOrAdmin = user?.role === "admin" || user?.role === "pro";
  const Sidebar = (
    <aside className="flex flex-col h-full bg-white border-r border-slate-200 w-[220px] min-w-[220px]">
      <div className="px-4 h-14 flex items-center gap-2 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-navy-700 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-navy-800 tracking-tight">
          {user?.role === "client" && user?.brand_name ? user.brand_name : "Femantic"}
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {item("/dashboard", "Dashboard", LayoutDashboard, pathname === "/dashboard")}
        {item("/dashboard/realtime", "Real Time", Radio, pathname.startsWith("/dashboard/realtime"))}
        {item("/dashboard/analytics", "Audience", Users, pathname.startsWith("/dashboard/analytics"))}
        {item("/dashboard/analytics", "Content", FileText, false)}
        {item("/dashboard/analytics", "AI Traffic", Bot, false)}
        {item("/dashboard/analytics", "Acquisition", Megaphone, false)}
        {item("/dashboard/analytics", "Events", Activity, false)}
        {item("/dashboard/analytics", "Reports", LineChart, false)}
        <div className="h-px bg-slate-100 my-2" />
        {isProOrAdmin && item("/dashboard/invites", "Invites", Shield, pathname.startsWith("/dashboard/invites"))}
        {user?.role === "admin" && item("/admin", "Admin", Users, pathname.startsWith("/admin"))}
        {item("/dashboard/sites/new", "Settings", Settings, pathname.startsWith("/dashboard/sites"))}
        <a href="#help" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-slate-600 hover:bg-slate-50">
          <HelpCircle className="w-4 h-4" /> Help
        </a>
      </nav>
      <div className="p-3 border-t border-slate-100">
        <Link href="/register" className="block text-center text-xs font-semibold bg-navy-700 text-white rounded-lg py-2.5 hover:bg-navy-600">Plan Management</Link>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#f3f5f8] flex">
      <div className="hidden lg:flex sticky top-0 h-screen">{Sidebar}</div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy-900/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full shadow-xl">{Sidebar}</div>
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
          <div className="h-14 px-3 sm:px-5 flex items-center gap-2 sm:gap-3">
            <button className="lg:hidden p-2 text-slate-600" onClick={() => setOpen(true)} aria-label="Menu">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="relative">
              <button onClick={() => setPicker((v) => !v)} className="flex items-center gap-2 max-w-[160px] sm:max-w-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm hover:bg-slate-50">
                <Globe className="w-4 h-4 text-navy-600 shrink-0" />
                <span className="truncate font-medium text-slate-800">{current?.domain || current?.name || "Select site"}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {picker && (
                <div className="absolute left-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
                  {websites.length === 0 && <p className="px-3 py-2 text-sm text-slate-500">No websites yet</p>}
                  {websites.map((w) => (
                    <button key={w.id} onClick={() => { setPicker(false); router.push(`${pathname === "/dashboard" ? "/dashboard/analytics" : pathname}?id=${w.id}`); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">
                      <div className="font-medium text-slate-800 truncate">{w.name}</div>
                      <div className="text-xs text-slate-500 truncate">{w.domain}</div>
                    </button>
                  ))}
                  {isProOrAdmin && (
                    <Link href="/dashboard/sites/new" onClick={() => setPicker(false)} className="block px-3 py-2 text-sm text-navy-700 font-medium border-t border-slate-100">+ Activate new site</Link>
                  )}
                </div>
              )}
            </div>
            <span className="hidden sm:inline px-2 py-1 rounded-md bg-sky-50 text-navy-700 font-medium text-xs">Site</span>
            <div className="ml-auto flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="hidden md:block text-xs text-slate-500 truncate max-w-[140px]">{user?.full_name || user?.email}</span>
              <div className="w-8 h-8 rounded-full bg-navy-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                {(user?.full_name || user?.email || "U").charAt(0).toUpperCase()}
              </div>
              <button onClick={logout} className="p-2 text-slate-500 hover:text-red-500" aria-label="Logout"><LogOut className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="px-3 sm:px-5 h-9 flex items-center text-[13px] text-slate-500 border-t border-slate-100">{title}</div>
        </header>
        <main className="flex-1 p-3 sm:p-5">{children}</main>
      </div>
    </div>
  );
}
