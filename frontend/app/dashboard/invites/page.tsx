"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import api, { getMe } from "@/lib/api";
import Navbar from "@/components/Navbar";
import {
  Loader2,
  Plus,
  Copy,
  Check,
  Trash2,
  Link2,
  Shield,
} from "lucide-react";

interface Website {
  id: number;
  name: string;
  domain: string;
}

interface InviteToken {
  id: number;
  token: string;
  label?: string;
  allowed_website_ids: number[];
  allowed_metrics: string[];
  max_uses: number;
  used_count: number;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  invite_link?: string;
}

const METRIC_OPTIONS = [
  "visitors",
  "pageviews",
  "utm",
  "realtime",
  "devices",
  "countries",
];

export default function InvitesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tokens, setTokens] = useState<InviteToken[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [error, setError] = useState("");

  const [label, setLabel] = useState("");
  const [selectedSites, setSelectedSites] = useState<number[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    "visitors",
    "pageviews",
    "utm",
  ]);
  const [maxUses, setMaxUses] = useState(1);
  const [expiresDays, setExpiresDays] = useState(30);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      router.push("/login");
      return;
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const me = await getMe();
      if (me.role === "client") {
        router.push("/dashboard");
        return;
      }
      setUser(me);
      const [tokRes, webRes] = await Promise.all([
        api.get("/api/invites/"),
        api.get("/api/websites/"),
      ]);
      setTokens(tokRes.data);
      setWebsites(webRes.data);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSites.length === 0) {
      setError("Select at least one website");
      return;
    }
    setCreating(true);
    setError("");
    try {
      await api.post("/api/invites/", {
        label: label || undefined,
        allowed_website_ids: selectedSites,
        allowed_metrics: selectedMetrics,
        max_uses: maxUses,
        expires_in_days: expiresDays,
      });
      setShowCreate(false);
      setLabel("");
      setSelectedSites([]);
      setSelectedMetrics(["visitors", "pageviews", "utm"]);
      setMaxUses(1);
      setExpiresDays(30);
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to create token");
    } finally {
      setCreating(false);
    }
  };

  const revokeToken = async (id: number) => {
    if (!confirm("Revoke this invite token?")) return;
    try {
      await api.delete(`/api/invites/${id}`);
      await loadData();
    } catch {
      alert("Failed to revoke");
    }
  };

  const copyLink = (t: InviteToken) => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const link = `${base}/invite/${t.token}`;
    navigator.clipboard.writeText(link);
    setCopied(t.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleSite = (id: number) => {
    setSelectedSites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleMetric = (m: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar user={user} />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-indigo-400" />
              Invite Tokens
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Generate links for clients. They only see the websites & metrics you allow.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> New Token
          </button>
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">Create Invite Token</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Label (optional)</label>
                  <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
                    placeholder="e.g. Client ABC Report"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Allowed Websites *</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {websites.length === 0 ? (
                      <p className="text-slate-500 text-sm">No websites yet. Add one first.</p>
                    ) : (
                      websites.map((w) => (
                        <label key={w.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedSites.includes(w.id)}
                            onChange={() => toggleSite(w.id)}
                            className="rounded border-slate-600"
                          />
                          {w.name} <span className="text-slate-500">({w.domain})</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Allowed Metrics</label>
                  <div className="flex flex-wrap gap-2">
                    {METRIC_OPTIONS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleMetric(m)}
                        className={`px-3 py-1 rounded-full text-xs border ${
                          selectedMetrics.includes(m)
                            ? "bg-indigo-600 border-indigo-500 text-white"
                            : "bg-slate-800 border-slate-700 text-slate-400"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Max Uses</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={maxUses}
                      onChange={(e) => setMaxUses(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Expires (days)</label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={expiresDays}
                      onChange={(e) => setExpiresDays(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 border border-slate-700 rounded-lg text-sm">
                    Cancel
                  </button>
                  <button type="submit" disabled={creating} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Token"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {tokens.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl">
            <Link2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No invite tokens yet</p>
            <p className="text-slate-500 text-sm mt-1">Create one to share restricted analytics with clients</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tokens.map((t) => (
              <div
                key={t.id}
                className={`bg-slate-900 border rounded-xl p-4 ${
                  t.is_active ? "border-slate-800" : "border-red-900/50 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{t.label || "Untitled Invite"}</span>
                      {!t.is_active && (
                        <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded">Revoked</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-mono truncate">/invite/{t.token}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs text-slate-400">Uses: {t.used_count}/{t.max_uses}</span>
                      {t.expires_at && (
                        <span className="text-xs text-slate-400">Expires: {new Date(t.expires_at).toLocaleDateString()}</span>
                      )}
                      <span className="text-xs text-slate-400">Sites: {t.allowed_website_ids?.length || 0}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(t.allowed_metrics || []).map((m) => (
                        <span key={m} className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">{m}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {t.is_active && (
                      <button onClick={() => copyLink(t)} className="p-2 hover:bg-slate-800 rounded-lg" title="Copy invite link">
                        {copied === t.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                      </button>
                    )}
                    {t.is_active && (
                      <button onClick={() => revokeToken(t.id)} className="p-2 hover:bg-red-500/10 rounded-lg" title="Revoke">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
