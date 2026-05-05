"use client";

import axios, { AxiosError } from "axios";

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
  // Add timeout
  timeout: 10000,
  // Don't validate status to handle all responses
  validateStatus: () => true,
  // Allow credentials (cookies, auth headers)
  withCredentials: false,
});

// 🔐 Auto-attach token from Redux before every request
axiosApi.interceptors.request.use(
  (config) => {
    // Lazy import to avoid circular imports
    const { store } = require("../redux/store");

    // Get token from localStorage
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Fix: avoid mutating frozen params
    if (config.params && Object.isFrozen(config.params)) {
      config.params = { ...config.params };
    }

    console.log(`📤 [${config.method?.toUpperCase()}] ${config.baseURL}${config.url}`);

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
      console.log(`✅ [${response.status}] Response received`);
      return response;
    }

    // Handle auth errors
    if (response.status === 401) {
      console.error("❌ API Error: Unauthorized — token expired");

      // clear session
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        window.location.href = "/";
      }

      return Promise.reject(new Error("Unauthorized - Token expired"));
    }

    // Handle other error statuses
    if (response.status >= 400) {
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
      const msg = "❌ Request timeout - Server not responding";
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
