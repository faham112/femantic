"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register, login } from "@/lib/api";
import { Loader2 } from "lucide-react";
import AuthChrome from "@/components/AuthChrome";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, password, fullName || undefined);
      await login(email, password);
      router.push("/dashboard/sites/new");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthChrome active="register">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="bg-white text-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-navy-800">Start free trial</h1>
            <p className="text-sm text-slate-500 mt-1">No credit card. Activate a site in two steps.</p>
          </div>
          {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500" />
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500" />
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 6)" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500" />
          <button disabled={loading} className="w-full bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg py-2.5 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Create account
          </button>
          <p className="text-center text-sm text-slate-500">Already registered? <Link href="/login" className="text-navy-700 font-semibold">Log in</Link></p>
        </form>
      </div>
    </AuthChrome>
  );
}
