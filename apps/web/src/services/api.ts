const API_BASE_URL = "http://localhost:3001/api";

export async function fetchAPI<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error("Error en la API");
  }

  const json = await response.json();
  return json.data;
}