import type { ApiResponse } from "@ito-map/shared";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export async function fetchAPI<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error(`Error en la API: ${response.status}`);
  }

  const json: ApiResponse<T> = await response.json();

  if (!json.success) {
    throw new Error(json.message || "Error desconocido en la API");
  }

  return json.data;
}