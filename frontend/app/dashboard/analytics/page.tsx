"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import api, { getMe } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { DualLineChart, Donut } from "@/components/Charts";
import { Loader2 } from "lucide-react";

function AnalyticsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const websiteId = params.get("id");
  const [user, setUser] = useState<any>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [days, setDays] = useState(14);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Cookies.get("token")) { router.push("/login"); return; }
    (async () => {
      try {
        const [me, w] = await Promise.all([getMe(), api.get("/api/websites/")]);
        setUser(me); setSites(w.data);
        const id = websiteId || w.data[0]?.id;
        if (!id) { setLoading(false); return; }
        const res = await api.get(`/api/track/stats/${id}?days=${days}`);
        setStats(res.data);
      } catch { router.push("/dashboard"); }
      finally { setLoading(false); }
    })();
  }, [router, websiteId, days]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-navy-600" /></div>;
  const devices = stats?.devices || {};
  const segs = [
    { label: "Mobile", value: devices.mobile || 0, color: "#0d4f7a" },
    { label: "Desktop", value: devices.desktop || 0, color: "#38bdf8" },
    { label: "Tablet", value: devices.tablet || 0, color: "#a855f7" },
  ];

  return (
    <AppShell user={user} websites={sites} title="Audience / Overview">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h1 className="text-lg font-bold text-navy-800">Analytics</h1>
        <div className="flex gap-1">
          {[7, 14, 30].map((d) => (
            <button key={d} onClick={() => setDays(d)} className={`px-3 py-1.5 text-xs rounded-md font-medium ${days === d ? "bg-navy-700 text-white" : "bg-white border border-slate-200"}`}>{d}d</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[["Users", stats?.true_traffic ?? 0], ["Sessions", stats?.unique_sessions ?? 0], ["Pageviews", stats?.total_pageviews ?? 0], ["Bounce", `${stats?.bounce_rate ?? 0}%`]].map(([l, v]) => (
          <div key={String(l)} className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
            <div className="text-xs text-slate-500">{l}</div>
            <div className="text-2xl font-bold text-navy-800 mt-1">{typeof v === "number" ? v.toLocaleString() : v}</div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card mb-4 h-[240px]"><DualLineChart /></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card title="Top Pages" rows={(stats?.top_pages || []).map((p: any) => [p.path, p.views])} />
        <Card title="Referrers" rows={(stats?.top_referrers || []).map((r: any) => [r.referrer || "(direct)", r.views])} />
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
          <h3 className="font-semibold text-sm mb-3">Devices</h3>
          <Donut segments={segs.every((s) => !s.value) ? [{ label: "Mobile", value: 1, color: "#0d4f7a" }, { label: "Desktop", value: 1, color: "#38bdf8" }] : segs} />
        </div>
      </div>
    </AppShell>
  );
}

function Card({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
      <div className="bg-[#0d4f7a] text-white px-4 py-2 text-sm font-semibold">{title}</div>
      <ul className="divide-y divide-slate-100">
        {rows.slice(0, 8).map(([a, b]) => (
          <li key={a} className="px-4 py-2 flex justify-between text-sm gap-2"><span className="truncate">{a}</span><span className="font-semibold">{Number(b).toLocaleString()}</span></li>
        ))}
        {!rows.length && <li className="px-4 py-6 text-sm text-slate-400">No data yet</li>}
      </ul>
    </div>
  );
}

export default function AnalyticsPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-navy-600" /></div>}><AnalyticsInner /></Suspense>;
}
