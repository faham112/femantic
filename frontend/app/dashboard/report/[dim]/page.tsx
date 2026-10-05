"use client";
import { Suspense } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import ReportView from "@/components/ReportView";

function DimInner() {
  const params = useParams<{ dim: string }>();
  const dim = decodeURIComponent(params.dim || "path");
  return <ReportView key={dim} dim={dim} />;
}

export default function DimReportPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin" /></div>}><DimInner /></Suspense>;
}
