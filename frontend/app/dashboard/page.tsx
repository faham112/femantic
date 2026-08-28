"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { BarChart3, Globe2, Loader2, Plus, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import { getMe, getWebsites } from "@/lib/api";

interface User {
  email: string;
  full_name?: string;
  role: string;
  membership: string;
}

interface Website {
  id: number;
  name: string;
  domain: string;
  is_active: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Cookies.get("token")) {
      router.replace("/login");
      return;
    }

    Promise.all([getMe(), getWebsites()])
      .then(([currentUser, currentWebsites]) => {
        setUser(currentUser);
        setWebsites(currentWebsites);
      })
      .catch(() => {
        Cookies.remove("token");
        router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-7 h-7 text-primary-600 animate-spin" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user ?? undefined} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-medium text-primary-600">Overview</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">
              Welcome back{user?.full_name ? `, ${user.full_name}` : ""}
            </h1>
            <p className="mt-2 text-slate-600">Your traffic analytics workspace is ready.</p>
          </div>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition">
            <Plus className="w-4 h-4" />
            Add website
          </button>
        </div>

        <section className="grid gap-4 sm:grid-cols-3 mb-8">
          <Stat icon={<Globe2 className="w-5 h-5" />} label="Websites" value={websites.length} />
          <Stat icon={<BarChart3 className="w-5 h-5" />} label="Plan" value={user?.membership ?? "free"} />
          <Stat icon={<ShieldCheck className="w-5 h-5" />} label="Account" value={user?.role ?? "user"} />
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-900">Your websites</h2>
          {websites.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-8 text-center">
              <Globe2 className="mx-auto w-8 h-8 text-slate-400" />
              <p className="mt-3 font-medium text-slate-900">No websites connected yet</p>
              <p className="mt-1 text-sm text-slate-500">Add your first website to start collecting traffic.</p>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {websites.map((website) => (
                <div key={website.id} className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium text-slate-900">{website.name}</p>
                    <p className="text-sm text-slate-500">{website.domain}</p>
                  </div>
                  <span className="text-xs font-medium text-emerald-700">{website.is_active ? "Active" : "Inactive"}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center gap-2 text-primary-600">{icon}<span className="text-sm text-slate-500">{label}</span></div>
      <p className="mt-3 text-2xl font-bold capitalize text-slate-900">{value}</p>
    </div>
  );
}