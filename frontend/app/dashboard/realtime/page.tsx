"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import api, { getMe } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { MiniBars } from "@/components/Charts";
import { Loader2, Smartphone, Tablet, Search, Link2 } from "lucide-react";

function RealtimeInner() {
  const router = useRouter();
  const params = useSearchParams();
  const websiteId = params.get("id");
  const [user, setUser] = useState<any>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [live, setLive] = useState<any>(null);
  const [minutes, setMinutes] = useState(5);
  const [tab, setTab] = useState<"source" | "content" | "country">("source");
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
  const dTotal = Object.values(devices).reduce((s: number, n: any) => s + Number(n || 0), 0) || 1;
  const m = Math.round(((devices.mobile || 0) / dTotal) * 100);
  const t = Math.round(((devices.tablet || 0) / dTotal) * 100);
  const rows =
    tab === "content" ? live?.sources_content || [] :
    tab === "country" ? live?.source_country || [] :
    live?.sources || [];
  const filtered = rows.filter((r: any) =>
    `${r.source} ${r.medium}`.toLowerCase().includes(q.toLowerCase())
  ).slice(0, limit);
  const col2 = tab === "content" ? "Content" : tab === "country" ? "Country" : "Medium";

  return (
    <AppShell user={user} websites={sites} title="Real Time / Sources">
      <div className="max-w-xl lg:max-w-none mx-auto space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[13px] text-slate-500">Real Time <span className="text-navy-700 font-medium">/ Sources</span></div>
          <div className="flex gap-1">
            <span className="text-xs bg-navy-700 text-white rounded-full px-3 py-1">Active users</span>
            <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="text-xs bg-white border border-slate-200 rounded-full px-2 py-1">
              <option value={5}>5 minutes</option>
              <option value={30}>30 minutes</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card text-center">
          <div className="text-sm text-slate-500">In the last {minutes} minutes</div>
          <div className="text-6xl font-bold text-navy-800 mt-2 leading-none">{live?.live_visitors ?? 0}</div>
          <div className="text-sm text-slate-500 mt-2">Active Users</div>
          <div className="mt-5 flex justify-center gap-8 text-xs text-slate-600">
            <span className="flex items-center gap-1"><Smartphone className="w-4 h-4 text-navy-700" /> Mobile {m}%</span>
            <span className="flex items-center gap-1"><Tablet className="w-4 h-4 text-purple-600" /> Tablet {t}%</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-card">
          <div className="text-sm font-semibold text-slate-700 mb-1">Pageviews - Last 30 minutes</div>
          <div className="h-28"><MiniBars values={live?.minute_series?.length ? live.minute_series : Array(30).fill(1)} color="#7dd3fc" /></div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1"><span>-29m</span><span>-2m</span></div>
        </div>

        <div className="bg-[#0d4f7a] text-white rounded-2xl p-4 shadow-card">
          <div className="text-sm font-semibold text-white/85 mb-2">Pageviews - Last minute</div>
          <MiniBars values={live?.last_minute_series?.length ? live.last_minute_series : Array(12).fill(2)} color="#ffffff" />
          <div className="flex justify-between text-[10px] text-white/50 mt-1"><span>-60s</span><span>-5s</span></div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {([["source", "Source"], ["content", "Sources + Content"], ["country", "Source + Country"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`shrink-0 px-3 py-1.5 text-xs rounded-full border ${tab === k ? "bg-navy-700 text-white border-navy-700" : "bg-white border-slate-200"}`}>{l}</button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-card">
          <div className="bg-[#0d4f7a] text-white px-4 py-2.5 text-sm font-semibold">Source / Medium</div>
          <div className="px-3 py-2 flex gap-2 border-b border-slate-100">
            <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="text-xs border border-slate-200 rounded-md px-2 py-1">
              <option value={10}>10 entries</option>
              <option value={20}>20 entries</option>
              <option value={40}>40 entries</option>
            </select>
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1.5" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Source/Medium" className="w-full border border-slate-200 rounded-md pl-7 pr-2 py-1 text-xs" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead className="text-left text-xs text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-3 py-2 font-medium">Source</th>
                  <th className="px-3 py-2 font-medium">{col2}</th>
                  <th className="px-3 py-2 font-medium w-24">Active Users</th>
                  <th className="px-3 py-2 font-medium w-24">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r: any, i: number) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-3 py-2 truncate max-w-[140px]"><Link2 className="w-3.5 h-3.5 inline mr-1 text-slate-400" />{r.source}</td>
                    <td className="px-3 py-2 truncate max-w-[160px]">{r.medium}</td>
                    <td className="px-3 py-2 font-semibold">{r.users}</td>
                    <td className="px-3 py-2 text-slate-500">{r.pct}%</td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-400 text-sm">No live sources in this window</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function RealtimePage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin" /></div>}><RealtimeInner /></Suspense>;
}
