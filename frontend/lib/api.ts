import axios from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

export function setToken(token: string) {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  Cookies.set("token", token, { expires: 1, sameSite: "lax", secure });
}

export const login = async (email: string, password: string) => {
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);
  const res = await api.post("/api/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return res.data;
};

export const register = async (email: string, password: string, full_name?: string) => {
  const res = await api.post("/api/auth/register", { email, password, full_name });
  return res.data;
};

export const getMe = async () => {
  const res = await api.get("/api/auth/me");
  return res.data;
};

export const getWebsites = async () => {
  const res = await api.get("/api/websites/");
  return res.data;
};

export const getAdminOverview = async () => {
  const res = await api.get("/api/admin/overview");
  return res.data;
};

export function formatDuration(seconds = 0) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
}

export function vsPrev(current: number, previous: number) {
  if (!previous) return current ? "new" : "—";
  const p = ((current - previous) / previous) * 100;
  const sign = p >= 0 ? "+" : "";
  return `${sign}${p.toFixed(0)}% vs prev`;
}
