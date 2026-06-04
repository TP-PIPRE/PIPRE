import axios from "axios";

const aiAxiosInstance = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
    "Accept": "*/*",
  },
});

export default aiAxiosInstance;
