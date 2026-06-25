import axios from "axios";

const isDev = import.meta.env.DEV;

const axiosInstance = axios.create({
  baseURL: isDev
    ? "/api/v1/"
    : "https://pipre-backend.yoshua-cloud.dedyn.io/api/v1/",
  headers: {
    "Content-Type": "application/json",
    "Accept": "*/*",
  },
  // El backend usa cookie auth (jwt), no enviamos Authorization header manualmente
  withCredentials: true,
});

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
