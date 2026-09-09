"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import api, { getMe } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { Loader2 } from "lucide-react";

function Inner() {
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
        if (id) setStats((await api.get(`/api/track/stats/${id}?days=${days}`)).data);
      } catch { router.push("/login"); }
      finally { setLoading(false); }
    })();
  }, [router, websiteId, days]);
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin" /></div>;
  return (
    <AppShell user={user} websites={sites} title="Acquisition">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-navy-800">Traffic sources</h1>
        <div className="flex gap-1">{[7,14,30].map((d) => <button key={d} onClick={() => setDays(d)} className={`px-3 py-1.5 text-xs rounded-md font-medium ${days===d?"bg-navy-700 text-white":"bg-white border border-slate-200"}`}>{d}d</button>)}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Box title="Referrers" rows={(stats?.top_referrers || []).map((r: any) => [r.referrer || "(direct)", r.views])} />
        <Box title="UTM sources" rows={(stats?.top_sources || []).map((r: any) => [r.source, r.views])} empty="No UTM tags yet. Add ?utm_source= to campaign links." />
      </div>
    </AppShell>
  );
}
function Box({ title, rows, empty = "No data yet" }: { title: string; rows: [string, number][]; empty?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-card">
      <div className="bg-[#0d4f7a] text-white px-4 py-2 text-sm font-semibold">{title}</div>
      <ul className="divide-y divide-slate-100">
        {rows.map(([a, b]) => <li key={a} className="px-4 py-2.5 flex justify-between text-sm gap-2"><span className="truncate">{a}</span><span className="font-semibold">{Number(b).toLocaleString()}</span></li>)}
        {!rows.length && <li className="px-4 py-8 text-sm text-slate-400">{empty}</li>}
      </ul>
    </div>
  );
}
export default function Page() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin" /></div>}><Inner /></Suspense>;
}
