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
  const pages = stats?.top_pages || [];
  return (
    <AppShell user={user} websites={sites} title="Content">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-navy-800">Top content</h1>
        <div className="flex gap-1">{[7,14,30].map((d) => <button key={d} onClick={() => setDays(d)} className={`px-3 py-1.5 text-xs rounded-md font-medium ${days===d?"bg-navy-700 text-white":"bg-white border border-slate-200"}`}>{d}d</button>)}</div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-card">
        <div className="grid grid-cols-12 bg-[#0d4f7a] text-white text-xs font-semibold px-4 py-2">
          <div className="col-span-8">Page</div><div className="col-span-4 text-right">Pageviews</div>
        </div>
        {pages.map((p: any) => (
          <div key={p.path} className="grid grid-cols-12 px-4 py-2.5 text-sm border-b border-slate-100">
            <div className="col-span-8 truncate">{p.path}</div>
            <div className="col-span-4 text-right font-semibold">{p.views.toLocaleString()}</div>
          </div>
        ))}
        {!pages.length && <p className="px-4 py-8 text-sm text-slate-400">No pages yet. Install the tracker.</p>}
      </div>
    </AppShell>
  );
}
export default function Page() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin" /></div>}><Inner /></Suspense>;
}
