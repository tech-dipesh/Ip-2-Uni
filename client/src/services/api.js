import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
});


api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (
      err.response?.status === 401 &&
      !original._retry &&
      original.url !== "/auth/refresh"
    ) {
      original._retry = true;
      try {
        await axios.post(`${BASE}/auth/refresh`, {}, { withCredentials: true });
        return api(original);
      } catch {
        return Promise.reject(err);
      }
    }
    return Promise.reject(err);
  }
);

export default api;
