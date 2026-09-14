"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

export default function QuotaMeter({ hidden }: { hidden?: boolean }) {
  const [q, setQ] = useState<any>(null);
  useEffect(() => {
    if (hidden) return;
    api.get("/api/plans/quota").then((r) => setQ(r.data)).catch(() => setQ(null));
  }, [hidden]);
  if (hidden || !q || q.is_client) return null;
  const cap = q.max_pageviews || 1;
  const used = q.used_pageviews || 0;
  const pct = Math.min(100, q.pct || 0);
  const over = q.over_traffic || q.over_sites;
  return (
    <Link href="/dashboard/plan" className="mt-2 block px-1">
      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
        <span className="capitalize">{q.plan_slug === "pro" ? "Super user" : q.plan_slug} plan</span>
        <span>{used.toLocaleString()} / {cap >= 999999999 ? "∞" : cap.toLocaleString()}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full ${over ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-navy-700"}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[10px] text-slate-400 mt-1">{q.used_sites}/{q.max_sites >= 999999 ? "∞" : q.max_sites} sites{over ? " · upgrade" : ""}</div>
    </Link>
  );
}
