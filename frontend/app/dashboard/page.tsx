"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";
import api, { getMe, formatDuration, vsPrev } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { DualLineChart, MiniBars, Donut } from "@/components/Charts";
import { Loader2, ArrowRight, WifiOff, Calendar, ChevronDown } from "lucide-react";

const FLAGS: Record<string, string> = {
  India: "🇮🇳", Pakistan: "🇵🇰", Egypt: "🇪🇬", Indonesia: "🇮🇩",
  "United States": "🇺🇸", USA: "🇺🇸", US: "🇺🇸", Brazil: "🇧🇷",
  "United Kingdom": "🇬🇧", UK: "🇬🇧", Germany: "🇩🇪", France: "🇫🇷",
  Canada: "🇨🇦", Australia: "🇦🇺", Bangladesh: "🇧🇩", UAE: "🇦🇪",
  "Saudi Arabia": "🇸🇦", Turkey: "🇹🇷", Nigeria: "🇳🇬", China: "🇨🇳",
};

function fmtDate(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function DashboardInner() {
  const router = useRouter();
  const params = useSearchParams();
  const websiteId = params.get("id");
  const [user, setUser] = useState<any>(null);
  const [websites, setWebsites] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [series, setSeries] = useState<{ current: number[]; previous: number[] }>({ current: [], previous: [] });
  const [live, setLive] = useState<any>(null);
  const [countries, setCountries] = useState<any[]>([]);
  const [browsers, setBrowsers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [picker, setPicker] = useState(false);
  const [compare, setCompare] = useState(true);
  const end = useMemo(() => new Date(), []);
  const start = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - (days - 1)); return d; }, [days]);

  useEffect(() => {
    if (!Cookies.get("token")) { router.push("/login"); return; }
    (async () => {
      try {
        const [me, sites] = await Promise.all([getMe(), api.get("/api/websites/")]);
        setUser(me); setWebsites(sites.data);
        const id = websiteId || sites.data[0]?.id;
        if (id) {
          const [s, l, ser, co, br, ev] = await Promise.all([
            api.get(`/api/track/stats/${id}?days=${days}`),
            api.get(`/api/realtime/live/${id}`).catch(() => ({ data: null })),
            api.get(`/api/track/series/${id}?days=${days}`).catch(() => ({ data: { current: [], previous: [] } })),
            api.get(`/api/track/breakdown/${id}?dim=country&days=${days}`).catch(() => ({ data: { rows: [] } })),
            api.get(`/api/track/breakdown/${id}?dim=browser&days=${days}`).catch(() => ({ data: { rows: [] } })),
            api.get(`/api/track/events/${id}?days=${days}`).catch(() => ({ data: { totals: [] } })),
          ]);
          setStats(s.data); setLive(l.data); setSeries(ser.data || { current: [], previous: [] });
          setCountries(co.data?.rows || []);
          setBrowsers(br.data?.rows || []);
          setEvents(ev.data?.totals || []);
        }
      } catch { Cookies.remove("token"); router.push("/login"); }
      finally { setLoading(false); }
    })();
  }, [router, days, websiteId]);

  const users = stats?.true_traffic ?? 0;
  const sessions = stats?.unique_sessions ?? 0;
  const pageviews = stats?.total_pageviews ?? 0;
  const bounce = stats?.bounce_rate ?? 0;
  const dur = formatDuration(stats?.avg_duration_seconds || 0);
  const deviceSegs = useMemo(() => {
    const d = stats?.devices || {};
    return [
      { label: "Mobile", value: d.mobile || 0, color: "#0d4f7a" },
      { label: "Tablet", value: d.tablet || 0, color: "#a855f7" },
      { label: "Desktop", value: d.desktop || 0, color: "#38bdf8" },
    ];
  }, [stats]);
  const activeId = websiteId || websites[0]?.id;
  const q = activeId ? `?id=${activeId}` : "";
  const liveBars = (live?.minute_series || series.current.slice(-30)).length
    ? (live?.minute_series || series.current.slice(-30))
    : Array.from({ length: 30 }, () => 2);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-navy-600" /></div>;

  return (
    <AppShell user={user} websites={websites} title="Dashboard">
      {!websites.length ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <h2 className="text-lg font-semibold text-navy-800">Activate your first site</h2>
          <Link href="/dashboard/sites/new" className="inline-flex mt-5 bg-navy-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg">Activate your site</Link>
        </div>
      ) : (
        <div className="max-w-xl lg:max-w-none mx-auto space-y-3">
          <div className="flex items-center justify-between text-[13px] text-slate-500">
            <span className="flex items-center gap-1 font-medium text-slate-700">Dashboard</span>
            <button onClick={() => setPicker((v) => !v)} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-navy-800">
              {fmtDate(start)} → {fmtDate(end)} <Calendar className="w-3.5 h-3.5 text-navy-700" />
            </button>
          </div>

          {picker && (
            <div className="bg-[#0d4f7a] text-white rounded-2xl p-4 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold">Date range selector</div>
                <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="bg-white text-navy-800 text-xs rounded-full px-3 py-1.5 font-medium">
                  <option value={7}>Last 7 days</option>
                  <option value={14}>Last 14 days</option>
                  <option value={30}>Last 30 days</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px] text-white/80">Start date
                  <input type="date" value={iso(start)} readOnly className="mt-1 w-full rounded-lg px-3 py-2 text-navy-800 text-sm" />
                </label>
                <label className="text-[11px] text-white/80">End date
                  <input type="date" value={iso(end)} readOnly className="mt-1 w-full rounded-lg px-3 py-2 text-navy-800 text-sm" />
                </label>
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} />
                Compare with previous period
              </label>
              <div className="flex justify-end mt-3">
                <button onClick={() => setPicker(false)} className="bg-[#0a3d5e] hover:bg-[#083048] rounded-lg px-4 py-2 text-sm font-semibold">Apply</button>
              </div>
            </div>
          )}

          <section className="bg-[#0d4f7a] text-white rounded-2xl p-4 shadow-card">
            <div className="text-sm text-white/80">Active Users in the last 5 minutes</div>
            <div className="text-5xl font-bold leading-none mt-1">{live?.live_visitors ?? 0}</div>
            <div className="text-[11px] text-white/70 mt-3 mb-1">Pageviews per Minute</div>
            <MiniBars values={liveBars} />
            <div className="flex justify-between text-[11px] text-white/50 mt-1"><span>-29m</span><span>-2m</span></div>
            <div className="mt-4 flex justify-between text-xs text-white/70 mb-1"><span>Main Active Pages</span><span>Active Users</span></div>
            {(live?.top_pages_live || stats?.top_pages || []).slice(0, 5).map((p: any) => (
              <div key={p.path} className="flex justify-between text-sm py-2 border-b border-white/10">
                <span className="truncate pr-3">{p.path}</span><span className="font-semibold">{p.views}</span>
              </div>
            ))}
            {activeId && (
              <Link href={`/dashboard/realtime${q}`} className="mt-4 w-full inline-flex items-center justify-center gap-1 bg-white/20 hover:bg-white/30 rounded-full py-2.5 text-sm font-medium">
                Real Time Data <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </section>

          <Kpi label="Users" value={users.toLocaleString()} sub={vsPrev(users, stats?.previous_users || 0)} navy />
          <Kpi label="Sessions" value={sessions.toLocaleString()} sub={vsPrev(sessions, stats?.previous_sessions || 0)} />
          <Kpi label="Pageviews" value={pageviews.toLocaleString()} sub={vsPrev(pageviews, stats?.previous_pageviews || 0)} navy />
          <Kpi label="Bounce Rate" value={`${bounce}%`} sub={vsPrev(bounce, stats?.previous_bounce || 0)} />
          <Kpi label="Session Duration" value={dur} sub="avg" navy />

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700">Users</span>
              <span className="text-[11px] text-slate-400">{compare ? "vs previous period" : ""}</span>
            </div>
            <div className="h-[200px]"><DualLineChart current={series.current} previous={compare ? series.previous : []} /></div>
          </div>

          <ListCard title="Top Pages" right="Pageviews" rows={(stats?.top_pages || []).map((p: any) => [p.path, p.views])} href={`/dashboard/content${q}`} more="View all Pages" />

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-card">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Devices (Users)</h3>
            <Donut segments={deviceSegs.every((s) => s.value === 0) ? [{ label: "No data", value: 1, color: "#cbd5e1" }] : deviceSegs} />
            {activeId && <Link href={`/dashboard/report${q}&dim=device`} className="mt-3 block text-center text-sm text-navy-700 font-medium">View all Audience Devices →</Link>}
          </div>

          <ListCard title="Referrer + Source" right="Pageviews" rows={(stats?.top_referrers || []).map((r: any) => [r.referrer || "(direct)", r.views])} href={`/dashboard/report${q}&dim=referrer_source`} more="View all Referrer + Source" />

          <ListCard
            title="Country"
            right="Users"
            rows={countries.map((c: any) => [`${FLAGS[c.label] || "🌐"}  ${c.label}`, c.views, c.pct])}
            href={`/dashboard/report${q}&dim=country`}
            more="View all Countries"
            showPct
          />

          <ListCard
            title="Browsers"
            right="Pageviews"
            rows={browsers.map((b: any) => [b.label, b.views, b.pct])}
            href={`/dashboard/report${q}&dim=browser`}
            more="View all Browsers"
            showPct
          />

          <EmptyCard title="Events" right="Hits" empty={!events.length} rows={events.map((e: any) => [e.name, e.count])} href={`/dashboard/events${q}`} more="View all Events" />
          <EmptyCard title="Custom Dimensions" right="Pageviews" empty />
        </div>
      )}
    </AppShell>
  );
}

