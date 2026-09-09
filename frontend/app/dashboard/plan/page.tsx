"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { getMe, getWebsites } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { Loader2 } from "lucide-react";

const PLANS = [
  { id: "free", name: "Free", price: "$0", items: ["1 website", "30-day history", "Realtime", "Invites off"] },
  { id: "pro", name: "Pro", price: "$19/mo", items: ["10 websites", "12-month history", "Client invites", "UTM + events"] },
  { id: "agency", name: "Agency", price: "$49/mo", items: ["Unlimited sites", "White-label", "Team seats", "Priority support"] },
];

function Inner() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sites, setSites] = useState<any[]>([]);
  useEffect(() => {
    if (!Cookies.get("token")) { router.push("/login"); return; }
    Promise.all([getMe(), getWebsites()]).then(([me, w]) => { setUser(me); setSites(w); }).catch(() => router.push("/login"));
  }, [router]);
  if (!user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin" /></div>;
  const current = (user.membership || "free").toLowerCase();
  return (
    <AppShell user={user} websites={sites} title="Plan">
      <h1 className="text-xl font-bold text-navy-800 mb-2">Plan Management</h1>
      <p className="text-sm text-slate-500 mb-5">Stripe checkout is not connected. Plans are shown so you can pick one later; tracking works on Free.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((p) => (
          <div key={p.id} className={`bg-white border rounded-2xl p-5 shadow-card ${current.includes(p.id) ? "border-navy-700 ring-2 ring-navy-700/20" : "border-slate-200"}`}>
            <div className="text-sm font-semibold text-slate-500">{p.name}</div>
            <div className="text-2xl font-bold text-navy-800 mt-1">{p.price}</div>
            <ul className="mt-3 space-y-1 text-sm text-slate-600">
              {p.items.map((i) => <li key={i}>• {i}</li>)}
            </ul>
            <button disabled className="mt-4 w-full text-sm font-semibold rounded-lg py-2 bg-slate-100 text-slate-400 cursor-not-allowed">
              {current.includes(p.id) ? "Current plan" : "Stripe coming soon"}
            </button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
export default function Page() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin" /></div>}><Inner /></Suspense>;
}
