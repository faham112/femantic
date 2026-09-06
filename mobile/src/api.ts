import axios from "axios";
import Constants from "expo-constants";

const configuredUrl = Constants.expoConfig?.extra?.apiUrl as string | undefined;
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || configuredUrl || "https://analytics.globalcareerhub.org").replace(/\/$/, "");

export type User = {
  id: number;
  email: string;
  full_name?: string | null;
  role: "admin" | "pro" | "client";
  membership: "free" | "premium" | "expired";
  is_active: boolean;
  brand_name?: string | null;
};

export type Website = {
  id: number;
  name: string;
  domain: string;
  api_key: string;
  is_active: boolean;
  created_at: string;
};

export type Stats = {
  total_pageviews: number;
  unique_sessions: number;
  true_traffic: number;
  bounce_rate: number;
  humans?: number;
  bots?: number;
  suspicious?: number;
  top_pages: { path: string; views: number }[];
  devices: Record<string, number>;
};

export type LiveStats = {
  live_visitors: number;
  pageviews_last_5min: number;
  top_pages_live: { path: string; views: number }[];
};

const api = axios.create({ baseURL: API_URL, timeout: 15000 });

export async function login(email: string, password: string) {
  const form = new URLSearchParams({ username: email, password });
  const response = await api.post<{ access_token: string }>("/api/auth/login", form.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return response.data.access_token;
}

export async function register(email: string, password: string, fullName: string) {
  const response = await api.post<User>("/api/auth/register", {
    email,
    password,
    full_name: fullName || undefined,
  });
  return response.data;
}

export async function getMe(token: string) {
  return (await api.get<User>("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })).data;
}

export async function getWebsites(token: string) {
  return (await api.get<Website[]>("/api/websites/", { headers: { Authorization: `Bearer ${token}` } })).data;
}

export async function createWebsite(token: string, name: string, domain: string) {
  return (await api.post<Website>("/api/websites/", { name, domain }, { headers: { Authorization: `Bearer ${token}` } })).data;
}

export async function getStats(token: string, websiteId: number, days: number) {
  return (await api.get<Stats>(`/api/track/stats/${websiteId}?days=${days}`, { headers: { Authorization: `Bearer ${token}` } })).data;
}

export async function getLiveStats(token: string, websiteId: number) {
  return (await api.get<LiveStats>(`/api/realtime/live/${websiteId}`, { headers: { Authorization: `Bearer ${token}` } })).data;
}
