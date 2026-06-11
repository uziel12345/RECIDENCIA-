export function resolveApiAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (!url.startsWith("/uploads")) {
    return url;
  }

  const configuredApiBaseUrl = import.meta.env.VITE_API_URL;
  const apiBaseUrl =
    configuredApiBaseUrl && configuredApiBaseUrl.startsWith("http")
      ? configuredApiBaseUrl
      : "http://localhost:3001";
  const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");

  return `${apiOrigin}${url}`;
}

export function resolveBuildingImageUrl(
  url: string | null | undefined
): string | null {
  return resolveApiAssetUrl(url);
}
