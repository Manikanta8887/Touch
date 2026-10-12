import { fetchTurnCredentials } from "../api/turn";

/**
 * Dynamically fetches WebRTC ICE server configurations (including short-lived TURN credentials)
 * from the backend, with fallback STUN servers if the request fails or auth is pending.
 */
export const getIceServers = async () => {
  try {
    const res = await fetchTurnCredentials();
    if (res && res.iceServers && res.iceServers.length > 0) {
      return { iceServers: res.iceServers };
    }
  } catch (err) {
    console.warn("Using fallback STUN servers configuration:", err.message);
  }

  return {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:global.xirsys.net:3478" },
    ],
  };
};
