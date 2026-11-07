import axios from "axios";
import { clearAuthState } from "../store/authStore";

declare module "axios" {
  interface AxiosRequestConfig { skipAuthRedirect?: boolean; csrfRetried?: boolean; }
}

const isDev = import.meta.env.DEV;

const useLocalBackend = import.meta.env.VITE_USE_LOCAL_BACKEND === "true";
const localBackendUrl = import.meta.env.VITE_LOCAL_BACKEND_URL ?? "http://localhost:8080";

const baseURL = useLocalBackend
  ? `${localBackendUrl.replace(/\/+$/, "")}/api/v1/`
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
  // The API returns a masked token in JSON; automatic copying of a raw cookie would overwrite it.
  withXSRFToken: false,
});

let csrfRequest:Promise<{token:string;headerName:string}>|null=null;
axiosInstance.interceptors.request.use(async config=>{
  if(!["get","head","options"].includes((config.method??"get").toLowerCase())) {
    // Fetch a masked token for each write batch. The HttpOnly cookie stays on the API origin.
    csrfRequest??=axiosInstance.get<{token:string;headerName:string}>("auth/csrf",{skipAuthRedirect:true})
      .then(response=>response.data).finally(()=>{csrfRequest=null;});
    const csrf=await csrfRequest;
    if(!csrf.token||csrf.headerName!=="X-XSRF-TOKEN")throw new Error("No se pudo preparar una solicitud segura.");
    config.headers.set(csrf.headerName,csrf.token);
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const config=error.config;
    if(error.response?.status===403&&error.response.data?.code==="CSRF_INVALID"&&config&&!config.csrfRetried
        &&!["get","head","options"].includes((config.method??"get").toLowerCase())) {
      // Only this filter rejection guarantees that the mutation has not run. Never retry permission failures.
      config.csrfRetried=true;
      return axiosInstance.request(config);
    }
    if (error.response && error.response.status === 401 && !error.config?.skipAuthRedirect) {
      console.error("La sesión ha caducado.");
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
