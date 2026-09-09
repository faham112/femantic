"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import api, { getMe } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { Loader2 } from "lucide-react";

function Inner() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [data, setData] = useState<any>(null);
  const [days, setDays] = useState(14);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Cookies.get("token")) { router.push("/login"); return; }
    (async () => {
      try {
        const [me, w, net] = await Promise.all([
          getMe(),
          api.get("/api/websites/"),
          api.get(`/api/track/network?days=${days}`),
        ]);
        setUser(me); setSites(w.data); setData(net.data);
      } catch { router.push("/login"); }
      finally { setLoading(false); }
    })();
  }, [router, days]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin" /></div>;
  const t = data?.totals || {};

  return (
    <AppShell user={user} websites={sites} title="Network">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h1 className="text-lg font-bold text-navy-800">All sites</h1>
        <div className="flex gap-1">{[7,14,30].map((d) => <button key={d} onClick={() => setDays(d)} className={`px-3 py-1.5 text-xs rounded-md font-medium ${days===d?"bg-navy-700 text-white":"bg-white border border-slate-200"}`}>{d}d</button>)}</div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[["Sites", t.sites || 0], ["Users", t.users || 0], ["Pageviews", t.pageviews || 0]].map(([l, v]) => (
          <div key={String(l)} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs text-slate-500">{l}</div>
            <div className="text-2xl font-bold text-navy-800">{Number(v).toLocaleString()}</div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0d4f7a] text-white text-left">
            <tr>
              <th className="px-4 py-2">Site</th>
              <th className="px-4 py-2 w-28">Users</th>
              <th className="px-4 py-2 w-28">Pageviews</th>
              <th className="px-4 py-2 w-24">Status</th>
            </tr>
          </thead>
          <tbody>
            {(data?.sites || []).map((s: any) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="px-4 py-2">
                  <Link href={`/dashboard?id=${s.id}`} className="font-medium text-navy-800 hover:underline">{s.name}</Link>
                  <div className="text-xs text-slate-500">{s.domain}</div>
                </td>
                <td className="px-4 py-2 font-semibold">{Number(s.users).toLocaleString()}</td>
                <td className="px-4 py-2 font-semibold">{Number(s.pageviews).toLocaleString()}</td>
                <td className="px-4 py-2 text-xs">{s.is_active ? "Active" : "Paused"}</td>
              </tr>
            ))}
            {!(data?.sites || []).length && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No sites</td></tr>}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

export default function Page() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin" /></div>}><Inner /></Suspense>;
}
