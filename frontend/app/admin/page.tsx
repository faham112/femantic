"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { BarChart3, Bot, Globe2, Loader2, ShieldCheck, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import { getAdminOverview, getMe } from "@/lib/api";

interface User {
  email: string;
  full_name?: string;
  role: string;
}

interface Overview {
  total_users: number;
  total_websites: number;
  total_pageviews: number;
  true_traffic: number;
  premium_users: number;
  bot_ratio: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Cookies.get("token")) {
      router.replace("/login");
      return;
    }

    Promise.all([getMe(), getAdminOverview()])
      .then(([currentUser, stats]) => {
        if (currentUser.role !== "admin") {
          router.replace("/dashboard");
          return;
        }
        setUser(currentUser);
        setOverview(stats);
      })
      .catch(() => {
        Cookies.remove("token");
        router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading || !overview) {
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
        <div className="mb-8">
          <p className="text-sm font-medium text-primary-600">Administration</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">System overview</h1>
          <p className="mt-2 text-slate-600">Monitor users, websites, and traffic quality.</p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat icon={<Users className="w-5 h-5" />} label="Users" value={overview.total_users} />
          <Stat icon={<Globe2 className="w-5 h-5" />} label="Websites" value={overview.total_websites} />
          <Stat icon={<BarChart3 className="w-5 h-5" />} label="Pageviews" value={overview.total_pageviews} />
          <Stat icon={<ShieldCheck className="w-5 h-5" />} label="True traffic" value={overview.true_traffic} />
          <Stat icon={<Users className="w-5 h-5" />} label="Premium users" value={overview.premium_users} />
          <Stat icon={<Bot className="w-5 h-5" />} label="Bot ratio" value={`${overview.bot_ratio}%`} />
        </section>
      </main>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center gap-2 text-primary-600">{icon}<span className="text-sm text-slate-500">{label}</span></div>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}