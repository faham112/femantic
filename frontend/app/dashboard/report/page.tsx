"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function RedirectInner() {
  const router = useRouter();
  const params = useSearchParams();
  useEffect(() => {
    const dim = params.get("dim") || "path";
    const id = params.get("id");
    router.replace(`/dashboard/report/${encodeURIComponent(dim)}${id ? `?id=${encodeURIComponent(id)}` : ""}`);
  }, [router, params]);
  return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-navy-600" /></div>;
}

export default function ReportRedirect() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin" /></div>}><RedirectInner /></Suspense>;
}
