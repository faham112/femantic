import axios from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

function cookieOpts(days: number) {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  return { expires: days, sameSite: "lax" as const, secure };
}

export function setToken(access: string, refresh?: string) {
  Cookies.set("token", access, cookieOpts(1));
  if (refresh) Cookies.set("refresh_token", refresh, cookieOpts(7));
}

export function clearTokens() {
  Cookies.remove("token");
  Cookies.remove("refresh_token");
}

api.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccess(): Promise<string | null> {
  const rt = Cookies.get("refresh_token");
  if (!rt) return null;
  try {
    const res = await axios.post(`${API_URL}/api/auth/refresh`, { refresh_token: rt });
    const access = res.data?.access_token;
    const nextRt = res.data?.refresh_token;
    if (access) setToken(access, nextRt);
    return access || null;
  } catch {
    clearTokens();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original?._retry) {
      return Promise.reject(error);
    }
    if (String(original?.url || "").includes("/api/auth/")) {
      return Promise.reject(error);
    }
    original._retry = true;
    if (!refreshing) refreshing = refreshAccess().finally(() => { refreshing = null; });
    const access = await refreshing;
    if (!access) return Promise.reject(error);
    original.headers = original.headers || {};
    original.headers.Authorization = `Bearer ${access}`;
    return api(original);
  }
);

export default api;

export const login = async (email: string, password: string) => {
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);
  const res = await api.post("/api/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  if (res.data?.access_token) setToken(res.data.access_token, res.data.refresh_token);
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
