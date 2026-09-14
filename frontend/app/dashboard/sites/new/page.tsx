"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";
import api, { getMe } from "@/lib/api";
import { Loader2, Check, Copy } from "lucide-react";

const PUBLIC_ORIGIN = "https://analytics.globalcareerhub.org";
const ZONES = ["UTC", "Asia/Karachi (UTC+05:00)", "Asia/Dubai (UTC+04:00)", "Europe/Rome (UTC+02:00)", "Europe/London (UTC+00:00)", "America/New_York (UTC-04:00)"];

function Wizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [domain, setDomain] = useState("");
  const [name, setName] = useState("");
  const [tz, setTz] = useState(ZONES[1]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [site, setSite] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!Cookies.get("token")) router.push("/login");
    getMe().catch(() => router.push("/login"));
  }, [router]);
  const snippet = site
    ? `<script defer data-site="${site.api_key}" src="${PUBLIC_ORIGIN}/tracker/femantic.js"></script>`
    : "";
  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const clean = domain.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
      const res = await api.post("/api/websites/", { name: name || clean, domain: clean });
      setSite(res.data); setStep(2);
    } catch (err: any) { setError(err.response?.data?.detail || "Could not create site"); }
    finally { setSaving(false); }
  };
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-navy-800 text-white pt-10 pb-28 px-4 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold">Activate your site</h1>
        <p className="mt-2 text-white/70 text-sm">Register your website in 2 simple steps</p>
        <div className="mt-6 flex items-center justify-center gap-3 text-sm">
          <span className={`inline-flex items-center gap-2 ${step === 1 ? "text-white" : "text-emerald-300"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? "bg-sky-500" : "bg-emerald-500"}`}>{step === 2 ? <Check className="w-3.5 h-3.5" /> : "1"}</span>
            Website info
          </span>
          <span className="w-10 h-px bg-white/30" />
          <span className={`inline-flex items-center gap-2 ${step === 2 ? "text-white" : "text-white/50"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? "bg-sky-500" : "bg-white/20"}`}>2</span>
            Tag your site
          </span>
        </div>
      </div>
      <div className="max-w-xl mx-auto px-4 -mt-16 pb-16">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5 sm:p-8">
          {step === 1 ? (
            <form onSubmit={create} className="space-y-5">
              <h2 className="text-center font-semibold text-lg">Website info</h2>
              {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}
              <div>
                <label className="block text-sm font-semibold">Domain</label>
                <p className="text-xs text-slate-500 mt-1 mb-2">Blogger: yourblog.blogspot.com ya custom domain — without https://</p>
                <input required value={domain} onChange={(e) => setDomain(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500" placeholder="myblog.blogspot.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold">Display name (optional)</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500 mt-2" placeholder="My blog" />
              </div>
              <div>
                <label className="block text-sm font-semibold">Timezone</label>
                <select value={tz} onChange={(e) => setTz(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white mt-2">
                  {ZONES.map((z) => <option key={z}>{z}</option>)}
                </select>
              </div>
              <button disabled={saving} className="w-full bg-[#1b8fd6] hover:bg-[#1578b5] text-white font-semibold rounded-lg py-3">{saving ? "Creating…" : "Create dashboard"}</button>
              <Link href="/dashboard" className="block text-center text-sm text-slate-500">Cancel</Link>
            </form>
          ) : (
            <div>
              <h2 className="text-center font-semibold text-lg mb-5">Tag your site</h2>
              <p className="text-sm font-semibold">1 · Copy this exact script</p>
              <p className="text-xs text-slate-500 mt-1 mb-2">Key is tied to {site?.domain}.</p>
              <div className="relative bg-slate-50 border border-slate-200 rounded-xl p-3">
                <button onClick={() => { navigator.clipboard.writeText(snippet); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="absolute top-2 right-2 text-xs flex items-center gap-1 text-slate-500">
                  <Copy className="w-3.5 h-3.5" /> {copied ? "Copied" : "Copy"}
                </button>
                <pre className="text-[11px] sm:text-xs overflow-x-auto pt-4 whitespace-pre-wrap break-all">{snippet}</pre>
              </div>

              <div className="mt-5 space-y-3 text-sm text-slate-700">
                <p className="font-semibold text-navy-800">2 · Paste it here (pick your platform)</p>
                <div className="border border-slate-200 rounded-xl p-3">
                  <p className="font-semibold">Blogger</p>
                  <ol className="list-decimal ml-5 mt-1 text-xs text-slate-600 space-y-1">
                    <li>Blogger → Theme → <b>Edit HTML</b></li>
                    <li>Find <code className="bg-slate-100 px-1">&lt;/body&gt;</code> (Ctrl+F)</li>
                    <li>Paste the script <b>just above</b> <code className="bg-slate-100 px-1">&lt;/body&gt;</code></li>
                    <li>Save theme. Open the live blog in a new tab (not only auto-refresh preview).</li>
                  </ol>
                  <p className="text-[11px] text-slate-500 mt-2">Alternate: Layout → add gadget “HTML/JavaScript” in footer → paste same script → Save.</p>
                </div>
                <div className="border border-slate-200 rounded-xl p-3">
                  <p className="font-semibold">WordPress / HTML site</p>
                  <p className="text-xs text-slate-600 mt-1">Paste before <code className="bg-slate-100 px-1">&lt;/body&gt;</code> in footer.php or theme footer. Not inside a post body.</p>
                </div>
              </div>

              <p className="mt-4 text-xs bg-amber-50 border-l-4 border-amber-400 p-3 text-amber-900">
                Realtime tab sirf <b>live pageviews</b> dikhata hai. Auto-refresh extension kabhi script skip karti hai.
                Blog homepage manually open karo, 8 seconds wait, phir Femantic Real Time refresh.
              </p>
              <Link href={`/dashboard/realtime?id=${site?.id}`} className="mt-5 w-full inline-flex justify-center bg-[#1b8fd6] text-white font-semibold rounded-lg py-3">Open Real Time</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NewSitePage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin" /></div>}><Wizard /></Suspense>;
}
