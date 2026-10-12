import apiClient from "./client";

export const saveUser = async (userData) => {
  const response = await apiClient.post("/api/users", userData);
  return response.data;
};

export const getAllUsers = async () => {
  const response = await apiClient.get("/api/users");
  return response.data;
};
