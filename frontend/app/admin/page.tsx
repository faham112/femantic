"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { BarChart3, Bot, Globe2, Loader2, ShieldCheck, Users } from "lucide-react";
import AppShell from "@/components/AppShell";
import api, { getAdminOverview, getMe } from "@/lib/api";

function AdminInner() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [websites, setWebsites] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Cookies.get("token")) { router.replace("/login"); return; }
    Promise.all([getMe(), getAdminOverview(), api.get("/api/websites/"), api.get("/api/admin/users").catch(() => ({ data: [] }))])
      .then(([currentUser, stats, sites, userList]) => {
        if (currentUser.role !== "admin") { router.replace("/dashboard"); return; }
        setUser(currentUser);
        setOverview(stats);
        setWebsites(sites.data || []);
        setUsers(userList.data || []);
      })
      .catch(() => { Cookies.remove("token"); router.replace("/login"); })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading || !overview) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-navy-600" /></div>;
  }

  return (
    <AppShell user={user} websites={websites} title="Admin / Overview">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-5">
        <Stat icon={<Users className="w-5 h-5" />} label="Users" value={overview.total_users} />
        <Stat icon={<Globe2 className="w-5 h-5" />} label="Websites" value={overview.total_websites} />
        <Stat icon={<BarChart3 className="w-5 h-5" />} label="Pageviews" value={overview.total_pageviews} />
        <Stat icon={<ShieldCheck className="w-5 h-5" />} label="True traffic" value={overview.true_traffic} />
        <Stat icon={<Users className="w-5 h-5" />} label="Premium users" value={overview.premium_users} />
        <Stat icon={<Bot className="w-5 h-5" />} label="Bot ratio" value={`${overview.bot_ratio}%`} />
      </div>
      <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
        <div className="bg-[#0d4f7a] text-white px-4 py-2.5 text-sm font-semibold">Users</div>
        <ul className="divide-y divide-slate-100">
          {users.map((u: any) => (
            <li key={u.id} className="px-4 py-2.5 flex justify-between text-sm gap-3">
              <span className="truncate">{u.full_name || u.email}</span>
              <span className="text-slate-500">{u.role} · {u.membership}</span>
            </li>
          ))}
          {!users.length && <li className="px-4 py-6 text-sm text-slate-400">No users listed</li>}
        </ul>
      </div>
    </AppShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
      <div className="flex items-center gap-2 text-navy-700">{icon}<span className="text-sm text-slate-500">{label}</span></div>
      <p className="mt-3 text-2xl font-bold text-navy-800">{value}</p>
    </div>
  );
}

export default function AdminPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin" /></div>}><AdminInner /></Suspense>;
}
