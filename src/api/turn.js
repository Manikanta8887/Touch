import apiClient from "./client";

export const fetchTurnCredentials = async () => {
  const response = await apiClient.get("/api/turn-credentials");
  return response.data;
};
