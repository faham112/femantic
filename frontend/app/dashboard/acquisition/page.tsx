"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import api, { getMe } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { Loader2 } from "lucide-react";

const BLOCKS = [
  ["utm_source", "UTM Source"],
  ["utm_medium", "UTM Medium"],
  ["utm_campaign", "UTM Campaign"],
  ["utm_term", "UTM Term"],
  ["utm_content", "UTM Content"],
  ["source_medium", "Source / Medium"],
  ["referrer", "Referrer"],
  ["referrer_source", "Referrer + Source"],
] as const;

function Inner() {
  const router = useRouter();
  const params = useSearchParams();
  const websiteId = params.get("id");
  const [user, setUser] = useState<any>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [tables, setTables] = useState<Record<string, any[]>>({});
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
        const entries = await Promise.all(
          BLOCKS.map(async ([dim]) => {
            const res = await api.get(`/api/track/breakdown/${id}?dim=${dim}&days=${days}`).catch(() => ({ data: { rows: [] } }));
            return [dim, res.data?.rows || []];
          })
        );
        setTables(Object.fromEntries(entries));
      } catch { router.push("/login"); }
      finally { setLoading(false); }
    })();
  }, [router, websiteId, days]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin" /></div>;
  const id = websiteId || sites[0]?.id;

  return (
    <AppShell user={user} websites={sites} title="Acquisition">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h1 className="text-lg font-bold text-navy-800">Traffic sources</h1>
          <p className="text-xs text-slate-500">Campaign links: ?utm_source=&utm_medium=&utm_campaign=&utm_term=&utm_content=</p>
        </div>
        <div className="flex gap-1">{[7,14,30].map((d) => <button key={d} onClick={() => setDays(d)} className={`px-3 py-1.5 text-xs rounded-md font-medium ${days===d?"bg-navy-700 text-white":"bg-white border border-slate-200"}`}>{d}d</button>)}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {BLOCKS.map(([dim, title]) => (
          <Box key={dim} title={title} href={id ? `/dashboard/report?id=${id}&dim=${dim}` : "#"} rows={(tables[dim] || []).map((r: any) => [r.label, r.views])} />
        ))}
      </div>
    </AppShell>
  );
}

function Box({ title, rows, href, empty = "No tagged visits yet" }: { title: string; rows: [string, number][]; href: string; empty?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-card">
      <Link href={href} className="bg-[#0d4f7a] text-white px-4 py-2 text-sm font-semibold flex justify-between">
        <span>{title}</span><span className="text-white/70 text-xs font-normal">View all</span>
      </Link>
      <ul className="divide-y divide-slate-100">
        {rows.slice(0, 8).map(([a, b]) => <li key={a} className="px-4 py-2.5 flex justify-between text-sm gap-2"><span className="truncate">{a}</span><span className="font-semibold">{Number(b).toLocaleString()}</span></li>)}
        {!rows.length && <li className="px-4 py-8 text-sm text-slate-400">{empty}</li>}
      </ul>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin" /></div>}><Inner /></Suspense>;
}
