"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import api, { getMe } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Loader2, Users, Eye } from "lucide-react";

interface LiveData {
  live_visitors: number;
  pageviews_last_5min: number;
  top_pages_live: { path: string; views: number }[];
  recent_visitors: { path: string; device: string; country: string | null; created_at: string }[];
  timestamp: string;
}

function RealtimeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const websiteId = searchParams.get("id");

  const [user, setUser] = useState<any>(null);
  const [live, setLive] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) { router.push("/login"); return; }
    if (!websiteId) { router.push("/dashboard"); return; }
    loadUser();
    const interval = setInterval(fetchLive, 8000);
    fetchLive();
    return () => clearInterval(interval);
  }, [router, websiteId]);

  const loadUser = async () => {
    try {
      const me = await getMe();
      setUser(me);
    } catch {
      router.push("/login");
    }
  };

  const fetchLive = async () => {
    try {
      const res = await api.get(`/api/realtime/live/${websiteId}`);
      setLive(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  if (loading && !live) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-8">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Realtime</h1>
          <span className="text-xs text-slate-500">Updates every 8s</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 mb-2"><Users className="w-5 h-5" /><span className="text-sm font-medium">Live Visitors</span></div>
            <p className="text-4xl font-bold text-slate-900">{live?.live_visitors ?? 0}</p>
            <p className="text-xs text-slate-500 mt-1">Last 5 minutes</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 mb-2"><Eye className="w-5 h-5" /><span className="text-sm font-medium">Pageviews (5 min)</span></div>
            <p className="text-4xl font-bold text-slate-900">{live?.pageviews_last_5min ?? 0}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-4">Top Pages (Live)</h2>
            {!live?.top_pages_live?.length ? <p className="text-sm text-slate-500">No active pages</p> : (
              <ul className="space-y-3">{live.top_pages_live.map((p, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span className="truncate text-slate-700">{p.path}</span>
                  <span className="font-medium">{p.views}</span>
                </li>
              ))}</ul>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-4">Recent Visitors</h2>
            {!live?.recent_visitors?.length ? <p className="text-sm text-slate-500">Waiting for traffic…</p> : (
              <ul className="space-y-3">{live.recent_visitors.map((v, i) => (
                <li key={i} className="text-sm border-b border-slate-50 pb-2 last:border-0">
                  <div className="flex justify-between">
                    <span className="truncate text-slate-700 max-w-[60%]">{v.path}</span>
                    <span className="text-xs text-slate-400 capitalize">{v.device}</span>
                  </div>
                </li>
              ))}</ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function RealtimePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    }>
      <RealtimeContent />
    </Suspense>
  );
}
