import type { ApiResponse } from "../types/api.types.js";

type ApiClientConfig = {
  baseUrl: string;
};

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function mutatingHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const csrf = getCsrfToken();
  if (csrf) headers["X-CSRF-Token"] = csrf;
  return headers;
}

let config: ApiClientConfig = {
  baseUrl: "/api",
};

export function configureApiClient(nextConfig: ApiClientConfig): void {
  config = {
    ...config,
    ...nextConfig,
  };
}

export async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${config.baseUrl}${endpoint}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
  });

  return parseApiResponse<T>(response);
}

export async function apiPost<TResponse, TBody = unknown>(
  endpoint: string,
  body: TBody
): Promise<TResponse> {
  const response = await fetch(`${config.baseUrl}${endpoint}`, {
    method: "POST",
    headers: mutatingHeaders(),
    credentials: "include",
    body: JSON.stringify(body),
  });

  return parseApiResponse<TResponse>(response);
}

export async function apiPut<TResponse, TBody = unknown>(
  endpoint: string,
  body: TBody
): Promise<TResponse> {
  const response = await fetch(`${config.baseUrl}${endpoint}`, {
    method: "PUT",
    headers: mutatingHeaders(),
    credentials: "include",
    body: JSON.stringify(body),
  });

  return parseApiResponse<TResponse>(response);
}

export async function apiPatch<TResponse, TBody = unknown>(
  endpoint: string,
  body: TBody
): Promise<TResponse> {
  const response = await fetch(`${config.baseUrl}${endpoint}`, {
    method: "PATCH",
    headers: mutatingHeaders(),
    credentials: "include",
    body: JSON.stringify(body),
  });

  return parseApiResponse<TResponse>(response);
}

export async function apiDelete<TResponse>(
  endpoint: string
): Promise<TResponse> {
  const response = await fetch(`${config.baseUrl}${endpoint}`, {
    method: "DELETE",
    headers: mutatingHeaders(),
    credentials: "include",
  });

  return parseApiResponse<TResponse>(response);
}

export async function apiUpload<TResponse>(
  endpoint: string,
  formData: FormData
): Promise<TResponse> {
  const headers: Record<string, string> = {};
  const csrf = getCsrfToken();
  if (csrf) headers["X-CSRF-Token"] = csrf;

  const response = await fetch(`${config.baseUrl}${endpoint}`, {
    method: "POST",
    headers,
    credentials: "include",
    body: formData,
  });

  return parseApiResponse<TResponse>(response);
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  let json: ApiResponse<T>;

  try {
    json = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new Error(`Respuesta inválida de la API: ${response.status}`);
  }

  if (!response.ok) {
    throw new Error(json.message || `Error en la API: ${response.status}`);
  }

  if (!json.success) {
    throw new Error(json.message || "Error desconocido en la API");
  }

  return json.data;
}
