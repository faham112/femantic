"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";
import {
  BarChart3, Bot, Globe2, Loader2, ShieldCheck, Users, Search, ToggleLeft, ToggleRight,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import api, { getAdminOverview, getMe } from "@/lib/api";

type Tab = "overview" | "users" | "sites";

function AdminInner() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [websites, setWebsites] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<number | null>(null);

  const load = async () => {
    const [currentUser, stats, sites, userList] = await Promise.all([
      getMe(),
      getAdminOverview(),
      api.get("/api/admin/websites").catch(() => api.get("/api/websites/")),
      api.get("/api/admin/users").catch(() => ({ data: [] })),
    ]);
    if (currentUser.role !== "admin") {
      router.replace("/dashboard");
      return false;
    }
    setUser(currentUser);
    setOverview(stats);
    setWebsites(sites.data || []);
    setUsers(userList.data || []);
    return true;
  };

  useEffect(() => {
    if (!Cookies.get("token")) { router.replace("/login"); return; }
    load().catch(() => { Cookies.remove("token"); router.replace("/login"); }).finally(() => setLoading(false));
  }, [router]);

  const filteredUsers = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter((u) => `${u.email} ${u.full_name || ""} ${u.role}`.toLowerCase().includes(s));
  }, [users, q]);

  const filteredSites = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return websites;
    return websites.filter((w) => `${w.name} ${w.domain} ${w.public_key || ""}`.toLowerCase().includes(s));
  }, [websites, q]);

  const patchUser = async (id: number, body: Record<string, any>) => {
    setBusy(id);
    try {
      const res = await api.patch(`/api/users/${id}`, body);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...res.data } : u)));
    } catch (e) {
      alert("Update failed");
    } finally {
      setBusy(null);
    }
  };

  if (loading || !overview) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-navy-600" /></div>;
  }

  return (
    <AppShell user={user} websites={websites} title="Admin control panel">
      <div className="max-w-[1200px] mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-navy-800">Platform admin</h1>
            <p className="text-sm text-slate-500">Users, sites and traffic across the whole network.</p>
          </div>
          <div className="flex rounded-lg border border-slate-200 bg-white p-1 text-sm">
            {(["overview", "users", "sites"] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-md capitalize ${tab === t ? "bg-navy-700 text-white" : "text-slate-600 hover:bg-slate-50"}`}>{t}</button>
            ))}
          </div>
        </div>

        {tab === "overview" && (
          <>
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
              <Stat icon={<Users className="w-5 h-5" />} label="Users" value={overview.total_users} />
              <Stat icon={<Globe2 className="w-5 h-5" />} label="Websites" value={overview.total_websites} />
              <Stat icon={<BarChart3 className="w-5 h-5" />} label="Pageviews" value={overview.total_pageviews} />
              <Stat icon={<ShieldCheck className="w-5 h-5" />} label="True traffic" value={overview.true_traffic} />
              <Stat icon={<Users className="w-5 h-5" />} label="Premium" value={overview.premium_users} />
              <Stat icon={<Bot className="w-5 h-5" />} label="Bot ratio" value={`${overview.bot_ratio}%`} />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
                <h3 className="text-sm font-semibold text-navy-800 mb-2">Shortcuts</h3>
                <div className="flex flex-wrap gap-2 text-sm">
                  <Link href="/dashboard" className="px-3 py-1.5 rounded-lg bg-navy-700 text-white">Publisher dashboard</Link>
                  <Link href="/dashboard/network" className="px-3 py-1.5 rounded-lg border border-slate-200">Network</Link>
                  <Link href="/dashboard/sites/new" className="px-3 py-1.5 rounded-lg border border-slate-200">Add site</Link>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card text-sm text-slate-600">
                <h3 className="text-sm font-semibold text-navy-800 mb-2">Notes</h3>
                <p>Role changes apply immediately. Tracker keys stay on each site. Public key is the shareable dashboard token.</p>
              </div>
            </div>
          </>
        )}

        {tab !== "overview" && (
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tab === "users" ? "Search users…" : "Search sites…"} className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white" />
          </div>
        )}

        {tab === "users" && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#0d4f7a] text-white text-left">
                <tr>
                  <th className="px-3 py-2.5 font-medium">User</th>
                  <th className="px-3 py-2.5 font-medium">Role</th>
                  <th className="px-3 py-2.5 font-medium">Plan</th>
                  <th className="px-3 py-2.5 font-medium">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="align-top">
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-navy-800 truncate max-w-[220px]">{u.full_name || "—"}</div>
                      <div className="text-xs text-slate-500 truncate">{u.email}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <select disabled={busy === u.id || u.id === user?.id} value={u.role} onChange={(e) => patchUser(u.id, { role: e.target.value })} className="border border-slate-200 rounded-lg px-2 py-1 text-xs">
                        <option value="admin">admin</option>
                        <option value="pro">pro</option>
                        <option value="client">client</option>
                      </select>
                    </td>
                    <td className="px-3 py-2.5">
                      <select disabled={busy === u.id} value={u.membership} onChange={(e) => patchUser(u.id, { membership: e.target.value })} className="border border-slate-200 rounded-lg px-2 py-1 text-xs">
                        <option value="free">free</option>
                        <option value="premium">premium</option>
                        <option value="expired">expired</option>
                      </select>
                    </td>
                    <td className="px-3 py-2.5">
                      <button disabled={busy === u.id || u.id === user?.id} onClick={() => patchUser(u.id, { is_active: !u.is_active })} className="inline-flex items-center gap-1 text-xs">
                        {u.is_active ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                        {u.is_active ? "on" : "off"}
                      </button>
                    </td>
                  </tr>
                ))}
                {!filteredUsers.length && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No users</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {tab === "sites" && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#0d4f7a] text-white text-left">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Site</th>
                  <th className="px-3 py-2.5 font-medium">Public key</th>
                  <th className="px-3 py-2.5 font-medium">Owner</th>
                  <th className="px-3 py-2.5 font-medium">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSites.map((w) => (
                  <tr key={w.id}>
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-navy-800 truncate max-w-[200px]">{w.name}</div>
                      <div className="text-xs text-slate-500">{w.domain} · #{w.id}</div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs">{w.public_key || "—"}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">uid {w.owner_id}</td>
                    <td className="px-3 py-2.5">
                      <Link href={`/dashboard?id=${w.id}`} className="text-navy-700 font-medium text-xs">Dashboard →</Link>
                    </td>
                  </tr>
                ))}
                {!filteredSites.length && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No sites</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-card">
      <div className="flex items-center gap-2 text-navy-700">{icon}<span className="text-sm text-slate-500">{label}</span></div>
      <p className="mt-3 text-2xl font-bold text-navy-800">{typeof value === "number" ? value.toLocaleString() : value}</p>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin" /></div>}>
      <AdminInner />
    </Suspense>
  );
}
