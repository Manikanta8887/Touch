import axios from "axios";
import { Auth } from "../Components/Firebase/Firebaseconfig";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach Firebase ID Token to Bearer Header
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const currentUser = Auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.error("Error retrieving Firebase ID token:", err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
