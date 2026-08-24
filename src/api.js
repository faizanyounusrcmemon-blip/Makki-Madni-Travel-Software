import axios from "axios";

// Environment variable se API URL uthayega, warna fallback URL use karega
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://makki-madni-backend.vercel.app",
  withCredentials: true,
});

export default API;
