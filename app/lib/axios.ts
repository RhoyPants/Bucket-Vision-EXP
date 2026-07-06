"use client";

import axios, { AxiosError } from "axios";
import {
  accessDeniedEventName,
  AccessDeniedDetail,
} from "@/app/lib/accessDeniedEvent";

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
      console.error("❌ API Error 401: Unauthorized — token expired");
      console.log("🔵 Current pathname:", typeof window !== "undefined" ? window.location.pathname : "(server)");

      // Skip redirect on SSO callback page - let it finish processing
      const isCallback = typeof window !== "undefined" && window.location.pathname === "/sso/callback";
      
      console.log("🔵 Is callback page?", isCallback);
      
      if (!isCallback && typeof window !== "undefined") {
        console.log("🔴 Redirecting to /");
        localStorage.removeItem("token");
        window.location.href = "/";
      } else {
        console.log("🟢 Skipping redirect because on /sso/callback");
      }

      return Promise.reject(new Error("Unauthorized - Token expired"));
    }

    // Handle other error statuses
    if (response.status >= 400) {
      if (response.status === 403) {
        notifyAccessDenied(response);
      }

      console.error("❌ API Error:", response.status, response.data);
      return Promise.reject(
        response.data?.message || `HTTP Error: ${response.status}`
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

    // Network-level error handling
    if (error.code === "ECONNABORTED") {
      const msg = "❌ Request timeout - Server not responding in time";
      console.error(msg);
      return Promise.reject(new Error(msg));
    }

    if (error.code === "ERR_NETWORK") {
      const msg = "❌ Network error - Check CORS, API base URL, or server connection";
      console.error(msg);
      return Promise.reject(new Error(msg));
    }

    if (error.message === "Network Error") {
      const msg = "❌ Network Error - Server unreachable or CORS issue. Check API base URL in .env.local";
      console.error(msg);
      return Promise.reject(new Error(msg));
    }

    return Promise.reject(error);
  }
);

export default axiosApi;
