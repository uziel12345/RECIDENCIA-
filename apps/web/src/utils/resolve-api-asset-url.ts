export function resolveApiAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // Already an absolute URL (CDN, external storage, etc.)
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  const normalizedUrl = url.startsWith("/") ? url : `/${url}`;

  // Production cross-origin deployment: API lives on a different domain.
  // Use the explicit VITE_API_URL origin only when it's NOT localhost.
  const apiBaseUrl = import.meta.env.VITE_API_URL;
  if (
    apiBaseUrl &&
    apiBaseUrl.startsWith("http") &&
    !apiBaseUrl.includes("localhost") &&
    !apiBaseUrl.includes("127.0.0.1")
  ) {
    const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, "");
    return `${apiOrigin}${normalizedUrl}`;
  }

  // Dev / ngrok / same-origin: follow the browser's current origin so the
  // URL is always reachable regardless of the tunnel domain.
  // Vite proxies /uploads → localhost:3001 in dev mode.
  return typeof window !== "undefined"
    ? `${window.location.origin}${normalizedUrl}`
    : normalizedUrl;
}
