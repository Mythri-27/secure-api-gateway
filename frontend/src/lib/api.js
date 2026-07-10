import axios from "axios";

// Prefer direct gateway URL when configured — avoids relying on Next.js rewrites,
// which only apply after restarting the dev server when .env.local changes.
const gatewayUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

const api = axios.create({
  baseURL: gatewayUrl ? `${gatewayUrl}/api` : "/api",
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — clear session and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginRequest = err.config?.url?.includes("/auth/login");
    if (
      err.response?.status === 401 &&
      typeof window !== "undefined" &&
      !isLoginRequest
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
