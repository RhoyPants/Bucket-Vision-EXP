import axios from "axios";

const axiosApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token before each request (for future use)
axiosApi.interceptors.request.use(
  (config) => {
    // Lazy import store to avoid circular import
    const { store } = require("../redux/store");
    const token = store.getState().auth.token; // we will use `token` in authSlice

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


export default axiosApi;
