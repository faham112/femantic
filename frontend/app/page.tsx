"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";
import { BarChart3, Shield, Zap, Smartphone } from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">Femantic</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Track Real-time.{" "}
            <span className="text-primary-600">Track True.</span>
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
            A new journey – track your traffic from here.  
            Multi-user analytics platform with admin control, premium membership & fully responsive design.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition shadow-lg shadow-primary-500/25"
            >
              Start Free
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-slate-700 font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition"
            >
              Login to Dashboard
            </Link>
          </div>
        </section>

        <section className="bg-white border-y border-slate-100 py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <Feature
                icon={<Zap className="w-6 h-6 text-primary-600" />}
                title="Real-time Traffic"
                desc="Live pageviews, sessions & true human traffic filtered from bots."
              />
              <Feature
                icon={<Shield className="w-6 h-6 text-primary-600" />}
                title="Admin Power"
                desc="Only admin manages users, API keys & premium memberships."
              />
              <Feature
                icon={<BarChart3 className="w-6 h-6 text-primary-600" />}
                title="Multi-user"
                desc="Each user tracks their own websites. Premium unlocks unlimited sites."
              />
              <Feature
                icon={<Smartphone className="w-6 h-6 text-primary-600" />}
                title="Fully Responsive"
                desc="Perfect on mobile, tablet & desktop. Built mobile-first."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Femantic – Real-time True Traffic Analytics
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="text-center sm:text-left">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-50 mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{desc}</p>
    </div>
  );
}
