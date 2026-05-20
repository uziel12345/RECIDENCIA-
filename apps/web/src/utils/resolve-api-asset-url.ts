export function resolveApiAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  const apiBaseUrl = import.meta.env.VITE_API_URL || "/api";
  const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, "");
  const prefix = apiOrigin === "" ? "" : apiOrigin;

  return `${prefix}${url.startsWith("/") ? "" : "/"}${url}`;
}
