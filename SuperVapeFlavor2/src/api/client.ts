import { Platform } from "react-native";
import type { FlavorCreate, FlavorOut, FlavorUpdate, ProductCreate, ProductOut, ProductUpdate } from "./types";

function stripTrailingSlashes(url: string) {
  return url.replace(/\/+$/, "");
}

const DEFAULT_BASE_URL = Platform.select({
  // Android emulators can't reach your host machine via localhost.
  android: "http://10.0.2.2:8000",
  default: "http://localhost:8000"
}) as string;

export const API_BASE_URL = stripTrailingSlashes(process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_BASE_URL);
const API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? "";

async function request<T>(path: string, init: RequestInit = {}, timeoutMs = 10000): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {})
    };
    if (API_KEY.trim()) headers["x-api-key"] = API_KEY.trim();

    const res = await fetch(url, {
      ...init,
      headers: { ...headers, ...(init.headers as Record<string, string> | undefined) },
      signal: controller.signal
    });

    // Some endpoints return 204/no json.
    if (res.status === 204) return undefined as unknown as T;

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      const message = (data && (data.detail || data.message)) ? String(data.detail || data.message) : `${res.status} ${res.statusText}`;
      throw new Error(message);
    }

    return data as T;
  } finally {
    clearTimeout(t);
  }
}

export const api = {
  getProducts: () => request<ProductOut[]>("/products", { method: "GET" }),

  createProduct: (payload: ProductCreate) =>
    request<ProductOut>("/products", { method: "POST", body: JSON.stringify(payload) }),

  updateProduct: (productId: string, payload: ProductUpdate) =>
    request<ProductOut>(`/products/${productId}`, { method: "PATCH", body: JSON.stringify(payload) }),

  deleteProduct: (productId: string) => request<{ deleted: true }>(`/products/${productId}`, { method: "DELETE" }),

  addFlavor: (productId: string, payload: FlavorCreate) =>
    request<FlavorOut>(`/products/${productId}/flavors`, { method: "POST", body: JSON.stringify(payload) }),

  updateFlavor: (flavorId: string, payload: FlavorUpdate) =>
    request<FlavorOut>(`/flavors/${flavorId}`, { method: "PATCH", body: JSON.stringify(payload) }),

  deleteFlavor: (flavorId: string) => request<{ deleted: true } | undefined>(`/flavors/${flavorId}`, { method: "DELETE" })
};
