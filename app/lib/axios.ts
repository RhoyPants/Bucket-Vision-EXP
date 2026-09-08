"use client";

import axios, { AxiosError } from "axios";
import {
  accessDeniedEventName,
  AccessDeniedDetail,
} from "@/app/lib/accessDeniedEvent";
import { publishApiError } from "@/app/lib/apiErrorEvent";

// Verify API base URL is configured
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
if (!apiBaseUrl) {
  console.warn("⚠️  NEXT_PUBLIC_API_BASE_URL not configured! Check your .env.local file");
}

// Create axios instance
const axiosApi = axios.create({
  baseURL: apiBaseUrl || "http://localhost:4000",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  // Keep a safer global timeout for heavier endpoints
  timeout: 30000,
  // Don't validate status to handle all responses
  validateStatus: () => true,
  // Allow credentials (cookies, auth headers)
  withCredentials: false,
});

const mutatingMethods = new Set(["post", "put", "patch", "delete"]);

const methodActionMap: Record<string, string> = {
  post: "create",
  put: "update",
  patch: "update",
  delete: "delete",
};

const resourceLabelMap: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /^\/roles(?:\/|$)/, label: "Role" },
  { pattern: /^\/projects\/my-drafts(?:\/|$)/, label: "Project Draft" },
  { pattern: /^\/projects(?:\/|$)/, label: "Project" },
  { pattern: /^\/subtasks(?:\/|$)/, label: "Subtask" },
  { pattern: /^\/tasks(?:\/|$)/, label: "Task" },
  { pattern: /^\/scopes?(?:\/|$)/, label: "Scope" },
  { pattern: /^\/sprints?(?:\/|$)/, label: "Sprint" },
  { pattern: /^\/versioning(?:\/|$)/, label: "Version" },
  { pattern: /^\/users(?:\/|$)/, label: "User" },
  { pattern: /^\/business-units(?:\/|$)/, label: "Business Unit" },
  { pattern: /^\/approval-flows(?:\/|$)/, label: "Approval Flow" },
  { pattern: /^\/daily-reports(?:\/|$)/, label: "Daily Report" },
  { pattern: /^\/weekly-reports(?:\/|$)/, label: "Weekly Report" },
  { pattern: /^\/reports(?:\/|$)/, label: "Report" },
  { pattern: /^\/personal-dashboards(?:\/|$)/, label: "Personal Dashboard" },
  { pattern: /^\/notes(?:\/|$)/, label: "Note" },
  { pattern: /^\/kpis?(?:\/|$)/, label: "KPI" },
];

const normalizeRequestPath = (url?: string) => {
  if (!url) return "/";

  try {
    return new URL(url, "http://local").pathname;
  } catch {
    return url.split("?")[0] || "/";
  }
};

