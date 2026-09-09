"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { getMe, getWebsites } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { Loader2 } from "lucide-react";

function Inner() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sites, setSites] = useState<any[]>([]);
  useEffect(() => {
    if (!Cookies.get("token")) { router.push("/login"); return; }
    Promise.all([getMe(), getWebsites()]).then(([me, w]) => { setUser(me); setSites(w); }).catch(() => router.push("/login"));
  }, [router]);
  if (!user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin" /></div>;
  return (
    <AppShell user={user} websites={sites} title="Plan">
      <div className="max-w-lg bg-white border border-slate-200 rounded-2xl p-8 shadow-card">
        <h1 className="text-xl font-bold text-navy-800">Plan Management</h1>
        <p className="text-sm text-slate-500 mt-2">Current plan: <strong className="text-navy-800">{user.membership || "free"}</strong></p>
        <p className="text-sm text-slate-500 mt-3">Stripe billing is not wired yet. Sites, invites and tracking work on the free plan.</p>
      </div>
    </AppShell>
  );
}
export default function Page() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin" /></div>}><Inner /></Suspense>;
}
