"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import api, { getMe } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { MiniBars } from "@/components/Charts";
import { Loader2, Smartphone, Monitor, Tablet } from "lucide-react";

function RealtimeInner() {
  const router = useRouter();
  const params = useSearchParams();
  const websiteId = params.get("id");
  const [user, setUser] = useState<any>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [live, setLive] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [tab, setTab] = useState("path");
  const [loading, setLoading] = useState(true);

  const load = async (id: string | number) => {
    const [l, s] = await Promise.all([
      api.get(`/api/realtime/live/${id}`),
      api.get(`/api/track/stats/${id}?days=1`).catch(() => ({ data: null })),
    ]);
    setLive(l.data); setStats(s.data);
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
  }, [router, websiteId]);

  if (loading && !live) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-navy-600" /></div>;
  const devices = stats?.devices || {};
  const dTotal = (devices.mobile || 0) + (devices.desktop || 0) + (devices.tablet || 0) || 1;
  const m = Math.round(((devices.mobile || 0) / dTotal) * 100);
  const d = Math.round(((devices.desktop || 0) / dTotal) * 100);
  const t = Math.max(0, 100 - m - d);

  return (
    <AppShell user={user} websites={sites} title="Real Time / Overview">
      <div className="flex flex-wrap items-center justify-end gap-2 mb-3">
        <span className="text-xs bg-white border border-slate-200 rounded-full px-3 py-1">Active users</span>
        <span className="text-xs bg-white border border-slate-200 rounded-full px-3 py-1">30 minutes</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
          <div className="text-center">
            <div className="text-sm text-slate-500">In the last 30 minutes</div>
            <div className="text-5xl font-bold text-navy-800 mt-2">{live?.live_visitors ?? 0}</div>
            <div className="text-sm text-slate-500 mt-1">Active Users</div>
          </div>
          <div className="mt-5 flex justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1"><Smartphone className="w-3.5 h-3.5" /> Mobile {m}%</span>
            <span className="flex items-center gap-1"><Monitor className="w-3.5 h-3.5" /> Desktop {d}%</span>
            <span className="flex items-center gap-1"><Tablet className="w-3.5 h-3.5" /> Tablet {t}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full overflow-hidden flex bg-slate-100">
            <div className="bg-navy-700" style={{ width: `${m}%` }} />
            <div className="bg-sky-400" style={{ width: `${d}%` }} />
            <div className="bg-purple-500" style={{ width: `${t}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-card">
          <div className="text-sm font-semibold text-slate-700 mb-2">Pageviews · Last 30 minutes</div>
          <div className="h-28 flex items-end"><MiniBars values={[40,42,44,43,38,41,44,36,32,35,36,35]} color="#7dd3fc" /></div>
        </div>
        <div className="bg-[#0d4f7a] text-white rounded-xl p-4 shadow-card">
          <div className="text-sm font-semibold text-white/80 mb-2">Pageviews · Last minute</div>
          <MiniBars values={[28,26,25,27,24,26,32,33,31,33,35,22]} color="#ffffff" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {[["path", "Pathname"], ["device", "Device"], ["ref", "Referrer + Source"], ["country", "Country"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-3 py-1.5 text-xs rounded-full border ${tab === k ? "bg-navy-700 text-white border-navy-700" : "bg-white border-slate-200"}`}>{l}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <div className="bg-[#0d4f7a] text-white px-4 py-2.5 text-sm font-semibold flex justify-between"><span>{tab === "ref" ? "Source" : "Pathname"}</span><span>Active Users</span></div>
          <ul className="divide-y divide-slate-100">
            {(tab === "ref" ? (stats?.top_referrers || []) : (live?.top_pages_live || stats?.top_pages || [])).slice(0, 10).map((row: any, i: number) => (
              <li key={i} className="px-4 py-3 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <div className="font-medium text-slate-800 truncate">{row.path || row.referrer || "(direct)"}</div>
                  <div className="text-xs text-slate-400">{row.views} today pageviews</div>
                </div>
                <div className="font-bold text-navy-800">{row.views}</div>
              </li>
            ))}
            {!live?.top_pages_live?.length && !stats?.top_pages?.length && <li className="px-4 py-8 text-sm text-slate-400">Waiting for live traffic…</li>}
          </ul>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <div className="bg-[#0d4f7a] text-white px-4 py-2.5 text-sm font-semibold flex justify-between"><span>Referral Sources</span><span>Active Users</span></div>
          <ul className="divide-y divide-slate-100">
            {(stats?.top_referrers || []).slice(0, 10).map((r: any) => (
              <li key={r.referrer} className="px-4 py-2.5 flex justify-between text-sm"><span className="truncate">{r.referrer || "(direct)"}</span><span className="font-semibold">{r.views}</span></li>
            ))}
            {!stats?.top_referrers?.length && <li className="px-4 py-8 text-sm text-slate-400">No sources yet</li>}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}

export default function RealtimePage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-navy-600" /></div>}><RealtimeInner /></Suspense>;
}
