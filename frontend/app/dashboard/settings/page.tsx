"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import api, { getMe, getWebsites } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { Copy, Check, Pause, Play, Trash2, RefreshCw, ExternalLink, Plus, Loader2 } from "lucide-react";

function SettingsInner() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [edit, setEdit] = useState<any>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  const load = async () => {
    const [me, list] = await Promise.all([getMe(), getWebsites()]);
    setUser(me); setSites(list);
  };

  useEffect(() => {
    if (!Cookies.get("token")) { router.push("/login"); return; }
    load().catch(() => router.push("/login"));
  }, [router]);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://analytics.globalcareerhub.org";
  const snippet = (s: any) => `<script defer data-site="${s.api_key}" src="${origin}/tracker/femantic.js"></script>`;

  const save = async () => {
    if (!edit) return;
    setBusy(edit.id);
    try {
      await api.patch(`/api/websites/${edit.id}`, { name: edit.name, domain: edit.domain });
      setMsg("Saved"); setEdit(null); await load();
    } catch (e: any) { setMsg(e.response?.data?.detail || "Save failed"); }
    finally { setBusy(null); }
  };

  const toggle = async (s: any) => {
    setBusy(s.id);
    try {
      await api.patch(`/api/websites/${s.id}`, { is_active: !s.is_active });
      await load();
    } finally { setBusy(null); }
  };

  const rotate = async (s: any) => {
    if (!confirm(`Rotate tracking key for ${s.domain}? Old tag will stop working until you replace the script.`)) return;
    setBusy(s.id);
    try {
      await api.post(`/api/websites/${s.id}/rotate-key`);
      setMsg("New key issued — update the site tag."); await load();
    } finally { setBusy(null); }
  };

  const remove = async (s: any) => {
    if (!confirm(`Delete ${s.domain} and all its analytics? This cannot be undone.`)) return;
    setBusy(s.id);
    try {
      await api.delete(`/api/websites/${s.id}`);
      await load();
    } finally { setBusy(null); }
  };

  const canManage = user?.role === "admin" || user?.role === "pro";

  return (
    <AppShell user={user} websites={sites} title="Settings · Sites">
      <div className="max-w-4xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-navy-800">Website management</h1>
            <p className="text-sm text-slate-500">Rename, pause tracking, rotate keys, or remove sites.</p>
          </div>
          {canManage && (
            <Link href="/dashboard/sites/new" className="inline-flex items-center justify-center gap-1.5 bg-navy-800 text-white text-sm font-semibold rounded-lg px-3 py-2">
              <Plus className="w-4 h-4" /> Activate site
            </Link>
          )}
        </div>
        {msg && <div className="text-sm bg-sky-50 text-navy-800 rounded-lg px-3 py-2">{msg}</div>}
        {sites.length === 0 && <p className="text-sm text-slate-500">No websites yet.</p>}
        {sites.map((s) => (
          <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-navy-800">{s.name}</h2>
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${s.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {s.is_active ? "Active" : "Paused"}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{s.domain}</p>
                <p className="text-[11px] text-slate-400 mt-1">Added {s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/dashboard?id=${s.id}`} className="text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1">
                  <ExternalLink className="w-3.5 h-3.5" /> Open
                </Link>
                {canManage && (
                  <>
                    <button onClick={() => toggle(s)} disabled={busy === s.id} className="text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1">
                      {s.is_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {s.is_active ? "Pause" : "Resume"}
                    </button>
                    <button onClick={() => rotate(s)} disabled={busy === s.id} className="text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5" /> Rotate key
                    </button>
                    <button onClick={() => remove(s)} disabled={busy === s.id} className="text-xs font-medium border border-red-200 text-red-600 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </>
                )}
              </div>
            </div>

            {edit?.id === s.id ? (
              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className="border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Name" />
                <input value={edit.domain} onChange={(e) => setEdit({ ...edit, domain: e.target.value })} className="border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="domain.com" />
                <div className="sm:col-span-2 flex gap-2">
                  <button onClick={save} className="bg-navy-800 text-white text-sm rounded-lg px-3 py-1.5">Save</button>
                  <button onClick={() => setEdit(null)} className="text-sm text-slate-500">Cancel</button>
                </div>
              </div>
            ) : canManage && (
              <button onClick={() => setEdit({ id: s.id, name: s.name, domain: s.domain })} className="mt-3 text-xs text-navy-700 font-medium">Edit name / domain</button>
            )}

            <div className="mt-3 relative bg-slate-50 border border-slate-200 rounded-lg p-3">
              <button onClick={() => { navigator.clipboard.writeText(snippet(s)); setCopied(s.id); setTimeout(() => setCopied(null), 1200); }}
                className="absolute top-2 right-2 text-[11px] text-slate-500 inline-flex items-center gap-1">
                {copied === s.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === s.id ? "Copied" : "Copy tag"}
              </button>
              <pre className="text-[11px] overflow-x-auto whitespace-pre-wrap break-all pr-16">{snippet(s)}</pre>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

export default function SettingsPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-navy-700" /></div>}><SettingsInner /></Suspense>;
}
