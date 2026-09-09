"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { getMe, getWebsites } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { Loader2 } from "lucide-react";

function HelpInner() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sites, setSites] = useState<any[]>([]);
  useEffect(() => {
    if (!Cookies.get("token")) { router.push("/login"); return; }
    Promise.all([getMe(), getWebsites()]).then(([me, w]) => { setUser(me); setSites(w); }).catch(() => router.push("/login"));
  }, [router]);
  return (
    <AppShell user={user} websites={sites} title="Help">
      <div className="max-w-3xl space-y-6">
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-bold text-navy-800 mb-3">FAQ</h2>
          {[
            ["How do I install the tag?", "Settings → copy the script → paste before </body> on every page."],
            ["Why is country empty?", "Nginx / Cloudflare should forward CF-IPCountry. Tracker also sends timezone as fallback."],
            ["What is AI Traffic?", "Bot / suspicious / human score from user-agent heuristics."],
            ["How long is a session?", "First pageview to last heartbeat (or last pageview) for that visitor."],
          ].map(([q, a]) => (
            <details key={q} className="border-b border-slate-100 py-3">
              <summary className="font-medium cursor-pointer text-sm">{q}</summary>
              <p className="mt-1 text-sm text-slate-500">{a}</p>
            </details>
          ))}
        </section>
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-bold text-navy-800 mb-2">Create ticket</h2>
          <p className="text-sm text-slate-500 mb-3">Email support with the site domain and a short description.</p>
          <a href="mailto:admin@femantic.com?subject=Femantic%20support" className="inline-block bg-navy-800 text-white text-sm font-semibold rounded-lg px-4 py-2">Email support</a>
        </section>
        <section className="bg-white border border-slate-200 rounded-xl p-5 text-sm space-y-2">
          <h2 className="font-bold text-navy-800">Documentation</h2>
          <p><code className="bg-slate-100 px-1 rounded">POST /api/track/&#123;api_key&#125;</code> — pageview / heartbeat / event</p>
          <p><code className="bg-slate-100 px-1 rounded">GET /api/track/stats/&#123;id&#125;</code> — overview KPIs</p>
          <p><code className="bg-slate-100 px-1 rounded">GET /api/track/series/&#123;id&#125;</code> — daily series</p>
          <p><code className="bg-slate-100 px-1 rounded">GET /api/track/breakdown/&#123;id&#125;?dim=country</code> — tables</p>
          <p>Script: <code className="bg-slate-100 px-1 rounded">/tracker/femantic.js</code> with <code>data-site</code> = API key.</p>
        </section>
      </div>
    </AppShell>
  );
}

export default function HelpPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin" /></div>}><HelpInner /></Suspense>;
}
