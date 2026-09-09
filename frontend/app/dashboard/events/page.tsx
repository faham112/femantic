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
  const [data, setData] = useState<any>({ totals: [], recent: [] });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!Cookies.get("token")) { router.push("/login"); return; }
    (async () => {
      try {
        const [me, w] = await Promise.all([getMe(), api.get("/api/websites/")]);
        setUser(me); setSites(w.data);
        const id = websiteId || w.data[0]?.id;
        if (id) setData((await api.get(`/api/track/events/${id}?days=14`)).data);
      } catch { router.push("/login"); }
      finally { setLoading(false); }
    })();
  }, [router, websiteId]);
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin" /></div>;
  return (
    <AppShell user={user} websites={sites} title="Events">
      <h1 className="text-lg font-bold text-navy-800 mb-2">Custom events</h1>
      <p className="text-xs text-slate-500 mb-4">Call <code className="bg-slate-100 px-1 rounded">Femantic.track("signup")</code> from the tracker snippet.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-card">
          <div className="bg-[#0d4f7a] text-white px-4 py-2 text-sm font-semibold">Totals</div>
          <ul className="divide-y divide-slate-100">
            {(data.totals || []).map((e: any) => <li key={e.name} className="px-4 py-2.5 flex justify-between text-sm"><span>{e.name}</span><span className="font-semibold">{e.count}</span></li>)}
            {!data.totals?.length && <li className="px-4 py-8 text-sm text-slate-400">No custom events yet</li>}
          </ul>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-card">
          <div className="bg-[#0d4f7a] text-white px-4 py-2 text-sm font-semibold">Recent</div>
          <ul className="divide-y divide-slate-100">
            {(data.recent || []).map((e: any, i: number) => <li key={i} className="px-4 py-2.5 text-sm flex justify-between gap-2"><span className="truncate">{e.name}</span><span className="text-slate-400 text-xs shrink-0">{e.created_at?.slice(0,16)?.replace("T"," ")}</span></li>)}
            {!data.recent?.length && <li className="px-4 py-8 text-sm text-slate-400">Nothing recent</li>}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
export default function Page() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin" /></div>}><Inner /></Suspense>;
}
