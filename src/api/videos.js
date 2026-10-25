import apiClient from "./client";

export const uploadVideo = async (uid, videoFile, title) => {
  const formData = new FormData();
  formData.append("video", videoFile);
  if (title) formData.append("title", title);

  const response = await apiClient.post(`/api/videos/upload/${uid}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const getUserVideos = async (uid) => {
  const response = await apiClient.get(`/api/videos/${uid}`);
  return response.data;
};

export const getAllVideos = async () => {
  const response = await apiClient.get("/api/videos");
  return response.data;
};

export const deleteVideo = async (publicId) => {
  // BUG-007: public_id can contain slashes (e.g. touch_live_videos/uid/123)
  // Use query param instead of path segment to prevent routing issues
  const response = await apiClient.delete("/api/videos", {
    params: { public_id: publicId },
  });
  return response.data;
};
