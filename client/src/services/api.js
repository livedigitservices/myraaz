import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://my-raaz-ecommerce.vercel.app/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("userInfo") || "null");

  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }

  return config;
});
console.log("API Base URL:", import.meta.env.VITE_API_URL);
export default api;