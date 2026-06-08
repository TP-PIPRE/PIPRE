import axios from "axios";

const isDev = import.meta.env.DEV;

const axiosInstance = axios.create({
  baseURL: isDev
    ? "/api/v1/"
    : "https://pipre-backend.yoshua-cloud.dedyn.io/",
  headers: {
    "Content-Type": "application/json",
    "Accept": "*/*",
  },
});

// Interceptor para añadir el token de autenticación a cada petición
axiosInstance.interceptors.request.use(
  (config) => {
    const getCookie = (name: string): string | null => {
      const cookies = document.cookie.split(";");
      for (const cookie of cookies) {
        const [cookieName, cookieValue] = cookie.trim().split("=");
        if (cookieName === name) return decodeURIComponent(cookieValue);
      }
      return null;
    };

    const token = getCookie("pipre_token");

    if (token) {
      console.log("API Request - Token found:", token.substring(0, 10) + "...");
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      console.warn("API Request - No token found in cookies!");
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;

export const aiAxiosInstance = axios.create({
  baseURL: isDev
    ? "/api/ia/"
    : "https://pipre-ml-ia.yoshua-cloud.dedyn.io/",
  headers: {
    "Content-Type": "application/json",
    "Accept": "*/*",
  },
});
