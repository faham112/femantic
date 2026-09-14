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

type Tab = "overview" | "users" | "sites" | "plans";

function AdminInner() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [websites, setWebsites] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [defaults, setDefaults] = useState<any>({ lite_max_sites: 1, lite_max_pageviews: 50000, pro_max_sites: 20, pro_max_pageviews: 2000000 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<number | string | null>(null);
  const [form, setForm] = useState({ email: "", password: "", full_name: "" });
  const [msg, setMsg] = useState("");

  const load = async () => {
    const [currentUser, stats, sites, userList, defs] = await Promise.all([
      getMe(),
      getAdminOverview(),
      api.get("/api/admin/websites").catch(() => api.get("/api/websites/")),
      api.get("/api/admin/users").catch(() => ({ data: [] })),
      api.get("/api/plans/defaults").catch(() => ({ data: null })),
    ]);
    if (currentUser.role !== "admin") { router.replace("/dashboard"); return; }
    setUser(currentUser);
    setOverview(stats);
    setWebsites(sites.data || []);
    setUsers(userList.data || []);
    if (defs.data) setDefaults(defs.data);
  };

  useEffect(() => {
    if (!Cookies.get("token")) { router.replace("/login"); return; }
    load().catch(() => { Cookies.remove("token"); router.replace("/login"); }).finally(() => setLoading(false));
  }, [router]);

  const filteredUsers = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter((u) => `${u.email} ${u.full_name || ""} ${u.role} ${u.plan_slug || ""}`.toLowerCase().includes(s));
  }, [users, q]);

  const filteredSites = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return websites;
    return websites.filter((w) => `${w.name} ${w.domain}`.toLowerCase().includes(s));
  }, [websites, q]);

  const patchUser = async (id: number, body: Record<string, any>) => {
    if (body.role === "admin") { alert("Cannot make anyone admin"); return; }
    setBusy(id);
    try {
      const res = await api.patch(`/api/users/${id}`, body);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...res.data } : u)));
    } catch { alert("Update failed"); }
    finally { setBusy(null); }
  };

  const promote = async (id: number, plan: string) => {
    setBusy(id);
    try {
      await api.post("/api/plans/promote", { user_id: id, plan });
      setMsg(plan === "pro" ? "Promoted to Super user" : "Set back to Lite");
      await load();
    } catch (e: any) { alert(e.response?.data?.detail || "Promote failed"); }
    finally { setBusy(null); }
  };

  const saveDefaults = async () => {
    setBusy("defs");
    try {
      const res = await api.put("/api/plans/defaults", {
        lite_max_sites: Number(defaults.lite_max_sites),
        lite_max_pageviews: Number(defaults.lite_max_pageviews),
        pro_max_sites: Number(defaults.pro_max_sites),
        pro_max_pageviews: Number(defaults.pro_max_pageviews),
      });
      setDefaults(res.data);
      setMsg("Signup defaults saved. New users get these caps.");
    } catch { alert("Save failed"); }
    finally { setBusy(null); }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("create");
    try {
      await api.post("/api/auth/register", form);
      setForm({ email: "", password: "", full_name: "" });
      setMsg("User created as Lite");
      await load();
    } catch (err: any) { alert(err.response?.data?.detail || "Create failed"); }
    finally { setBusy(null); }
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
            <p className="text-sm text-slate-500">Only you operate the system. Upgrade makes Super user — never admin.</p>
          </div>
          <div className="flex flex-wrap rounded-lg border border-slate-200 bg-white p-1 text-sm">
            {(["overview", "users", "sites", "plans"] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-md capitalize ${tab === t ? "bg-navy-700 text-white" : "text-slate-600 hover:bg-slate-50"}`}>{t}</button>
            ))}
          </div>
        </div>
        {msg && <div className="text-sm bg-sky-50 text-navy-800 rounded-lg px-3 py-2">{msg}</div>}

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
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-600">
              Lite signup default: {defaults.lite_max_sites} site / {Number(defaults.lite_max_pageviews).toLocaleString()} PV.
              Super user: {defaults.pro_max_sites} sites / {Number(defaults.pro_max_pageviews).toLocaleString()} PV.
            </div>
          </>
        )}

        {tab === "plans" && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-4 max-w-xl">
            <h2 className="font-semibold text-navy-800">Signup defaults</h2>
            <label className="block text-xs text-slate-500">Lite max sites
              <input type="number" min={1} value={defaults.lite_max_sites} onChange={(e) => setDefaults({ ...defaults, lite_max_sites: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
            </label>
            <label className="block text-xs text-slate-500">Lite monthly pageviews
              <input type="number" min={1000} value={defaults.lite_max_pageviews} onChange={(e) => setDefaults({ ...defaults, lite_max_pageviews: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
            </label>
            <label className="block text-xs text-slate-500">Super user max sites
              <input type="number" min={1} value={defaults.pro_max_sites} onChange={(e) => setDefaults({ ...defaults, pro_max_sites: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
            </label>
            <label className="block text-xs text-slate-500">Super user monthly pageviews
              <input type="number" min={1000} value={defaults.pro_max_pageviews} onChange={(e) => setDefaults({ ...defaults, pro_max_pageviews: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
            </label>
            <button onClick={saveDefaults} disabled={busy === "defs"} className="bg-navy-800 text-white text-sm font-semibold rounded-lg px-4 py-2">Save defaults</button>
          </div>
        )}

        {(tab === "users" || tab === "sites") && (
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white" />
          </div>
        )}

        {tab === "users" && (
          <>
            <form onSubmit={createUser} className="bg-white border border-slate-200 rounded-xl p-4 grid sm:grid-cols-4 gap-2 text-sm">
              <input required placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="border rounded-lg px-3 py-2" />
              <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border rounded-lg px-3 py-2" />
              <input required minLength={6} type="password" placeholder="Temp password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="border rounded-lg px-3 py-2" />
              <button disabled={busy === "create"} className="bg-navy-800 text-white rounded-lg font-semibold">Create Lite user</button>
            </form>
            <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[#0d4f7a] text-white text-left">
                  <tr>
                    <th className="px-3 py-2.5">User</th>
                    <th className="px-3 py-2.5">Access</th>
                    <th className="px-3 py-2.5">Plan</th>
                    <th className="px-3 py-2.5">Active</th>
                    <th className="px-3 py-2.5">Super user</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-navy-800">{u.full_name || "—"}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                        {u.upgrade_requested && <span className="text-[10px] text-amber-700">upgrade requested</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        {u.role === "admin" ? <span className="text-xs font-semibold">admin</span> : (
                          <select disabled={busy === u.id} value={u.role === "admin" ? "pro" : u.role} onChange={(e) => patchUser(u.id, { role: e.target.value })} className="border rounded-lg px-2 py-1 text-xs">
                            <option value="pro">owner</option>
                            <option value="client">viewer</option>
                          </select>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs">{u.plan_slug || "lite"}</td>
                      <td className="px-3 py-2.5">
                        <button disabled={u.role === "admin"} onClick={() => patchUser(u.id, { is_active: !u.is_active })}>
                          {u.is_active ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                        </button>
                      </td>
                      <td className="px-3 py-2.5">
                        {u.role === "admin" ? "—" : u.plan_slug === "pro" ? (
                          <button onClick={() => promote(u.id, "lite")} className="text-xs border rounded-lg px-2 py-1">Downgrade Lite</button>
                        ) : (
                          <button onClick={() => promote(u.id, "pro")} className="text-xs bg-navy-800 text-white rounded-lg px-2 py-1">Make Super user</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "sites" && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#0d4f7a] text-white text-left">
                <tr><th className="px-3 py-2.5">Site</th><th className="px-3 py-2.5">Owner</th><th className="px-3 py-2.5">Open</th></tr>
              </thead>
              <tbody className="divide-y">
                {filteredSites.map((w) => (
                  <tr key={w.id}>
                    <td className="px-3 py-2.5"><div className="font-medium">{w.name}</div><div className="text-xs text-slate-500">{w.domain}</div></td>
                    <td className="px-3 py-2.5 text-xs">uid {w.owner_id}</td>
                    <td className="px-3 py-2.5"><Link href={`/dashboard?id=${w.id}`} className="text-navy-700 text-xs font-medium">Dashboard</Link></td>
                  </tr>
                ))}
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
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
      <div className="flex items-center gap-2 text-navy-700">{icon}<span className="text-sm text-slate-500">{label}</span></div>
      <p className="mt-3 text-2xl font-bold text-navy-800">{typeof value === "number" ? value.toLocaleString() : value}</p>
    </div>
  );
}

export default function AdminPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin" /></div>}><AdminInner /></Suspense>;
}
