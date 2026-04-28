const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export async function fetchAPI<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error(`Error en la API: ${response.status}`);
  }

  const json: ApiResponse<T> = await response.json();
  return json.data;
}