const labelFromPath = (path: string) => {
  const mapped = resourceLabelMap.find((item) => item.pattern.test(path));
  if (mapped) return mapped.label;

  const segment =
    path
      .split("/")
      .filter(Boolean)
      .find((part) => !part.includes(":") && !/^[0-9a-f-]{12,}$/i.test(part)) ||
    "resource";

  return segment
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const notifyAccessDenied = (response: { config?: { method?: string; url?: string } }) => {
  if (typeof window === "undefined") return;

  const method = response.config?.method?.toLowerCase() || "";
  if (!mutatingMethods.has(method)) return;

  const detail: AccessDeniedDetail = {
    action: methodActionMap[method] || "manage",
    resource: labelFromPath(normalizeRequestPath(response.config?.url)),
  };

  window.dispatchEvent(new CustomEvent(accessDeniedEventName, { detail }));
};

const responseMessage = (data: any, fallback: string) => {
  if (typeof data?.message === "string" && data.message.trim()) return data.message;
  if (typeof data?.error === "string" && data.error.trim()) return data.error;
  if (typeof data?.error?.message === "string" && data.error.message.trim()) return data.error.message;
  return fallback;
};

const notifyApiError = (detail: {
  status?: number;
  data?: any;
  method?: string;
  url?: string;
  title?: string;
  redirectTo?: string;
  fallback: string;
}) => {
  publishApiError({
    title: detail.title || "Request failed",
    message: responseMessage(detail.data, detail.fallback),
    status: detail.status,
    method: detail.method?.toUpperCase(),
    path: normalizeRequestPath(detail.url),
    redirectTo: detail.redirectTo,
  });
};

// 🔐 Auto-attach token from Redux before every request
axiosApi.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Fix: avoid mutating frozen params
    if (config.params && Object.isFrozen(config.params)) {
      config.params = { ...config.params };
    }


    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// 🔐 Global response interceptor for handling responses
axiosApi.interceptors.response.use(
  (response) => {
    // Log successful responses
    if (response.status >= 200 && response.status < 300) {
      return response;
    }

    // Handle auth errors
    if (response.status === 401) {
      const skipAuthRedirect = Boolean(
        (response.config as typeof response.config & { skipAuthRedirect?: boolean })
          .skipAuthRedirect,
      );
      if (skipAuthRedirect) {
        const message =
          response.data?.error ||
          response.data?.message ||
          "Unauthorized request. The API route may be missing authentication middleware.";
        notifyApiError({ status: 401, data: response.data, method: response.config.method, url: response.config.url, title: "Unauthorized", fallback: String(message) });
        return Promise.reject(new Error(message));
      }
      console.error("❌ API Error 401: Unauthorized — token expired");
      console.log("🔵 Current pathname:", typeof window !== "undefined" ? window.location.pathname : "(server)");

      // Registration users do not have a Bucket Vision access token yet.
      // Keep lookup failures inside the SSO flow instead of redirecting it.
      const isSsoFlow =
        typeof window !== "undefined" &&
        window.location.pathname.startsWith("/sso/");
      
      console.log("🔵 Is SSO flow?", isSsoFlow);
      
      if (!isSsoFlow && typeof window !== "undefined") {
        console.log("🔴 Redirecting to /");
        localStorage.removeItem("token");
        notifyApiError({ status: 401, data: response.data, method: response.config.method, url: response.config.url, title: "Session expired", fallback: "Your session has expired. Please sign in again.", redirectTo: "/" });
      } else {
        notifyApiError({ status: 401, data: response.data, method: response.config.method, url: response.config.url, title: "Unable to continue", fallback: "This request requires authorization." });
        console.log("🟢 Skipping redirect because an SSO flow is active");
      }

      return Promise.reject(new Error("Unauthorized - Token expired"));
    }

    // Handle other error statuses
    if (response.status >= 400) {
      if (response.status === 403 && mutatingMethods.has(response.config.method?.toLowerCase() || "")) {
        notifyAccessDenied(response);
      } else {
        notifyApiError({
          status: response.status,
          data: response.data,
          method: response.config.method,
          url: response.config.url,
          fallback: `The server returned HTTP ${response.status}.`,
        });
      }

      console.error("❌ API Error:", response.status, response.data);
      return Promise.reject(
        response.data?.error?.message ||
          response.data?.message ||
          `HTTP Error: ${response.status}`
      );
    }

    return response;
  },
  (error: AxiosError) => {
    console.error("❌ Axios Error:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
    });

    if (error.code === "ERR_CANCELED") return Promise.reject(error);

    // Network-level error handling
    if (error.code === "ECONNABORTED") {
      const msg = "❌ Request timeout - Server not responding in time";
      console.error(msg);
      notifyApiError({ method: error.config?.method, url: error.config?.url, title: "Request timed out", fallback: "The server did not respond in time. Please try again." });
      return Promise.reject(new Error(msg));
    }

    if (error.code === "ERR_NETWORK") {
      const msg = "❌ Network error - Check CORS, API base URL, or server connection";
      console.error(msg);
      notifyApiError({ method: error.config?.method, url: error.config?.url, title: "Connection problem", fallback: "The server could not be reached. Check your connection and try again." });
      return Promise.reject(new Error(msg));
    }

    if (error.message === "Network Error") {
      const msg = "❌ Network Error - Server unreachable or CORS issue. Check API base URL in .env.local";
      console.error(msg);
      notifyApiError({ method: error.config?.method, url: error.config?.url, title: "Connection problem", fallback: "The server could not be reached. Check your connection and try again." });
      return Promise.reject(new Error(msg));
    }

    return Promise.reject(error);
  }
);

export default axiosApi;
