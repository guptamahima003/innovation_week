import { API_URL } from "./constants";
import type { Product, SessionInfo, PersonaSummary, DashboardStats } from "./types";

async function fetchJSON<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getProducts(category?: string): Promise<Product[]> {
  const query = category ? `?category=${category}` : "";
  return fetchJSON<Product[]>(`/api/products${query}`);
}

export async function getProduct(id: string): Promise<Product> {
  return fetchJSON<Product>(`/api/products/${id}`);
}

export async function createSession(forcePersona?: string): Promise<SessionInfo> {
  const query = forcePersona ? `?force_persona=${forcePersona}` : "";
  return fetchJSON<SessionInfo>(`/api/session${query}`, { method: "POST" });
}

export async function getSession(sessionId: string): Promise<SessionInfo> {
  return fetchJSON<SessionInfo>(`/api/session/${sessionId}`);
}

export async function getPersonas(): Promise<{ personas: PersonaSummary[]; distribution: Record<string, number> }> {
  return fetchJSON(`/api/personas`);
}

export async function getStats(): Promise<DashboardStats> {
  return fetchJSON<DashboardStats>(`/api/stats`);
}
