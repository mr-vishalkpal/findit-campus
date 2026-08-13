import axios from "axios";

// import.meta.env.VITE_API_URL reads from a .env file locally, or
// from Vercel's environment variable settings once deployed. This
// way the SAME code works on localhost and in production — we never
// hardcode a URL that would break after deployment.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;