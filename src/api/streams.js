import apiClient from "./client";

export const getActiveStreams = async () => {
  const response = await apiClient.get("/api/streams/active");
  return response.data;
};

export const getPastStreams = async (userId) => {
  const response = await apiClient.get(`/api/streams/past/${userId}`);
  return response.data;
};

export const getStreamChat = async (streamId) => {
  const response = await apiClient.get(`/api/streams/chat/${streamId}`);
  return response.data;
};
