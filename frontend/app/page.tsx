"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";
import {
  BarChart3, Shield, Zap, Smartphone, Eye, Users, Activity, ArrowRight, CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) router.push("/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-sky-500/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-[100px]" />
      </div>

      <header className="relative z-50 border-b border-white/5 backdrop-blur-xl bg-slate-950/70 sticky top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/30">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Femantic</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 transition">Login</Link>
            <Link href="/register" className="text-sm font-semibold bg-gradient-to-r from-sky-500 to-blue-600 text-white px-4 py-2.5 rounded-xl hover:from-sky-400 hover:to-blue-500 transition shadow-lg shadow-sky-500/25">Get Started Free</Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs font-medium text-sky-300 mb-8">
            <Activity className="w-3.5 h-3.5" /> Real-time · True Traffic · Multi-user
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
            Track Real-time.<br />
            <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">Track True.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            A new journey – track your traffic from here. Multi-user analytics with admin control, premium membership and fully responsive design.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold rounded-2xl hover:from-sky-400 hover:to-blue-500 transition shadow-xl shadow-sky-500/30">
              Start Free <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center px-8 py-4 bg-white/5 text-white font-semibold rounded-2xl border border-white/10 hover:bg-white/10 transition">Login to Dashboard</Link>
          </div>

          <div className="mt-16 sm:mt-20 relative mx-auto max-w-4xl">
            <div className="absolute -inset-1 bg-gradient-to-r from-sky-500/30 via-cyan-400/20 to-blue-600/30 rounded-3xl blur-xl" />
            <div className="relative bg-slate-900/90 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400/80" /><div className="w-3 h-3 rounded-full bg-amber-400/80" /><div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                <span className="ml-3 text-xs text-slate-500 font-mono">femantic.app/dashboard</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[{"label":"Live Visitors","value":"127","Icon":Users},{"label":"Page Views","value":"843","Icon":Eye},{"label":"True Traffic","value":"91%","Icon":Shield},{"label":"Sessions","value":"94","Icon":Activity}].map((s) => (
                  <div key={s.label} className="bg-slate-800/80 rounded-xl p-3 sm:p-4 border border-white/5">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] sm:text-xs mb-1"><s.Icon className="w-3 h-3" />{s.label}</div>
                    <p className="text-xl sm:text-2xl font-bold text-white">{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 h-24 sm:h-32 bg-gradient-to-t from-sky-500/10 to-transparent rounded-xl border border-white/5 flex items-end justify-around px-4 pb-2">
                {[40,65,45,80,55,90,70,85,60,75].map((h,i)=>(
                  <div key={i} className="w-2 sm:w-3 bg-gradient-to-t from-sky-500 to-cyan-300 rounded-t opacity-80" style={{height:`${h}%`}} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/5 bg-slate-900/40 py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <h2 className="text-2xl sm:text-4xl font-bold">Everything you need</h2>
              <p className="mt-3 text-slate-400 max-w-xl mx-auto">Built for agencies, marketers and website owners who care about real numbers.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Feature icon={<Zap className="w-6 h-6" />} title="Real-time Traffic" desc="Live pageviews, sessions and true human traffic filtered from bots." />
              <Feature icon={<Shield className="w-6 h-6" />} title="Admin Power" desc="Only admin manages users, API keys and premium memberships." />
              <Feature icon={<BarChart3 className="w-6 h-6" />} title="Multi-user" desc="Each user tracks their own websites. Premium unlocks unlimited sites." />
              <Feature icon={<Smartphone className="w-6 h-6" />} title="Fully Responsive" desc="Perfect on mobile, tablet and desktop. Built mobile-first." />
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-2xl sm:text-4xl font-bold leading-tight">Not just bots.<br /><span className="text-sky-400">True traffic scoring.</span></h2>
                <p className="mt-4 text-slate-400 leading-relaxed">Femantic uses a Traffic Quality Score. See Humans, Suspicious and Bots separately.</p>
                <ul className="mt-6 space-y-3">
                  {["Bot & crawler detection","Headless browser signals","Session behaviour scoring","Human / Suspicious / Bot labels"].map((item)=>(
                    <li key={item} className="flex items-center gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0" />{item}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
                <TrafficRow label="Humans" value={1284} color="bg-emerald-500" pct={85} />
                <TrafficRow label="Suspicious" value={42} color="bg-amber-500" pct={8} />
                <TrafficRow label="Bots" value={173} color="bg-rose-500" pct={12} />
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/5 bg-slate-900/40 py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-4xl font-bold">Simple pricing</h2>
            <p className="mt-3 text-slate-400">Start free. Upgrade when you grow.</p>
            <div className="mt-12 grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 text-left">
                <h3 className="font-semibold text-lg">Free</h3>
                <p className="text-3xl font-bold mt-2">$0</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-400"><li>• 3 websites</li><li>• 7-day retention</li><li>• Basic analytics</li><li>• Realtime visitors</li></ul>
                <Link href="/register" className="mt-6 block text-center py-2.5 rounded-xl border border-white/10 text-sm font-medium hover:bg-white/5 transition">Get Started</Link>
              </div>
              <div className="bg-gradient-to-b from-sky-500/20 to-slate-900/80 border border-sky-500/30 rounded-2xl p-6 text-left relative">
                <div className="absolute top-3 right-3 text-[10px] font-bold bg-sky-500 text-white px-2 py-0.5 rounded-full">PRO</div>
                <h3 className="font-semibold text-lg">Femantic Pro</h3>
                <p className="text-3xl font-bold mt-2">$19<span className="text-base font-normal text-slate-400">/mo</span></p>
                <ul className="mt-4 space-y-2 text-sm text-slate-300"><li>• Unlimited websites</li><li>• 365-day retention</li><li>• Advanced filters & export</li><li>• Detailed geo + API access</li></ul>
                <Link href="/register" className="mt-6 block text-center py-2.5 rounded-xl bg-sky-500 text-white text-sm font-semibold hover:bg-sky-400 transition">Upgrade to Pro</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-4xl font-bold">Ready to track true traffic?</h2>
            <p className="mt-4 text-slate-400">Join Femantic and see real visitors — not noise.</p>
            <Link href="/register" className="mt-8 inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold rounded-2xl hover:from-sky-400 hover:to-blue-500 transition shadow-xl shadow-sky-500/30">
              Create free account <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Femantic — Track real-time. Track true. Track from here.
      </footer>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-6 hover:border-sky-500/30 transition group">
      <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4 group-hover:bg-sky-500/20 transition">{icon}</div>
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function TrafficRow({ label, value, color, pct }: { label: string; value: number; color: string; pct: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-slate-300">{label}</span>
        <span className="font-semibold text-white">{value.toLocaleString()}</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
