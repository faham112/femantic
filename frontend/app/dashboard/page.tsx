"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import api, { getMe } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import {
  Plus,
  Globe,
  Key,
  Copy,
  Check,
  Loader2,
  Trash2,
  BarChart3,
  Radio,
  Shield,
} from "lucide-react";

interface Website {
  id: number;
  name: string;
  domain: string;
  api_key: string;
  is_active: boolean;
  created_at: string;
}

interface User {
  id: number;
  email: string;
  full_name?: string;
  role: string;
  membership: string;
  brand_name?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [error, setError] = useState("");

  const isClient = user?.role === "client";
  const isProOrAdmin = user?.role === "pro" || user?.role === "admin";

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
      const [me, sites] = await Promise.all([
        getMe(),
        api.get("/api/websites/"),
      ]);
      setUser(me);
      setWebsites(sites.data);
    } catch {
      Cookies.remove("token");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setError("");
    try {
      const res = await api.post("/api/websites/", { name, domain });
      setWebsites([...websites, res.data]);
      setName("");
      setDomain("");
      setShowAdd(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to add website");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this website?")) return;
    try {
      await api.delete(`/api/websites/${id}`);
      setWebsites(websites.filter((w) => w.id !== id));
    } catch {
      alert("Failed to delete");
    }
  };

  const copyKey = (id: number, key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
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
      <Navbar user={user || undefined} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {isClient ? "Shared Analytics" : "Your Websites"}
            </h1>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">
              {isClient ? (
                <>
                  View-only access granted by your agency
                  {user?.brand_name && (
                    <span className="text-indigo-400"> · {user.brand_name}</span>
                  )}
                </>
              ) : (
                <>
                  Plan:{" "}
                  <span className="font-medium capitalize text-indigo-400">
                    {user?.membership}
                  </span>
                  {user?.membership === "free" && " (max 3 sites)"}
                </>
              )}
            </p>
          </div>
          {isProOrAdmin && (
            <div className="flex gap-2">
              <Link
                href="/dashboard/invites"
                className="inline-flex items-center justify-center gap-2 border border-slate-700 text-slate-300 font-medium px-4 py-2.5 rounded-xl hover:bg-slate-800 transition text-sm"
              >
                <Shield className="w-4 h-4" />
                Invite Clients
              </Link>
              <button
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-500 transition shadow-sm text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Website
              </button>
            </div>
          )}
        </div>

        {showAdd && isProOrAdmin && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 mb-6">
            <h2 className="font-semibold text-lg mb-4">Add New Website</h2>
            {error && (
              <div className="bg-red-500/10 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="My Blog"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Domain</label>
                  <input
                    required
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="example.com"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={adding}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-500 disabled:opacity-60"
                >
                  {adding ? "Adding..." : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {websites.length === 0 ? (
          <div className="bg-slate-900 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
            <Globe className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="font-semibold text-white">
              {isClient ? "No websites shared with you" : "No websites yet"}
            </h3>
            <p className="text-slate-500 mt-1 text-sm">
              {isClient
                ? "Ask your agency to generate an invite token and share the link."
                : "Add your first website to start tracking real-time traffic."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {websites.map((site) => (
              <div
                key={site.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{site.name}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">{site.domain}</p>
                  </div>
                  {isProOrAdmin && (
                    <button
                      onClick={() => handleDelete(site.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isProOrAdmin && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                      <Key className="w-3.5 h-3.5" />
                      API Key
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-slate-800 px-2 py-1.5 rounded-lg truncate font-mono text-slate-300">
                        {site.api_key}
                      </code>
                      <button
                        onClick={() => copyKey(site.id, site.api_key)}
                        className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg"
                      >
                        {copied === site.id ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/dashboard/analytics?id=${site.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium bg-indigo-500/10 text-indigo-400 px-3 py-2 rounded-lg hover:bg-indigo-500/20 transition"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    Analytics
                  </Link>
                  <Link
                    href={`/dashboard/realtime?id=${site.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 px-3 py-2 rounded-lg hover:bg-emerald-500/20 transition"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    Realtime
                  </Link>
                </div>

                {isProOrAdmin && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <p className="text-xs text-slate-500 mb-2">Tracking snippet:</p>
                    <pre className="text-[10px] sm:text-xs bg-slate-950 text-slate-300 p-3 rounded-lg overflow-x-auto border border-slate-800">
{`<script src="${typeof window !== "undefined" ? window.location.origin : ""}/tracker/femantic.js" data-key="${site.api_key}"></script>`}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
