import type { ApiResponse } from "../types/api.types.ts";

type ApiClientConfig = {
  baseUrl: string;
  getToken?: () => string | null;
};

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
  const headers = buildHeaders();

  const response = await fetch(`${config.baseUrl}${endpoint}`, {
    method: "GET",
    headers,
  });

  return parseApiResponse<T>(response);
}

export async function apiPost<TResponse, TBody = unknown>(
  endpoint: string,
  body: TBody
): Promise<TResponse> {
  const headers = buildHeaders();

  const response = await fetch(`${config.baseUrl}${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  return parseApiResponse<TResponse>(response);
}

export async function apiPut<TResponse, TBody = unknown>(
  endpoint: string,
  body: TBody
): Promise<TResponse> {
  const headers = buildHeaders();

  const response = await fetch(`${config.baseUrl}${endpoint}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });

  return parseApiResponse<TResponse>(response);
}

export async function apiPatch<TResponse, TBody = unknown>(
  endpoint: string,
  body: TBody
): Promise<TResponse> {
  const headers = buildHeaders();

  const response = await fetch(`${config.baseUrl}${endpoint}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });

  return parseApiResponse<TResponse>(response);
}

export async function apiDelete<TResponse>(
  endpoint: string
): Promise<TResponse> {
  const headers = buildHeaders();

  const response = await fetch(`${config.baseUrl}${endpoint}`, {
    method: "DELETE",
    headers,
  });

  return parseApiResponse<TResponse>(response);
}

export async function apiUpload<TResponse>(
  endpoint: string,
  formData: FormData
): Promise<TResponse> {
  const headers: HeadersInit = {};

  const token = config.getToken?.();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${config.baseUrl}${endpoint}`, {
    method: "POST",
    headers,
    body: formData,
  });

  return parseApiResponse<TResponse>(response);
}

function buildHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = config.getToken?.();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
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