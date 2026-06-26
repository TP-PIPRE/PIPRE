import axios from "axios";
import { clearAuthState } from "../store/authStore";

const isDev = import.meta.env.DEV;

const useLocalBackend = import.meta.env.VITE_USE_LOCAL_BACKEND === "true";
const localBackendUrl = import.meta.env.VITE_LOCAL_BACKEND_URL ?? "http://localhost:8080";

const baseURL = useLocalBackend
  ? `${localBackendUrl}/api/v1/`
  : isDev
    ? "/api/v1/"
    : "https://pipre-backend.yoshua-cloud.dedyn.io/api/v1/";

const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    "Accept": "*/*",
  },
  // El backend usa cookie auth (jwt), no enviamos Authorization header manualmente
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.error("Authentication error (401/403). Redirecting to login...");
      clearAuthState();
      // Only redirect if we are not already on the login page
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
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
