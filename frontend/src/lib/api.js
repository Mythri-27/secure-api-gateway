import axios from "axios";

const gatewayUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

const api = axios.create({
  baseURL: gatewayUrl ? `${gatewayUrl}/api` : "/api",
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// Attach the CSRF token on state-changing requests (double-submit cookie)
api.interceptors.request.use((config) => {
  const method = config.method?.toUpperCase();
  if (method && !["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrfToken = getCookie("csrf_token");
    if (csrfToken) config.headers["X-CSRF-Token"] = csrfToken;
  }
  return config;
});

let refreshPromise = null;

function isExcludedFromAuthHandling(url = "") {
  return url.includes("/auth/login") || url.includes("/auth/refresh") || url.includes("/auth/me");
}

// On a 401 with code TOKEN_EXPIRED, attempt one silent refresh and retry.
// Concurrent 401s share a single in-flight refresh instead of each firing one.
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const { config, response } = err;
    const excluded = isExcludedFromAuthHandling(config?.url);

    if (response?.status === 401 && response?.data?.code === "TOKEN_EXPIRED" && !config._retried && !excluded) {
      config._retried = true;
      try {
        refreshPromise = refreshPromise || api.post("/auth/refresh");//silent refresh
        await refreshPromise;
        refreshPromise = null;
        return api(config);
      } catch (refreshErr) {
        refreshPromise = null;
        redirectToLogin();
        return Promise.reject(refreshErr);
      }
    }

    if (response?.status === 401 && !excluded) {
      redirectToLogin();
    }

    return Promise.reject(err);
  }
);

function redirectToLogin() {
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

export default api;