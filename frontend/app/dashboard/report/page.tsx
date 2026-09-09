"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import api, { getMe } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { Loader2 } from "lucide-react";

const TITLES: Record<string, string> = {
  path: "Content",
  content: "Content",
  country: "Country",
  device: "Device",
  browser: "Browser",
  os: "Operating System",
  referrer: "Referrer",
  hostname: "Hostname",
  utm_source: "UTM Source",
  utm_medium: "UTM Medium",
  utm_campaign: "UTM Campaign",
  utm_term: "UTM Term",
  utm_content: "UTM Content",
  source_medium: "Source / Medium",
  referrer_source: "Referrer + Source",
  entry: "Entry pages",
  exit: "Exit pages",
  traffic: "AI Traffic",
};

function ReportInner() {
  const router = useRouter();
  const params = useSearchParams();
  const websiteId = params.get("id");
  const dim = params.get("dim") || "path";
  const [user, setUser] = useState<any>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [days, setDays] = useState(14);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!Cookies.get("token")) { router.push("/login"); return; }
    (async () => {
      try {
        const [me, w] = await Promise.all([getMe(), api.get("/api/websites/")]);
        setUser(me); setSites(w.data);
        const id = websiteId || w.data[0]?.id;
        if (!id) { setLoading(false); return; }
        const res = await api.get(`/api/track/breakdown/${id}?dim=${dim}&days=${days}`);
        setRows(res.data?.rows || []);
      } catch { setRows([]); }
      finally { setLoading(false); }
    })();
  }, [router, websiteId, dim, days]);

  const filtered = rows.filter((r) => String(r.label).toLowerCase().includes(q.toLowerCase()));
  const title = TITLES[dim] || dim;

  return (
    <AppShell user={user} websites={sites} title={title}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h1 className="text-lg font-bold text-navy-800">{title}</h1>
        <div className="flex gap-1">
          {[7, 14, 30].map((d) => (
            <button key={d} onClick={() => setDays(d)} className={`px-3 py-1.5 text-xs rounded-md font-medium ${days === d ? "bg-navy-700 text-white" : "bg-white border border-slate-200"}`}>{d}d</button>
          ))}
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-card">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="w-full sm:w-64 border border-slate-200 rounded-lg px-3 py-1.5 text-sm" />
          <span className="text-xs text-slate-400">{filtered.length}</span>
        </div>
        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-navy-600" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#0d4f7a] text-white text-left">
              <tr><th className="px-4 py-2 font-medium">Name</th><th className="px-4 py-2 font-medium w-24">Views</th><th className="px-4 py-2 font-medium w-28">Share</th></tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.label} className="border-t border-slate-100">
                  <td className="px-4 py-2 truncate max-w-[240px]">{r.label}</td>
                  <td className="px-4 py-2 font-semibold">{Number(r.views).toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded"><div className="h-1.5 bg-navy-600 rounded" style={{ width: `${Math.min(100, r.pct)}%` }} /></div>
                      <span className="text-xs text-slate-500 w-10">{r.pct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">No data in this period</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}

export default function ReportPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin" /></div>}><ReportInner /></Suspense>;
}
