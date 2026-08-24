import axios from "axios";

// Environment variable se API URL uthayega, warna fallback URL use karega
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://makki-madni-backend.vercel.app",
  withCredentials: true,
});

// ================= AXIOS HEADER INTERCEPTOR ================= //
API.interceptors.request.use((config) => {
  const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
  const directUsername = localStorage.getItem("username") || sessionStorage.getItem("username");

  let username = directUsername || "";

  if (!username && userStr) {
    try {
      const u = JSON.parse(userStr);
      username = typeof u === "string" ? u : (u.username || u.user_name || u.name || u.email || "");
    } catch (e) {
      username = userStr;
    }
  }

  if (username) {
    config.headers["x-user-name"] = username;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});
// ============================================================ //

export default API;
