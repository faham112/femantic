"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import api, { getMe } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { MiniBars } from "@/components/Charts";
import { Loader2, Smartphone, Tablet, Monitor, Search, Link2 } from "lucide-react";

function DeviceBar({ label, icon: Icon, pct, color }: { label: string; icon: any; pct: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
        <span className="inline-flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" style={{ color }} />{label}</span>
        <span className="font-semibold">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function RealtimeInner() {
  const router = useRouter();
  const params = useSearchParams();
  const websiteId = params.get("id");
  const isSources = params.get("view") === "sources";
  const [user, setUser] = useState<any>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [live, setLive] = useState<any>(null);
  const [minutes, setMinutes] = useState(5);
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);

  const load = async (id: string | number) => {
    const l = await api.get(`/api/realtime/live/${id}?minutes=${minutes}`);
    setLive(l.data);
  };

  useEffect(() => {
    if (!Cookies.get("token")) { router.push("/login"); return; }
    let timer: any;
    (async () => {
      try {
        const [me, w] = await Promise.all([getMe(), api.get("/api/websites/")]);
        setUser(me); setSites(w.data);
        const id = websiteId || w.data[0]?.id;
        if (id) { await load(id); timer = setInterval(() => load(id), 8000); }
      } catch { router.push("/login"); }
      finally { setLoading(false); }
    })();
    return () => timer && clearInterval(timer);
  }, [router, websiteId, minutes]);

  if (loading && !live) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-navy-600" /></div>;

  const devices = live?.devices || {};
  const dTotal = Math.max(1, Number(devices.mobile || 0) + Number(devices.tablet || 0) + Number(devices.desktop || 0));
  const mobile = Math.round(((devices.mobile || 0) / dTotal) * 100);
  const tablet = Math.round(((devices.tablet || 0) / dTotal) * 100);
  const desktop = Math.max(0, 100 - mobile - tablet);
  const rows = (live?.sources || []).filter((r: any) => `${r.source} ${r.medium}`.toLowerCase().includes(q.toLowerCase())).slice(0, limit);
  const pages = live?.top_pages_live || [];

  return (
    <AppShell user={user} websites={sites} title={isSources ? "Real Time / Sources" : "Real Time / Overview"}>
      <div className="w-full max-w-[1400px] mx-auto space-y-3 lg:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-[13px] text-slate-500">Real Time <span className="text-navy-700 font-medium">/ {isSources ? "Sources" : "Overview"}</span></div>
          <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="text-xs bg-white border border-slate-200 rounded-full px-3 py-1 w-fit">
            <option value={5}>Last 5 minutes</option>
            <option value={30}>Last 30 minutes</option>
          </select>
        </div>

        {!isSources && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card text-center">
                <div className="text-sm text-slate-500">In the last {minutes} minutes</div>
                <div className="text-5xl sm:text-6xl font-bold text-navy-800 mt-2 leading-none">{live?.live_visitors ?? 0}</div>
                <div className="text-sm text-slate-500 mt-2">Active Users</div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-card">
                <div className="text-sm font-semibold text-slate-700 mb-1">Pageviews — last 30 min</div>
                <div className="h-24 sm:h-28"><MiniBars values={live?.minute_series?.length ? live.minute_series : Array(30).fill(1)} color="#7dd3fc" /></div>
              </div>
              <div className="bg-[#0d4f7a] text-white rounded-2xl p-4 shadow-card">
                <div className="text-sm font-semibold text-white/85 mb-2">Pageviews — last minute</div>
                <MiniBars values={live?.last_minute_series?.length ? live.last_minute_series : Array(12).fill(2)} color="#ffffff" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-card space-y-4">
                <h3 className="text-sm font-semibold text-navy-800">Devices</h3>
                <DeviceBar label="Desktop" icon={Monitor} pct={desktop} color="#38bdf8" />
                <DeviceBar label="Mobile" icon={Smartphone} pct={mobile} color="#0d4f7a" />
                <DeviceBar label="Tablet" icon={Tablet} pct={tablet} color="#a855f7" />
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-card">
                <h3 className="text-sm font-semibold text-navy-800 mb-2">Active pages</h3>
                <ul className="divide-y divide-slate-100">
                  {pages.slice(0, 8).map((p: any) => (
                    <li key={p.path} className="py-2 flex justify-between text-sm gap-2">
                      <span className="truncate">{p.path}</span>
                      <span className="font-semibold shrink-0">{p.views}</span>
                    </li>
                  ))}
                  {!pages.length && <li className="py-8 text-center text-sm text-slate-400">No live pages</li>}
                </ul>
              </div>
            </div>
          </>
        )}

        {isSources && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-card">
            <div className="bg-[#0d4f7a] text-white px-4 py-2.5 text-sm font-semibold">Source / Medium</div>
            <div className="px-3 py-2 flex flex-col sm:flex-row gap-2 border-b border-slate-100">
              <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="text-xs border border-slate-200 rounded-md px-2 py-1 w-fit">
                <option value={10}>10 entries</option>
                <option value={20}>20 entries</option>
                <option value={40}>40 entries</option>
              </select>
              <div className="relative flex-1 min-w-0">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1.5" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter source / medium" className="w-full border border-slate-200 rounded-md pl-7 pr-2 py-1 text-xs" />
              </div>
            </div>
            <div className="table-scroll">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-3 py-2 font-medium">Source</th>
                    <th className="px-3 py-2 font-medium">Medium</th>
                    <th className="px-3 py-2 font-medium w-24">Active Users</th>
                    <th className="px-3 py-2 font-medium w-24">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r: any, i: number) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-3 py-2 truncate max-w-[160px]"><Link2 className="w-3.5 h-3.5 inline mr-1 text-slate-400" />{r.source}</td>
                      <td className="px-3 py-2 truncate max-w-[180px]">{r.medium}</td>
                      <td className="px-3 py-2 font-semibold">{r.users}</td>
                      <td className="px-3 py-2 text-slate-500">{r.pct}%</td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-400 text-sm">No live sources in this window</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function RealtimePage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin" /></div>}><RealtimeInner /></Suspense>;
}
