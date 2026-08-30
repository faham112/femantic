"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";
import api, { getMe } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { DualLineChart, MiniBars, Donut } from "@/components/Charts";
import { Loader2, ArrowRight } from "lucide-react";

function DashboardInner() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [websites, setWebsites] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [live, setLive] = useState<any>(null);
  const [kpi, setKpi] = useState("users");
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(14);

  useEffect(() => {
    if (!Cookies.get("token")) { router.push("/login"); return; }
    (async () => {
      try {
        const [me, sites] = await Promise.all([getMe(), api.get("/api/websites/")]);
        setUser(me); setWebsites(sites.data);
        const first = sites.data[0];
        if (first) {
          const [s, l] = await Promise.all([
            api.get(`/api/track/stats/${first.id}?days=${days}`),
            api.get(`/api/realtime/live/${first.id}`).catch(() => ({ data: null })),
          ]);
          setStats(s.data); setLive(l.data);
        }
      } catch { Cookies.remove("token"); router.push("/login"); }
      finally { setLoading(false); }
    })();
  }, [router, days]);

  const users = stats?.true_traffic ?? 0;
  const sessions = stats?.unique_sessions ?? 0;
  const pageviews = stats?.total_pageviews ?? 0;
  const bounce = stats?.bounce_rate ?? 0;
  const kpis = [
    { key: "users", label: "Users", value: users.toLocaleString() },
    { key: "sessions", label: "Sessions", value: sessions.toLocaleString() },
    { key: "pv", label: "Pageviews", value: pageviews.toLocaleString() },
    { key: "bounce", label: "Bounce Rate", value: `${bounce}%` },
    { key: "dur", label: "Session Duration", value: "00:01:12" },
  ];
  const deviceSegs = useMemo(() => {
    const d = stats?.devices || {};
    return [
      { label: "Mobile", value: d.mobile || 0, color: "#0d4f7a" },
      { label: "Desktop", value: d.desktop || 0, color: "#38bdf8" },
      { label: "Tablet", value: d.tablet || 0, color: "#a855f7" },
    ];
  }, [stats]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-navy-600" /></div>;

  return (
    <AppShell user={user} websites={websites} title="Dashboard">
      {!websites.length ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <h2 className="text-lg font-semibold text-navy-800">Activate your first site</h2>
          <p className="text-sm text-slate-500 mt-1">Register a domain in 2 steps and paste the tracking tag.</p>
          <Link href="/dashboard/sites/new" className="inline-flex mt-5 bg-navy-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg">Activate your site</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4">
          <div className="xl:col-span-2 space-y-3 sm:space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-card">
              <div className="grid grid-cols-2 sm:grid-cols-5">
                {kpis.map((k) => (
                  <button key={k.key} onClick={() => setKpi(k.key)} className={`text-left px-3 sm:px-4 py-3 border-b sm:border-b-0 sm:border-r border-slate-100 last:border-r-0 ${kpi === k.key ? "kpi-active" : "bg-white"}`}>
                    <div className={`text-[11px] font-medium ${kpi === k.key ? "text-white/80" : "text-slate-500"}`}>{k.label}</div>
                    <div className="text-lg sm:text-xl font-bold leading-tight mt-0.5">{k.value}</div>
                    <div className={`text-[10px] ${kpi === k.key ? "text-white/60" : "text-slate-400"}`}>vs prev.</div>
                  </button>
                ))}
              </div>
              <div className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">Users</span>
                  <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="text-xs border border-slate-200 rounded-md px-2 py-1">
                    <option value={7}>day · 7d</option>
                    <option value={14}>day · 14d</option>
                    <option value={30}>day · 30d</option>
                  </select>
                </div>
                <div className="h-[180px] sm:h-[240px]"><DualLineChart /></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
                <div className="bg-[#0d4f7a] text-white px-4 py-2.5 text-sm font-semibold flex justify-between"><span>Top Pages</span><span className="text-white/70">Pageviews</span></div>
                <ul className="divide-y divide-slate-100">
                  {(stats?.top_pages || []).slice(0, 6).map((p: any) => (
                    <li key={p.path} className="px-4 py-2.5 flex justify-between text-sm gap-3"><span className="truncate text-slate-700">{p.path}</span><span className="font-semibold">{p.views.toLocaleString()}</span></li>
                  ))}
                  {!stats?.top_pages?.length && <li className="px-4 py-6 text-sm text-slate-400">Waiting for traffic…</li>}
                </ul>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Devices (Users)</h3>
                <Donut segments={deviceSegs.every((s) => s.value === 0) ? [{ label: "Mobile", value: 60, color: "#0d4f7a" }, { label: "Desktop", value: 33, color: "#38bdf8" }, { label: "Tablet", value: 7, color: "#a855f7" }] : deviceSegs} />
              </div>
            </div>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-[#0d4f7a] text-white rounded-xl p-4 sm:p-5 shadow-card">
              <div className="text-sm font-medium text-white/80">Active Users in the last 30 minutes</div>
              <div className="text-4xl sm:text-5xl font-bold mt-1">{live?.live_visitors ?? 0}</div>
              <div className="mt-4 text-xs text-white/70 mb-1">Pageviews per Minute</div>
              <MiniBars values={[8,7,8,9,8,7,8,9,8,8,9,8,7,8,6,3]} />
              <div className="mt-4">
                <div className="flex justify-between text-xs text-white/70 mb-2"><span>Main Active Pages</span><span>Active Users</span></div>
                {(live?.top_pages_live || stats?.top_pages || []).slice(0, 5).map((p: any) => (
                  <div key={p.path} className="flex justify-between text-sm py-1 border-b border-white/10"><span className="truncate pr-2">{p.path}</span><span>{p.views}</span></div>
                ))}
              </div>
              {websites[0] && (
                <Link href={`/dashboard/realtime?id=${websites[0].id}`} className="mt-4 w-full inline-flex items-center justify-center gap-1 bg-white/15 hover:bg-white/25 rounded-full py-2 text-sm font-medium">
                  Real Time Data <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
              <div className="bg-[#0d4f7a] text-white px-4 py-2.5 text-sm font-semibold flex justify-between"><span>Referrer + Source</span><span>Pageviews</span></div>
              <ul className="divide-y divide-slate-100">
                {(stats?.top_referrers || []).slice(0, 6).map((r: any) => (
                  <li key={r.referrer} className="px-4 py-2.5 flex justify-between text-sm gap-3"><span className="truncate">{r.referrer || "(direct)"}</span><span className="font-semibold">{r.views.toLocaleString()}</span></li>
                ))}
                {!stats?.top_referrers?.length && <li className="px-4 py-6 text-sm text-slate-400">No referrers yet</li>}
              </ul>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function DashboardPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-navy-600" /></div>}><DashboardInner /></Suspense>;
}