function Kpi({ label, value, sub, navy }: { label: string; value: string; sub?: string; navy?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 shadow-card ${navy ? "bg-[#0d4f7a] text-white" : "bg-white border border-slate-200"}`}>
      <div className={`text-sm ${navy ? "text-white/80" : "text-slate-500"}`}>{label}</div>
      <div className="text-3xl font-bold mt-1 tracking-tight">{value}</div>
      {sub && <div className={`text-xs mt-1 ${navy ? "text-white/60" : "text-slate-400"}`}>{sub}</div>}
    </div>
  );
}

function ListCard({ title, right, rows, href, more, showPct }: { title: string; right: string; rows: any[]; href?: string; more?: string; showPct?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-card">
      <div className="bg-[#0d4f7a] text-white px-4 py-2.5 text-sm font-semibold flex justify-between">
        <span className="flex items-center gap-1">{title} <ChevronDown className="w-3.5 h-3.5 opacity-70" /></span>
        <span className="text-white/80 font-normal">{right}</span>
      </div>
      <ul className="divide-y divide-slate-100">
        {rows.slice(0, 8).map((r, i) => (
          <li key={i} className="px-4 py-2.5 flex justify-between text-sm gap-3">
            <span className="truncate text-slate-700">{r[0]}</span>
            <span className="font-semibold text-slate-900 whitespace-nowrap">
              {Number(r[1]).toLocaleString()}{showPct && r[2] != null ? <span className="text-slate-400 font-normal text-xs ml-1">({r[2]}%)</span> : null}
            </span>
          </li>
        ))}
        {!rows.length && <li className="px-4 py-8 text-sm text-slate-400 text-center">Waiting for traffic…</li>}
      </ul>
      {href && more && <Link href={href} className="block text-center text-sm text-navy-700 font-medium py-3 border-t border-slate-100">{more} →</Link>}
    </div>
  );
}

function EmptyCard({ title, right, empty, rows = [], href, more }: { title: string; right: string; empty?: boolean; rows?: any[]; href?: string; more?: string }) {
  if (!empty && rows.length) return <ListCard title={title} right={right} rows={rows} href={href} more={more} />;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-card">
      <div className="bg-[#0d4f7a] text-white px-4 py-2.5 text-sm font-semibold flex justify-between">
        <span>{title}</span><span className="font-normal text-white/80">{right}</span>
      </div>
      <div className="py-14 flex flex-col items-center text-slate-400">
        <WifiOff className="w-12 h-12 mb-3 opacity-40" />
        <div className="text-sm">No Traffic Detected</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-navy-600" /></div>}><DashboardInner /></Suspense>;
}
