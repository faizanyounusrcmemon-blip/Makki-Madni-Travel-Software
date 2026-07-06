import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.PROD 
    ? "https://makki-madni-backend.vercel.app" 
    : "", 
  withCredentials: true,
});

export default API;
