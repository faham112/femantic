"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, getMe } from "@/lib/api";
import { Loader2, Shield } from "lucide-react";
import AuthChrome from "@/components/AuthChrome";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      const me = await getMe();
      router.push(me?.role === "admin" ? "/admin" : "/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthChrome active="login">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="bg-white text-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-navy-800">Welcome back</h1>
            <p className="text-sm text-slate-500 mt-1">Same login for publishers and admins</p>
          </div>
          {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}
          <label className="block text-xs font-medium text-slate-500">Email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500" />
          </label>
          <label className="block text-xs font-medium text-slate-500">Password
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500" />
          </label>
          <button disabled={loading} className="w-full bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg py-2.5 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Sign in
          </button>
          <p className="text-center text-xs text-slate-500 flex items-center justify-center gap-1">
            <Shield className="w-3.5 h-3.5" /> Admin accounts open the control panel automatically
          </p>
          <p className="text-center text-sm text-slate-500">No account? <Link href="/register" className="text-navy-700 font-semibold">Sign up</Link></p>
        </form>
      </div>
    </AuthChrome>
  );
}
