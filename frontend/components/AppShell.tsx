"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3, LayoutDashboard, Radio, Users, FileText, Bot, Megaphone, Activity,
  LineChart, Settings, HelpCircle, Menu, X, LogOut, Globe, ChevronDown, Shield, Home,
} from "lucide-react";
import { clearTokens } from "@/lib/api";

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
  const dim = searchParams.get("dim");
  const current = websites.find((w) => String(w.id) === siteId) || websites[0];

  useEffect(() => {
    const skip = ["/dashboard", "/dashboard/sites/new", "/dashboard/plan", "/dashboard/settings", "/dashboard/help", "/admin"];
    if (!siteId && websites[0] && !skip.includes(pathname) && pathname.startsWith("/dashboard")) {
      const extra = dim ? `&dim=${dim}` : "";
      router.replace(`${pathname}?id=${websites[0].id}${extra}`);
    }
  }, [siteId, websites, pathname, router, dim]);

  const logout = () => { clearTokens(); router.push("/"); };
  const href = (path: string, extra = "") => {
    if (!current?.id || ["/", "/dashboard", "/dashboard/plan", "/dashboard/settings", "/dashboard/help"].includes(path)) return path;
    return `${path}?id=${current.id}${extra}`;
  };

  const isProOrAdmin = user?.role === "admin" || user?.role === "pro";
  const onRealtime = pathname.startsWith("/dashboard/realtime");
  const Sidebar = (
    <aside className="flex flex-col h-full bg-white border-r border-slate-200 w-[240px] min-w-[240px]">
      <Link href="/" className="px-4 h-14 flex items-center gap-2 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-navy-700 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-navy-800 tracking-tight">
          {user?.role === "client" && user?.brand_name ? user.brand_name : "Femantic"}
        </span>
      </Link>
      <nav className="flex-1 overflow-y-auto py-2 px-2 text-[13px]">
        <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50"><Home className="w-4 h-4" /> Home</Link>
        <Link href={current?.id ? `/dashboard?id=${current.id}` : "/dashboard"} onClick={() => setOpen(false)} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${pathname === "/dashboard" ? "bg-sky-50 text-navy-700 font-medium" : "text-slate-600 hover:bg-slate-50"}`}><LayoutDashboard className="w-4 h-4" /> Dashboard</Link>

        <Group icon={Radio} label="Real Time" openDefault={onRealtime}>
          <Sub href={href("/dashboard/realtime")} label="Overview" active={onRealtime} close={() => setOpen(false)} />
          <Sub href={href("/dashboard/realtime")} label="Sources" active={onRealtime} close={() => setOpen(false)} />
          <Sub href={href("/dashboard/content")} label="Content" active={pathname.startsWith("/dashboard/content")} close={() => setOpen(false)} />
          <Sub href={href("/dashboard/report", "&dim=country")} label="Country" active={dim === "country"} close={() => setOpen(false)} />
        </Group>

        <Group icon={Users} label="Audience" openDefault={pathname.startsWith("/dashboard/analytics") || ["device","browser","os","hostname"].includes(dim || "")}>
          <Sub href={href("/dashboard/analytics")} label="Overview" active={pathname.startsWith("/dashboard/analytics")} close={() => setOpen(false)} />
          <Sub href={href("/dashboard/report", "&dim=device")} label="Device" active={dim === "device"} close={() => setOpen(false)} />
          <Sub href={href("/dashboard/report", "&dim=country")} label="Country" active={dim === "country"} close={() => setOpen(false)} />
          <Sub href={href("/dashboard/report", "&dim=os")} label="Operating System" active={dim === "os"} close={() => setOpen(false)} />
          <Sub href={href("/dashboard/report", "&dim=browser")} label="Browser" active={dim === "browser"} close={() => setOpen(false)} />
          <Sub href={href("/dashboard/report", "&dim=hostname")} label="Hostname" active={dim === "hostname"} close={() => setOpen(false)} />
        </Group>

        <Link href={href("/dashboard/content")} onClick={() => setOpen(false)} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${pathname.startsWith("/dashboard/content") ? "bg-sky-50 text-navy-700 font-medium" : "text-slate-600 hover:bg-slate-50"}`}><FileText className="w-4 h-4" /> Content</Link>

        <Group icon={Bot} label="AI Traffic" badge="Beta" openDefault={dim === "traffic"}>
          <Sub href={href("/dashboard/report", "&dim=traffic")} label="Overview" active={dim === "traffic"} close={() => setOpen(false)} />
        </Group>

        <Group icon={Megaphone} label="Acquisition" openDefault={pathname.startsWith("/dashboard/acquisition") || ["entry","exit","utm_source","utm_medium","utm_campaign","source_medium","referrer","referrer_source"].includes(dim || "")}>
          <Sub href={href("/dashboard/report", "&dim=entry")} label="Entry pages" active={dim === "entry"} close={() => setOpen(false)} />
          <Sub href={href("/dashboard/report", "&dim=exit")} label="Exit pages" active={dim === "exit"} close={() => setOpen(false)} />
          <Sub href={href("/dashboard/report", "&dim=utm_source")} label="Source" active={dim === "utm_source"} close={() => setOpen(false)} />
          <Sub href={href("/dashboard/report", "&dim=utm_medium")} label="Medium" active={dim === "utm_medium"} close={() => setOpen(false)} />
          <Sub href={href("/dashboard/report", "&dim=utm_campaign")} label="Campaign" active={dim === "utm_campaign"} close={() => setOpen(false)} />
          <Sub href={href("/dashboard/report", "&dim=source_medium")} label="Source / Medium" active={dim === "source_medium"} close={() => setOpen(false)} />
          <Sub href={href("/dashboard/report", "&dim=referrer")} label="Referrer" active={dim === "referrer"} close={() => setOpen(false)} />
        </Group>

        <Group icon={Activity} label="Events" openDefault={pathname.startsWith("/dashboard/events")}>
          <Sub href={href("/dashboard/events")} label="Event Overview" active={pathname.startsWith("/dashboard/events")} close={() => setOpen(false)} />
          <Sub href={href("/dashboard/report", "&dim=path")} label="Page Overview" active={dim === "path"} close={() => setOpen(false)} />
        </Group>

        <Group icon={LineChart} label="Reports" openDefault={pathname.startsWith("/dashboard/report") && !dim}>
          <Sub href={href("/dashboard/report", "&dim=path")} label="All Reports" active={pathname.startsWith("/dashboard/report") && dim === "path"} close={() => setOpen(false)} />
        </Group>

        <Group icon={HelpCircle} label="Help" openDefault={pathname.startsWith("/dashboard/help")}>
          <Sub href="/dashboard/help" label="FAQ" active={pathname.startsWith("/dashboard/help")} close={() => setOpen(false)} />
          <Sub href="/dashboard/help" label="Create Ticket" active={false} close={() => setOpen(false)} />
          <Sub href="/dashboard/help" label="Documentation" active={false} close={() => setOpen(false)} />
          <Sub href="/dashboard/help" label="API Documentation" active={false} close={() => setOpen(false)} />
        </Group>

        <div className="h-px bg-slate-100 my-2" />
        {isProOrAdmin && <Link href={href("/dashboard/invites")} onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50"><Shield className="w-4 h-4" /> Invites</Link>}
        {user?.role === "admin" && <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50"><Users className="w-4 h-4" /> Admin</Link>}
        <Link href="/dashboard/settings" onClick={() => setOpen(false)} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${pathname.startsWith("/dashboard/settings") ? "bg-sky-50 text-navy-700 font-medium" : "text-slate-600 hover:bg-slate-50"}`}><Settings className="w-4 h-4" /> Settings</Link>
      </nav>
      <div className="p-3 border-t border-slate-100">
        <Link href="/dashboard/plan" className="block text-center text-xs font-semibold bg-navy-700 text-white rounded-lg py-2.5 hover:bg-navy-600">Plan Management</Link>
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
                    <button key={w.id} onClick={() => { setPicker(false); router.push(`${pathname}?id=${w.id}${dim ? `&dim=${dim}` : ""}`); }}
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
            <Link href="/dashboard/network" className="hidden sm:inline px-2 py-1 rounded-md bg-sky-50 text-navy-700 font-medium text-xs">Network</Link>
            <Link href="/" className="hidden sm:inline text-xs text-slate-500 hover:text-navy-700">Home</Link>
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

function Group({ icon: Icon, label, children, openDefault, badge }: { icon: any; label: string; children: React.ReactNode; openDefault?: boolean; badge?: string }) {
  const [open, setOpen] = useState(!!openDefault);
  useEffect(() => { if (openDefault) setOpen(true); }, [openDefault]);
  return (
    <div className="mt-0.5">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50">
        <Icon className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left font-medium">{label}</span>
        {badge && <span className="text-[9px] uppercase font-bold text-sky-700 bg-sky-50 px-1 rounded">{badge}</span>}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="ml-4 pl-3 border-l border-slate-100 py-0.5">{children}</div>}
    </div>
  );
}

function Sub({ href, label, active, close }: { href: string; label: string; active?: boolean; close: () => void }) {
  return (
    <Link href={href} onClick={close} className={`block px-3 py-1.5 rounded-md ${active ? "bg-sky-50 text-navy-700 font-medium" : "text-slate-500 hover:text-navy-700 hover:bg-slate-50"}`}>
      {label}
    </Link>
  );
}
