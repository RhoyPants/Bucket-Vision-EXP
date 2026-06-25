const DEFAULT_API_BASE_URL = "http://localhost:4000";

export const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;

const normalizeDuplicateApiSegments = (pathname: string) =>
  pathname.replace(/\/api\/api(?=\/|$)/g, "/api");

export const normalizeApiUrl = (url: string) => {
  try {
    const parsed = new URL(
      url,
      typeof window !== "undefined" ? window.location.origin : getApiBaseUrl(),
    );
    parsed.pathname = normalizeDuplicateApiSegments(parsed.pathname);
    return parsed.toString();
  } catch {
    return url.replace(/\/api\/api(?=\/|$)/g, "/api");
  }
};

export const joinApiUrl = (path: string, base = getApiBaseUrl()) => {
  try {
    const baseUrl = new URL(base);
    const basePath = normalizeDuplicateApiSegments(
      baseUrl.pathname.replace(/\/+$/, ""),
    );
    let relPath = path.startsWith("/") ? path : `/${path}`;

    if (basePath.endsWith("/api") && relPath.startsWith("/api/")) {
      relPath = relPath.replace(/^\/api/, "");
    }

    return normalizeApiUrl(`${baseUrl.origin}${basePath}${relPath}`);
  } catch {
    const basePath = base.replace(/\/+$/, "");
    const relPath = path.startsWith("/") ? path : `/${path}`;
    return normalizeApiUrl(`${basePath}${relPath}`);
  }
};

