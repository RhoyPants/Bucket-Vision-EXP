"use client";

import axios from "axios";

// Create axios instance
const axiosApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔐 Auto-attach token from Redux before every request
axiosApi.interceptors.request.use(
  (config) => {
    // Lazy import to avoid circular imports
    const { store } = require("../redux/store");

    // const token = store.getState().auth.token;
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
  (error) => Promise.reject(error)
);

// 🔐 Global response interceptor for handling expiration / unauthorized
axiosApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      console.error("❌ API Error: Unauthorized — token expired");

      // clear session
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }

      // Redirect WITHOUT useRouter (hooks not allowed)
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

export default axiosApi;
