import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import {
  Card,
  message,
  Input,
  Button,
  List,
  Space,
  Tag,
  Avatar,
  Spin,
  Alert,
  Row,
  Col,
} from "antd";
import {
  SendOutlined,
  CopyOutlined,
  LogoutOutlined,
  EyeOutlined,
  FullscreenOutlined,
  CompressOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import socket from "../../socket";
import { getIceServers } from "../../utils/iceServers";



const WatchStream = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector((s) => s.user.firebaseUser);

  const videoRef = useRef(null);
  const videoContainerRef = useRef(null);
  const chatEndRef = useRef(null);
  const peerConnectionRef = useRef(null);
  // BUG-011/BUG-006: Use a ref for streamerSocketId so socket handlers always have current value
  const streamerSocketIdRef = useRef(null);

  const [streamInfo, setStreamInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("connecting"); // connecting, live, ended
  const [error, setError] = useState("");
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);

  const setupPeerConnection = useCallback(async (streamerSocketId) => {
    // BUG-006: Guard against re-creating peer connection if already established
    if (peerConnectionRef.current) return;
    streamerSocketIdRef.current = streamerSocketId;

    try {
      const iceConfig = await getIceServers();
      const pc = new RTCPeerConnection(iceConfig);
      peerConnectionRef.current = pc;

      pc.onicecandidate = (e) => {
        if (e.candidate && streamerSocketIdRef.current) {
          socket.emit("ice-candidate", {
            streamId: id,
            candidate: e.candidate,
            target: streamerSocketIdRef.current,
          });
        }
      };

      pc.ontrack = (event) => {
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          setConnectionStatus("live");
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setConnectionStatus("live");
        } else if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          setConnectionStatus("connecting");
        }
      };
    } catch (err) {
      console.error("PeerConnection initialization error:", err);
    }
  }, [id]);

  const cleanupStream = () => {
    if (videoRef.current) videoRef.current.srcObject = null;
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  const leaveStream = () => {
    socket.emit("leave-stream", { streamId: id });
    cleanupStream();
    message.info("Left the stream room");
    navigate("/livestreamingplatform");
  };

  useEffect(() => {
    socket.emit("join-stream", { streamId: id });

    const handleStreamInfo = (data) => {
      if (!data) {
        setConnectionStatus("ended");
        setError("Stream not found or has ended.");
        return;
      }
      setStreamInfo(data);
      if (data.viewers !== undefined) setViewerCount(data.viewers);

      // MISS-003: Replay chat history when viewer joins mid-stream
      if (data.chatMessages && Array.isArray(data.chatMessages) && data.chatMessages.length > 0) {
        const historyMessages = data.chatMessages.map((m) => ({
          username: m.sender,
          message: m.message,
          time: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
          isHistory: true,
        }));
        setMessages(historyMessages);
      }

      setupPeerConnection(data.streamerSocketId);
    };

    const handleViewerCount = ({ count }) => {
      if (count !== undefined) setViewerCount(count);
    };

    const handleStopStream = () => {
      setConnectionStatus("ended");
      setError("The streamer has ended this broadcast.");
      cleanupStream();
    };

    const handleStreamEnded = () => {
      setConnectionStatus("ended");
      setError("The broadcast has ended.");
      cleanupStream();
    };

    // BUG-006: Register offer and ice-candidate listeners here at top-level useEffect
    // NOT inside setupPeerConnection, to avoid duplicate listener registration
    const handleOffer = async ({ offer, from }) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;
      streamerSocketIdRef.current = from;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        if (pc.signalingState === "have-remote-offer") {
          await pc.setLocalDescription(answer);
          socket.emit("answer", { streamId: id, answer, target: from });
        }
      } catch (err) {
        console.error("[WebRTC Watcher] error handling offer:", err);
      }
    };

    const handleIceCandidate = async ({ candidate }) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;
      try {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (e) {
        console.error("[WebRTC Watcher] addIceCandidate failed:", e);
      }
    };

    socket.on("stream-info", handleStreamInfo);
    socket.on("viewer-count", handleViewerCount);
    socket.on("stop-stream", handleStopStream);
    socket.on("stream-ended", handleStreamEnded);
    // BUG-006: Listeners registered at top-level with specific handler refs for proper cleanup
    socket.on("offer", handleOffer);
    socket.on("ice-candidate", handleIceCandidate);

    return () => {
      socket.emit("leave-stream", { streamId: id });
      socket.off("stream-info", handleStreamInfo);
      socket.off("viewer-count", handleViewerCount);
      socket.off("stop-stream", handleStopStream);
      socket.off("stream-ended", handleStreamEnded);
      socket.off("offer", handleOffer);
      socket.off("ice-candidate", handleIceCandidate);
      cleanupStream();
    };
  }, [id, setupPeerConnection]);

  useEffect(() => {
    const handleChatMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };
    socket.on("chat-message", handleChatMessage);
    return () => socket.off("chat-message", handleChatMessage);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!messageInput.trim()) return;
    const username = currentUser ? currentUser.displayName || currentUser.email : "Guest Viewer";
    const msgData = {
      streamId: id,
      username,
      message: messageInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    socket.emit("chat-message", msgData);
    setMessageInput("");
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/livestreamingplatform/watch/${id}`;
    navigator.clipboard.writeText(link).then(() => message.success("Stream link copied to clipboard!"));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Stream Info Bar */}
      <div className="bg-card p-4 sm:p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-navy mb-1">
            {streamInfo ? streamInfo.streamTitle : "Connecting to stream..."}
          </h2>
          <div className="flex items-center gap-2">
            {connectionStatus === "live" && (
              <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider animate-pulse">
                LIVE
              </span>
            )}
            {connectionStatus === "connecting" && <Tag color="warning">Connecting...</Tag>}
            {connectionStatus === "ended" && <Tag color="error">Stream Ended</Tag>}

            <Tag icon={<EyeOutlined />} color="purple" className="border-primary text-primary bg-primary/10">
              {viewerCount} Watching
            </Tag>
          </div>
        </div>

        <Space size="middle">
          <Button size="small" icon={<CopyOutlined />} onClick={handleCopyLink} className="border-border text-navy font-semibold rounded-lg hover:border-primary hover:text-primary">
            Share
          </Button>
          <Button
            size="small"
            icon={isTheaterMode ? <CompressOutlined /> : <FullscreenOutlined />}
            onClick={() => setIsTheaterMode(!isTheaterMode)}
            className="border-border text-navy font-semibold rounded-lg hover:border-primary hover:text-primary"
          >
            {isTheaterMode ? "Normal View" : "Theater Mode"}
          </Button>
          <Button danger icon={<LogoutOutlined />} onClick={leaveStream} className="bg-red-600 hover:bg-red-700 text-white border-none font-semibold rounded-lg">
            Leave
          </Button>
        </Space>
      </div>

      <Row gutter={[20, 20]}>
        {/* Video Player Section */}
        <Col xs={24} lg={isTheaterMode ? 24 : 16}>
          <Card className="bg-card border border-border rounded-2xl overflow-hidden p-0 shadow-sm" variant="borderless">
            <div className="relative w-full h-[380px] sm:h-[480px] bg-black flex items-center justify-center rounded-xl overflow-hidden" ref={videoContainerRef}>
              <video ref={videoRef} autoPlay playsInline controls className="w-full h-full object-cover" />
              {connectionStatus === "connecting" && (
                <div className="absolute inset-0 bg-navy/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white">
                  <Spin size="large" />
                  <p className="mt-4 text-sm font-medium text-text">Establishing WebRTC connection with streamer...</p>
                </div>
              )}
              {connectionStatus === "ended" && (
                <div className="absolute inset-0 bg-navy/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white">
                  <Alert
                    message="Stream Ended"
                    description={error || "The streamer has ended the session."}
                    type="error"
                    showIcon
                    className="max-w-md"
                  />
                  <Button type="primary" className="mt-4 bg-primary hover:bg-secondary border-none font-bold rounded-lg" onClick={() => navigate("/livestreamingplatform")}>
                    Back to Browse
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </Col>

        {/* Live Chat Sidebar */}
        <Col xs={24} lg={isTheaterMode ? 24 : 8}>
          <Card className="bg-card border border-border rounded-2xl shadow-sm flex flex-col h-[480px]" variant="borderless">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <span className="font-bold text-navy text-base">Live Chat</span>
              <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">{viewerCount} online</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
              <List
                dataSource={messages}
                renderItem={(msg, idx) => {
                  const isStreamerMsg = streamInfo && msg.username === streamInfo.streamerName;
                  return (
                    <div key={idx} className={`p-2.5 rounded-xl border text-xs ${isStreamerMsg ? "bg-primary/10 border-primary/30" : "bg-background border-border"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <Avatar size="small" className={isStreamerMsg ? "bg-secondary" : "bg-primary"}>
                            {msg.username ? msg.username.charAt(0).toUpperCase() : "V"}
                          </Avatar>
                          <span className="font-bold text-navy">{msg.username}</span>
                          {isStreamerMsg && (
                            <Tag color="magenta" icon={<CrownOutlined />} className="text-[10px] m-0 px-1 py-0 border-none">
                              Host
                            </Tag>
                          )}
                        </div>
                        <span className="text-[10px] text-text">{msg.time}</span>
                      </div>
                      <div className="text-text font-normal">{msg.message}</div>
                    </div>
                  );
                }}
              />
              <div ref={chatEndRef} />
            </div>

            <div className="pt-2 border-t border-border">
              <Space.Compact style={{ width: "100%" }}>
                <Input
                  placeholder="Send a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onPressEnter={sendMessage}
                  autoComplete="off"
                  disabled={connectionStatus === "ended"}
                  className="rounded-l-lg border-border"
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={sendMessage}
                  disabled={connectionStatus === "ended"}
                  className="bg-primary hover:bg-secondary border-none rounded-r-lg"
                />
              </Space.Compact>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

WatchStream.propTypes = {
  streamId: PropTypes.string,
};

export default WatchStream;
