import { useEffect, useRef, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { useSelector, useDispatch } from "react-redux";
import { setIsStreaming, setStreamTitle } from "../Redux/streamSlice.js";
import {
  Button,
  Card,
  Space,
  message,
  Input,
  Row,
  Col,
  List,
  Modal,
  Select,
  Tag,
  Avatar,
  Tooltip,
} from "antd";
import {
  VideoCameraOutlined,
  StopOutlined,
  SendOutlined,
  AudioOutlined,
  AudioMutedOutlined,
  DesktopOutlined,
  EyeOutlined,
  SettingOutlined,
  CrownOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import socket from "../../socket";
import { getIceServers } from "../../utils/iceServers";

const { Option } = Select;

const StartStreaming = () => {
  const dispatch = useDispatch();
  const firebaseUser = useSelector((s) => s.user.firebaseUser);
  const isStreaming = useSelector((s) => s.stream.isStreaming);
  const streamTitle = useSelector((s) => s.stream.streamTitle);

  const videoRef = useRef(null);
  const chatEndRef = useRef(null);
  const peerConnections = useRef(new Map());

  const [localStream, setLocalStream] = useState(null);
  const [origVideoTrack, setOrigVideoTrack] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [inputTitle, setInputTitle] = useState(streamTitle || "");
  const [streamDuration, setStreamDuration] = useState(0);

  // Pre-stream Device Selection state
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [videoDevices, setVideoDevices] = useState([]);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState("");
  const [selectedAudioDevice, setSelectedAudioDevice] = useState("");
  const [deviceCheckStream, setDeviceCheckStream] = useState(null);
  const previewVideoRef = useRef(null);

  // Timer effect for live stream duration
  useEffect(() => {
    let timer;
    if (isStreaming) {
      timer = setInterval(() => setStreamDuration((prev) => prev + 1), 1000);
    } else {
      setStreamDuration(0);
    }
    return () => clearInterval(timer);
  }, [isStreaming]);

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? `${hrs}:` : ""}${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Enumerate Media Devices for Pre-stream Check
  const getDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const vDevs = devices.filter((d) => d.kind === "videoinput");
      const aDevs = devices.filter((d) => d.kind === "audioinput");
      setVideoDevices(vDevs);
      setAudioDevices(aDevs);
      if (vDevs.length > 0 && !selectedVideoDevice) setSelectedVideoDevice(vDevs[0].deviceId);
      if (aDevs.length > 0 && !selectedAudioDevice) setSelectedAudioDevice(aDevs[0].deviceId);
    } catch (err) {
      console.warn("Error enumerating devices:", err);
    }
  };

  const openDeviceCheck = async () => {
    setIsDeviceModalOpen(true);
    try {
      const initStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setDeviceCheckStream(initStream);
      if (previewVideoRef.current) previewVideoRef.current.srcObject = initStream;
      await getDevices();
    } catch (err) {
      console.warn("Permission error on getUserMedia:", err);
      message.error("Camera and microphone permissions are required for streaming.");
    }
  };

  const closeDeviceCheck = () => {
    if (deviceCheckStream) {
      deviceCheckStream.getTracks().forEach((t) => t.stop());
      setDeviceCheckStream(null);
    }
    setIsDeviceModalOpen(false);
  };

  const handleDeviceChange = async (videoDevId, audioDevId) => {
    if (deviceCheckStream) {
      deviceCheckStream.getTracks().forEach((t) => t.stop());
    }
    try {
      const constraints = {
        video: videoDevId ? { deviceId: { exact: videoDevId } } : true,
        audio: audioDevId ? { deviceId: { exact: audioDevId } } : true,
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setDeviceCheckStream(newStream);
      if (previewVideoRef.current) previewVideoRef.current.srcObject = newStream;
    } catch (err) {
      console.warn("Error switching media device:", err);
      message.error("Failed to switch media device.");
    }
  };

  // WebRTC Peer Connection Helper
  const createPeerConnection = useCallback(
    async (viewerSocketId, activeStream) => {
      if (peerConnections.current.has(viewerSocketId)) {
        return peerConnections.current.get(viewerSocketId);
      }

      const iceConfig = await getIceServers();
      const pc = new RTCPeerConnection(iceConfig);
      peerConnections.current.set(viewerSocketId, pc);

      if (activeStream) {
        activeStream.getTracks().forEach((track) => pc.addTrack(track, activeStream));
      }

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice-candidate", {
            streamId: firebaseUser?.uid,
            candidate: e.candidate,
            target: viewerSocketId,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          pc.close();
          peerConnections.current.delete(viewerSocketId);
        }
      };

      return pc;
    },
    [firebaseUser?.uid]
  );

  // Start Streaming Execution
  const handleStartStream = async () => {
    if (!inputTitle.trim()) {
      return message.warning("Please enter a stream title before going live!");
    }

    try {
      closeDeviceCheck();
      const constraints = {
        video: selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : true,
        audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(mediaStream);
      setOrigVideoTrack(mediaStream.getVideoTracks()[0]);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      dispatch(setIsStreaming(true));
      dispatch(setStreamTitle(inputTitle));

      const streamerId = firebaseUser?.uid || socket.id;
      const streamerName = firebaseUser?.displayName || firebaseUser?.email || "Anonymous Streamer";
      const profilePic = firebaseUser?.photoURL || "";

      socket.emit("start-stream", {
        streamTitle: inputTitle,
        streamerId,
        streamerName,
        profilePic,
      });

      message.success("🔴 You are now live!");
    } catch (err) {
      console.error("Media error starting stream:", err);
      message.error("Failed to access media devices. Please grant camera/microphone permissions.");
    }
  };

  // Stop Stream Execution
  const handleStopStream = () => {
    socket.emit("stop-stream");

    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
    }

    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();

    dispatch(setIsStreaming(false));
    dispatch(setStreamTitle(""));
    setIsScreenSharing(false);
    setIsCameraOn(true);
    setIsMuted(false);

    message.info("Stream ended successfully");
  };

  // WebRTC Signaling Handlers
  useEffect(() => {
    const handleViewerJoined = async ({ viewerId }) => {
      if (!localStream) return;
      try {
        const pc = await createPeerConnection(viewerId, localStream);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", { streamId: firebaseUser?.uid, offer, target: viewerId });
      } catch (err) {
        console.error("Error connecting viewer:", err);
      }
    };

    const handleAnswer = async ({ answer, from }) => {
      const pc = peerConnections.current.get(from);
      if (pc && pc.signalingState === "have-local-offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const handleIceCandidate = async ({ candidate, from }) => {
      const pc = peerConnections.current.get(from);
      if (pc && pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    const handleViewerCount = ({ count }) => {
      if (count !== undefined) setViewerCount(count);
    };

    socket.on("viewer-joined", handleViewerJoined);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("viewer-count", handleViewerCount);

    return () => {
      socket.off("viewer-joined", handleViewerJoined);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("viewer-count", handleViewerCount);
    };
  }, [localStream, createPeerConnection, firebaseUser?.uid]);

  // Chat message listener
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
    const username = firebaseUser ? firebaseUser.displayName || firebaseUser.email : "Streamer";
    socket.emit("chat-message", {
      streamId: firebaseUser?.uid,
      username,
      message: messageInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
    setMessageInput("");
  };

  // Audio/Camera/Screen Controls
  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!isStreaming || !localStream) return;
    if (isScreenSharing) {
      if (origVideoTrack) {
        const sender = localStream.getVideoTracks()[0];
        localStream.removeTrack(sender);
        localStream.addTrack(origVideoTrack);
        if (videoRef.current) videoRef.current.srcObject = localStream;
        peerConnections.current.forEach((pc) => {
          const senders = pc.getSenders();
          const s = senders.find((sns) => sns.track?.kind === "video");
          if (s) s.replaceTrack(origVideoTrack);
        });
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        const currentVideo = localStream.getVideoTracks()[0];

        localStream.removeTrack(currentVideo);
        localStream.addTrack(screenTrack);
        if (videoRef.current) videoRef.current.srcObject = localStream;

        peerConnections.current.forEach((pc) => {
          const senders = pc.getSenders();
          const s = senders.find((sns) => sns.track?.kind === "video");
          if (s) s.replaceTrack(screenTrack);
        });

        screenTrack.onended = () => {
          toggleScreenShare();
        };
        setIsScreenSharing(true);
      } catch (err) {
        console.warn("Screen share error:", err);
        message.error("Screen sharing canceled or failed.");
      }
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/livestreamingplatform/watch/${firebaseUser?.uid}`;
    navigator.clipboard.writeText(link).then(() => message.success("Stream watch link copied!"));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Stream Controls Header */}
      <div className="bg-card p-4 sm:p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-navy mb-1">
            {isStreaming ? streamTitle : "Stream Studio"}
          </h2>
          <div className="flex items-center gap-2">
            {isStreaming ? (
              <>
                <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider animate-pulse">
                  LIVE
                </span>
                <Tag icon={<EyeOutlined />} color="purple" className="border-primary text-primary bg-primary/10">
                  {viewerCount} Viewers
                </Tag>
                <Tag color="blue">Duration: {formatDuration(streamDuration)}</Tag>
              </>
            ) : (
              <Tag color="default">Offline</Tag>
            )}
          </div>
        </div>

        <Space size="middle">
          {!isStreaming ? (
            <>
              <Button icon={<SettingOutlined />} onClick={openDeviceCheck} className="border-border text-navy font-semibold rounded-lg hover:border-primary hover:text-primary">
                Device Setup
              </Button>
              <Button type="primary" icon={<VideoCameraOutlined />} onClick={openDeviceCheck} className="bg-primary hover:bg-secondary text-white border-none font-semibold rounded-lg shadow-md">
                Go Live
              </Button>
            </>
          ) : (
            <>
              <Button size="small" icon={<CopyOutlined />} onClick={handleCopyLink} className="border-border text-navy font-semibold rounded-lg hover:border-primary hover:text-primary">
                Share Link
              </Button>
              <Button type="primary" danger icon={<StopOutlined />} onClick={handleStopStream} className="bg-red-600 hover:bg-red-700 border-none font-semibold rounded-lg">
                End Stream
              </Button>
            </>
          )}
        </Space>
      </div>

      <Row gutter={[20, 20]}>
        {/* Studio Video Viewport */}
        <Col xs={24} lg={16}>
          <Card className="bg-card border border-border rounded-2xl overflow-hidden p-0 shadow-sm" variant="borderless">
            <div className="relative w-full h-[380px] sm:h-[480px] bg-black flex items-center justify-center rounded-xl overflow-hidden">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

              {!isStreaming && (
                <div className="absolute inset-0 bg-navy/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white">
                  <VideoCameraOutlined className="text-5xl text-primary mb-4" />
                  <h3 className="text-2xl font-extrabold text-white mb-2">
                    Ready to Stream?
                  </h3>
                  <p className="text-text text-sm max-w-md mb-6">
                    Configure your camera and microphone, set a title, and broadcast in sub-second WebRTC quality.
                  </p>
                  <Button type="primary" size="large" icon={<VideoCameraOutlined />} onClick={openDeviceCheck} className="bg-primary hover:bg-secondary text-white border-none font-bold rounded-xl px-6 h-12 shadow-lg">
                    Setup & Start Stream
                  </Button>
                </div>
              )}

              {/* Controls Bar Overlay */}
              {isStreaming && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-navy/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-3">
                  <Tooltip title={isMuted ? "Unmute Mic" : "Mute Mic"}>
                    <Button
                      shape="circle"
                      icon={isMuted ? <AudioMutedOutlined className="text-red-500" /> : <AudioOutlined className="text-white" />}
                      onClick={toggleMute}
                      className="bg-darkPurple/80 border-border hover:border-primary"
                    />
                  </Tooltip>
                  <Tooltip title={isCameraOn ? "Turn Off Camera" : "Turn On Camera"}>
                    <Button
                      shape="circle"
                      icon={<VideoCameraOutlined className={isCameraOn ? "text-white" : "text-red-500"} />}
                      onClick={toggleCamera}
                      className="bg-darkPurple/80 border-border hover:border-primary"
                    />
                  </Tooltip>
                  <Tooltip title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}>
                    <Button
                      shape="circle"
                      icon={<DesktopOutlined className={isScreenSharing ? "text-secondary" : "text-white"} />}
                      onClick={toggleScreenShare}
                      className="bg-darkPurple/80 border-border hover:border-primary"
                    />
                  </Tooltip>
                </div>
              )}
            </div>
          </Card>
        </Col>

        {/* Studio Live Chat Panel */}
        <Col xs={24} lg={8}>
          <Card className="bg-card border border-border rounded-2xl shadow-sm flex flex-col h-[480px]" variant="borderless">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <span className="font-bold text-navy text-base">Stream Chat</span>
              <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">{viewerCount} viewers</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center text-xs text-text p-4">
                  <span>Chat messages will appear here once viewers join and message.</span>
                </div>
              ) : (
                <List
                  dataSource={messages}
                  renderItem={(msg, idx) => {
                    const isHost = firebaseUser && (msg.username === firebaseUser.displayName || msg.username === firebaseUser.email);
                    return (
                      <div key={idx} className={`p-2.5 rounded-xl border text-xs ${isHost ? "bg-primary/10 border-primary/30" : "bg-background border-border"}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <Avatar size="small" className={isHost ? "bg-secondary" : "bg-primary"}>
                              {msg.username ? msg.username.charAt(0).toUpperCase() : "S"}
                            </Avatar>
                            <span className="font-bold text-navy">{msg.username}</span>
                            {isHost && (
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
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="pt-2 border-t border-border">
              <Space.Compact style={{ width: "100%" }}>
                <Input
                  placeholder="Send chat as host..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onPressEnter={sendMessage}
                  autoComplete="off"
                  disabled={!isStreaming}
                  className="rounded-l-lg border-border"
                />
                <Button type="primary" icon={<SendOutlined />} onClick={sendMessage} disabled={!isStreaming} className="bg-primary hover:bg-secondary border-none rounded-r-lg" />
              </Space.Compact>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Pre-stream Setup & Device Check Modal */}
      <Modal
        title={<span className="text-navy font-bold">Stream Setup & Device Check</span>}
        open={isDeviceModalOpen}
        onCancel={closeDeviceCheck}
        footer={[
          <Button key="cancel" onClick={closeDeviceCheck} className="border-border text-navy">
            Cancel
          </Button>,
          <Button key="submit" type="primary" icon={<VideoCameraOutlined />} onClick={handleStartStream} className="bg-primary hover:bg-secondary text-white border-none font-bold">
            Go Live Now
          </Button>,
        ]}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Stream Title *
            </label>
            <Input
              placeholder="e.g. Building Full-Stack Live Stream App!"
              value={inputTitle}
              onChange={(e) => setInputTitle(e.target.value)}
              size="large"
              className="rounded-lg border-border"
            />
          </div>

          <Row gutter={12}>
            <Col span={12}>
              <label className="block text-xs font-semibold text-text mb-1">
                Camera Source
              </label>
              <Select
                style={{ width: "100%" }}
                value={selectedVideoDevice}
                onChange={(val) => {
                  setSelectedVideoDevice(val);
                  handleDeviceChange(val, selectedAudioDevice);
                }}
              >
                {videoDevices.map((d) => (
                  <Option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                  </Option>
                ))}
              </Select>
            </Col>

            <Col span={12}>
              <label className="block text-xs font-semibold text-text mb-1">
                Microphone Source
              </label>
              <Select
                style={{ width: "100%" }}
                value={selectedAudioDevice}
                onChange={(val) => {
                  setSelectedAudioDevice(val);
                  handleDeviceChange(selectedVideoDevice, val);
                }}
              >
                {audioDevices.map((d) => (
                  <Option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                  </Option>
                ))}
              </Select>
            </Col>
          </Row>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Device Video Preview
            </label>
            <div className="w-full h-48 bg-black rounded-lg overflow-hidden flex items-center justify-center">
              <video ref={previewVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            </div>
          </div>
        </Space>
      </Modal>
    </div>
  );
};

StartStreaming.propTypes = {
  streamId: PropTypes.string,
};

export default StartStreaming;
