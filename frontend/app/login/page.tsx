"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import { login } from "@/lib/api";
import { BarChart3, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const data = await login(email, password);
      Cookies.set("token", data.access_token, { expires: 1 });
      router.push("/dashboard");
    } catch (err: any) { setError(err.response?.data?.detail || "Login failed"); }
    finally { setLoading(false); }
  };
  return (
    <div className="min-h-screen bg-navy-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 text-white">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center"><BarChart3 className="w-5 h-5" /></div>
          <span className="text-2xl font-bold">Femantic</span>
        </Link>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
          <h1 className="text-xl font-bold text-navy-800 text-center">Log in</h1>
          {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500" />
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500" />
          <button disabled={loading} className="w-full bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg py-2.5 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Sign in
          </button>
          <p className="text-center text-sm text-slate-500">No account? <Link href="/register" className="text-navy-700 font-semibold">Sign up</Link></p>
        </form>
      </div>
    </div>
  );
}
