"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";
import { BarChart3, ArrowRight, Check, Shield, Radio, Globe, Sparkles } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  useEffect(() => { if (Cookies.get("token")) router.push("/dashboard"); }, [router]);

  return (
    <div className="min-h-screen bg-white text-slate-800 overflow-x-hidden">
      <header className="absolute inset-x-0 top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-700 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-white tracking-tight">Femantic</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-white/90">
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="text-sm text-white/90 hover:text-white px-2 py-1.5">Log In</Link>
            <Link href="/register" className="text-sm font-semibold text-white border border-white/40 rounded-lg px-3 py-1.5 hover:bg-white/10">Sign Up</Link>
          </div>
        </div>
      </header>

      <section className="landing-hero relative pt-28 sm:pt-32 pb-16 sm:pb-24 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-[28px] leading-tight sm:text-5xl lg:text-[56px] font-extrabold tracking-tight">
            The Google Analytics Alternative<br className="hidden sm:block" /> Built for{" "}
            <em className="not-italic text-accent">Publishers</em>
          </h1>
          <p className="mt-5 text-sm sm:text-lg text-white/75 max-w-xl mx-auto">
            Get the most accurate analytics for your website, grow your audience and increase your revenue.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold rounded-full px-6 py-3 text-sm">
              14-days Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#features" className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-full px-6 py-3 text-sm border border-white/15">
              <Sparkles className="w-4 h-4" /> Our Features
            </a>
          </div>
          <p className="mt-3 text-xs text-white/60 flex items-center justify-center gap-1.5"><Check className="w-3.5 h-3.5" /> No credit card required</p>
        </div>
        <div className="mt-12 sm:mt-16 max-w-5xl mx-auto px-4">
          <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 overflow-hidden shadow-2xl">
            <div className="bg-[#f3f5f8] text-slate-800 p-3 sm:p-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 text-[10px] sm:text-xs">
                {["Users 66.4K", "Sessions 72K", "Pageviews 95K", "Bounce 15.8%", "Duration 01:01"].map((x, i) => (
                  <div key={x} className={`px-2 py-2 rounded ${i === 0 ? "bg-[#0d4f7a] text-white" : "bg-white border border-slate-200"}`}>{x}</div>
                ))}
              </div>
              <div className="mt-2 h-20 sm:h-28 bg-white rounded border border-slate-200 overflow-hidden flex items-end gap-1 px-3 pb-2">
                {[40, 70, 42, 44, 40, 55, 35, 58, 48, 40, 44, 42].map((h, i) => (
                  <div key={i} className="flex-1 bg-navy-600/30 rounded-t" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-16 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-navy-800">GA4-style reports. True traffic.</h2>
            <p className="mt-3 text-slate-500 text-sm sm:text-base">Users, sessions, pageviews, bounce and realtime — clean publisher UI from 320px up.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { icon: Radio, t: "Realtime overview", d: "Active users, pageviews per minute, devices and live paths." },
              { icon: Shield, t: "True traffic score", d: "Separate humans, suspicious visits and bots." },
              { icon: Globe, t: "Site + Network", d: "One site or a network. Invite clients with scoped access." },
              { icon: BarChart3, t: "Acquisition & content", d: "Top pages, referrers, devices and sources." },
              { icon: Sparkles, t: "2-step activation", d: "Add domain + timezone, then paste the Femantic tag." },
              { icon: Check, t: "Responsive 320 → XL", d: "Sidebar collapses on phones. Cards stack. Charts scale." },
            ].map((f) => (
              <div key={f.t} className="rounded-2xl border border-slate-200 p-5 sm:p-6 hover:border-navy-200 hover:shadow-card transition">
                <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center mb-3"><f.icon className="w-5 h-5" /></div>
                <h3 className="font-semibold text-navy-800">{f.t}</h3>
                <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-16 sm:py-24 bg-[#f6f8fb]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-navy-800">Simple pricing</h2>
          <p className="mt-3 text-slate-500">Start free. Scale when traffic grows.</p>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-left">
            <Plan name="Lite" price="$0" tag="Essentials" items={["3 websites", "7-day retention", "Realtime + basic reports", "Bot scoring"]} />
            <Plan name="Business" price="$19" tag="Most popular" featured items={["20 websites", "1 year retention", "Invite clients", "Hour granularity", "Export & API"]} />
            <Plan name="Enterprise" price="Talk to us" tag="Unlimited" items={["Unlimited sites & team", "Custom retention", "Networks", "Minute granularity", "SLA"]} />
          </div>
        </div>
      </section>

      <section id="faq" className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-navy-800 text-center mb-8">FAQ</h2>
          {[
            ["Is this a GA4 alternative?", "Yes. Users, sessions, pageviews, bounce and acquisition with a cleaner publisher-first UI."],
            ["How do I install the tag?", "Activate a site, copy the Femantic script, paste it before the closing body tag."],
            ["Can agencies invite clients?", "Pro and Admin users generate invite tokens with scoped website access."],
          ].map(([q, a]) => (
            <details key={q} className="border-b border-slate-200 py-4">
              <summary className="font-semibold cursor-pointer text-navy-800">{q}</summary>
              <p className="mt-2 text-sm text-slate-500">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="bg-navy-800 text-white/70 py-8 text-center text-sm">
        © {new Date().getFullYear()} Femantic · Track real-time. Track true.
        <div className="mt-2 flex justify-center gap-4 text-xs">
          <Link href="/login" className="hover:text-white">Login</Link>
          <Link href="/register" className="hover:text-white">Sign up</Link>
        </div>
      </footer>
    </div>
  );
}

function Plan({ name, price, tag, items, featured }: { name: string; price: string; tag: string; items: string[]; featured?: boolean }) {
  return (
    <div className={`rounded-2xl p-6 border ${featured ? "bg-navy-800 text-white border-navy-800 shadow-xl" : "bg-white border-slate-200"}`}>
      <div className={`text-[11px] font-bold uppercase tracking-wide ${featured ? "text-accent" : "text-slate-400"}`}>{tag}</div>
      <h3 className="text-xl font-bold mt-1">{name}</h3>
      <p className="text-3xl font-extrabold mt-3">{price}<span className={`text-sm font-normal ${featured ? "text-white/60" : "text-slate-400"}`}>{price.startsWith("$") ? "/mo" : ""}</span></p>
      <ul className="mt-5 space-y-2 text-sm">
        {items.map((i) => <li key={i} className="flex gap-2"><Check className={`w-4 h-4 shrink-0 ${featured ? "text-accent" : "text-navy-600"}`} />{i}</li>)}
      </ul>
      <Link href="/register" className={`mt-6 block text-center rounded-full py-2.5 text-sm font-semibold ${featured ? "bg-accent text-white" : "bg-navy-800 text-white"}`}>Get started</Link>
    </div>
  );
}
