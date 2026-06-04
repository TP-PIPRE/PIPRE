import axios from "axios";

const aiAxiosInstance = axios.create({
  baseURL: "https://pipre-ml-ia.yoshua-cloud.dedyn.io",
  headers: {
    "Content-Type": "application/json",
    "Accept": "*/*",
  },
});

export default aiAxiosInstance;
