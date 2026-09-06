"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import api, { getMe } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { Loader2, Plus, Copy, Check, Trash2, Link2, Shield } from "lucide-react";

const METRIC_OPTIONS = ["visitors", "pageviews", "utm", "realtime", "devices", "countries"];

function InvitesInner() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tokens, setTokens] = useState<any[]>([]);
  const [websites, setWebsites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [label, setLabel] = useState("");
  const [selectedSites, setSelectedSites] = useState<number[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["visitors", "pageviews", "utm"]);
  const [maxUses, setMaxUses] = useState(1);
  const [expiresDays, setExpiresDays] = useState(30);

  const loadData = async () => {
    try {
      const me = await getMe();
      if (me.role === "client") { router.push("/dashboard"); return; }
      setUser(me);
      const [tokRes, webRes] = await Promise.all([api.get("/api/invites/"), api.get("/api/websites/")]);
      setTokens(tokRes.data); setWebsites(webRes.data);
    } catch { router.push("/login"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!Cookies.get("token")) { router.push("/login"); return; }
    loadData();
  }, [router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSites.length) { setError("Select at least one website"); return; }
    setCreating(true); setError("");
    try {
      await api.post("/api/invites/", { label: label || undefined, allowed_website_ids: selectedSites, allowed_metrics: selectedMetrics, max_uses: maxUses, expires_in_days: expiresDays });
      setShowCreate(false); setLabel(""); setSelectedSites([]); await loadData();
    } catch (err: any) { setError(err?.response?.data?.detail || "Failed to create token"); }
    finally { setCreating(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-navy-600" /></div>;

  return (
    <AppShell user={user} websites={websites} title="Invites">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-navy-800 flex items-center gap-2"><Shield className="w-5 h-5" /> Invite Tokens</h1>
          <p className="text-sm text-slate-500">Share scoped analytics access with clients.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-navy-700 text-white rounded-lg text-sm font-medium"><Plus className="w-4 h-4" /> New Token</button>
      </div>
      {showCreate && (
        <div className="fixed inset-0 bg-navy-900/40 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4">
            <h2 className="font-semibold text-navy-800">Create Invite Token</h2>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (optional)" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {websites.map((w: any) => (
                <label key={w.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={selectedSites.includes(w.id)} onChange={() => setSelectedSites((p) => p.includes(w.id) ? p.filter((x) => x !== w.id) : [...p, w.id])} />
                  {w.name} <span className="text-slate-400">({w.domain})</span>
                </label>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {METRIC_OPTIONS.map((m) => (
                <button key={m} type="button" onClick={() => setSelectedMetrics((p) => p.includes(m) ? p.filter((x) => x !== m) : [...p, m])} className={`px-3 py-1 rounded-full text-xs border ${selectedMetrics.includes(m) ? "bg-navy-700 text-white border-navy-700" : "border-slate-200"}`}>{m}</button>
              ))}
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowCreate(false)} className="flex-1 border border-slate-200 rounded-lg py-2 text-sm">Cancel</button>
              <button disabled={creating} className="flex-1 bg-navy-700 text-white rounded-lg py-2 text-sm">{creating ? "Creating…" : "Create Token"}</button>
            </div>
          </form>
        </div>
      )}
      {!tokens.length ? (
        <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-white">
          <Link2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No invite tokens yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tokens.map((t: any) => (
            <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-navy-800">{t.label || "Untitled Invite"}</div>
                <div className="text-xs text-slate-400 truncate">/invite/{t.token}</div>
                <div className="text-xs text-slate-500 mt-1">Uses {t.used_count}/{t.max_uses} · Sites {t.allowed_website_ids?.length || 0}</div>
              </div>
              <div className="flex gap-2">
                {t.is_active && (
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/invite/${t.token}`); setCopied(t.id); setTimeout(() => setCopied(null), 1500); }} className="p-2 border border-slate-200 rounded-lg">
                    {copied === t.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
                {t.is_active && <button onClick={() => api.delete(`/api/invites/${t.id}`).then(loadData)} className="p-2 border border-slate-200 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

export default function InvitesPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin" /></div>}><InvitesInner /></Suspense>;
}
