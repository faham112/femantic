"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import api, { getMe } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Loader2, BarChart3, Users, Eye, Monitor } from "lucide-react";

interface Stats {
  total_pageviews: number;
  unique_sessions: number;
  true_traffic: number;
  bounce_rate: number;
  top_pages: { path: string; views: number }[];
  top_referrers: { referrer: string; views: number }[];
  devices: Record<string, number>;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const websiteId = searchParams.get("id");

  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) { router.push("/login"); return; }
    if (!websiteId) { router.push("/dashboard"); return; }
    load();
  }, [router, websiteId, days]);

  const load = async () => {
    try {
      const me = await getMe();
      setUser(me);
      const res = await api.get(`/api/track/stats/${websiteId}?days=${days}`);
      setStats(res.data);
    } catch {
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Analytics</h1>
            <p className="text-slate-600 text-sm mt-1">True traffic insights</p>
          </div>
          <div className="flex gap-2">
            {[7, 14, 30].map((d) => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium ${
                  days === d ? "bg-primary-600 text-white" : "bg-white border border-slate-200 text-slate-600"
                }`}>{d}d</button>
            ))}
          </div>
        </div>

        {stats && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
              <StatCard icon={<Eye className="w-5 h-5" />} label="Pageviews" value={stats.total_pageviews} />
              <StatCard icon={<Users className="w-5 h-5" />} label="Sessions" value={stats.unique_sessions} />
              <StatCard icon={<BarChart3 className="w-5 h-5" />} label="True Traffic" value={stats.true_traffic} />
              <StatCard icon={<Monitor className="w-5 h-5" />} label="Bounce Rate" value={`${stats.bounce_rate}%`} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h2 className="font-semibold text-slate-900 mb-4">Top Pages</h2>
                {stats.top_pages.length === 0 ? <p className="text-sm text-slate-500">No data yet</p> : (
                  <ul className="space-y-3">
                    {stats.top_pages.map((p, i) => (
                      <li key={i} className="flex justify-between text-sm">
                        <span className="truncate text-slate-700 max-w-[70%]">{p.path}</span>
                        <span className="font-medium">{p.views}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h2 className="font-semibold text-slate-900 mb-4">Top Referrers</h2>
                {stats.top_referrers.length === 0 ? <p className="text-sm text-slate-500">No data yet</p> : (
                  <ul className="space-y-3">
                    {stats.top_referrers.map((r, i) => (
                      <li key={i} className="flex justify-between text-sm">
                        <span className="truncate text-slate-700 max-w-[70%]">{r.referrer}</span>
                        <span className="font-medium">{r.views}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500 mb-1">{icon}<span className="text-xs font-medium">{label}</span></div>
      <p className="text-xl sm:text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
