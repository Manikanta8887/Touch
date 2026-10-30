import apiClient from "./client";

export const saveUser = async (userData, token) => {
  const config = token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : {};
  const response = await apiClient.post("/api/users", userData, config);
  return response.data;
};

export const getAllUsers = async () => {
  const response = await apiClient.get("/api/users");
  return response.data;
};
