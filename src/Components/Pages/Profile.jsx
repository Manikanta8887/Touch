import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Input,
  Button,
  Avatar,
  message,
  Progress,
  Modal,
  Card,
  Row,
  Col,
  Tabs,
  Tag,
  Empty,
  Skeleton,
  Popconfirm,
  Space,
  List,
} from "antd";
import {
  UploadOutlined,
  UserOutlined,
  DeleteOutlined,
  EditOutlined,
  VideoCameraOutlined,
  HistoryOutlined,
  PlaySquareOutlined,
  ClockCircleOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { updateUser } from "../Redux/userSlice.js";
import { useParams } from "react-router-dom";
import { getUserProfile, updateUserProfile } from "../../api/profile";
import { getUserVideos, getAllVideos, uploadVideo, deleteVideo } from "../../api/videos";
import { getPastStreams, getStreamChat } from "../../api/streams";

const MAX_STORAGE = 1024 * 1024 * 1024; // 1 GB free allocation

export default function ProfilePage() {
  const { uid } = useParams();
  const dispatch = useDispatch();
  const loggedInUser = useSelector((s) => s.user.firebaseUser);
  const reduxBio = useSelector((s) => s.user.bio);
  const isPublic = uid && uid !== loggedInUser?.uid;

  const [profileData, setProfileData] = useState(null);
  const [videos, setVideos] = useState([]);
  const [pastStreams, setPastStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [bioEditModal, setBioEditModal] = useState(false);
  const [bioInput, setBioInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [profilePicInput, setProfilePicInput] = useState("");

  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [videoTitle, setVideoTitle] = useState("");

  // MISS-007: Stream session detail & chat modal
  const [selectedStreamModal, setSelectedStreamModal] = useState(null);
  const [streamChatMessages, setStreamChatMessages] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);

  const targetUid = isPublic ? uid : loggedInUser?.uid;

  const loadProfileData = useCallback(async () => {
    setLoading(true);
    try {
      if (isPublic && targetUid) {
        const profRes = await getUserProfile(targetUid);
        if (profRes && profRes.data && profRes.data.user) {
          setProfileData(profRes.data.user);
        }
      } else if (loggedInUser) {
        setProfileData(loggedInUser);
        setBioInput(reduxBio || "");
        setNameInput(loggedInUser.displayName || "");
        setProfilePicInput(loggedInUser.photoURL || "");
      }

      // Fetch user videos or all Cloudinary videos
      let vRes;
      if (targetUid) {
        vRes = await getUserVideos(targetUid);
      } else {
        vRes = await getAllVideos();
      }

      if (vRes && vRes.data && vRes.data.videos) {
        setVideos(vRes.data.videos);
      } else if (vRes && Array.isArray(vRes.videos)) {
        setVideos(vRes.videos);
      } else if (Array.isArray(vRes)) {
        setVideos(vRes);
      }

      if (targetUid) {
        const streamRes = await getPastStreams(targetUid);
        if (streamRes && streamRes.data && streamRes.data.streams) {
          setPastStreams(streamRes.data.streams);
        } else if (Array.isArray(streamRes)) {
          setPastStreams(streamRes);
        }
      }
    } catch (err) {
      console.error("Error loading profile details:", err);
    } finally {
      setLoading(false);
    }
  }, [isPublic, targetUid, loggedInUser, reduxBio]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const usedBytes = useMemo(
    () => videos.reduce((sum, v) => sum + (v.sizeInBytes || 0), 0),
    [videos]
  );
  const usedMB = (usedBytes / (1024 * 1024)).toFixed(1);
  const storagePercent = Math.min(100, parseFloat(((usedBytes / MAX_STORAGE) * 100).toFixed(1)));

  const handleOpenEditModal = () => {
    setBioInput(profileData?.bio || reduxBio || "");
    setNameInput(profileData?.name || profileData?.displayName || "");
    setProfilePicInput(profileData?.profilePic || profileData?.photoURL || "");
    setBioEditModal(true);
  };

  // P4-12 / MISS-002 / INT-005: Update bio, name, and profilePic together
  const handleUpdateProfile = async () => {
    if (!loggedInUser) return;
    try {
      const updatePayload = {
        bio: bioInput.trim(),
        name: nameInput.trim() || undefined,
        profilePic: profilePicInput.trim() || undefined,
      };
      const res = await updateUserProfile(loggedInUser.uid, updatePayload);
      if (res.success) {
        dispatch(updateUser(updatePayload));
        setProfileData((prev) => ({
          ...prev,
          bio: updatePayload.bio,
          name: updatePayload.name || prev?.name,
          displayName: updatePayload.name || prev?.displayName,
          profilePic: updatePayload.profilePic || prev?.profilePic,
          photoURL: updatePayload.profilePic || prev?.photoURL,
        }));
        message.success("Profile updated successfully!");
        setBioEditModal(false);
      }
    } catch (err) {
      console.error("Update profile error:", err);
      message.error("Failed to update profile.");
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      return message.warning("Please select a video file to upload.");
    }
    setUploading(true);
    try {
      const title = videoTitle.trim() || "Uploaded Video";
      const userUid = loggedInUser?.uid || "guest";
      const res = await uploadVideo(userUid, selectedFile, title);
      if (res.success && res.data && res.data.video) {
        setVideos((prev) => [res.data.video, ...prev]);
        message.success("Video uploaded successfully to Cloudinary!");
        setUploadModalVisible(false);
        setSelectedFile(null);
        setVideoTitle("");
      }
    } catch (err) {
      console.error("Upload error:", err);
      message.error("Video upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteVideo = async (publicId) => {
    try {
      const res = await deleteVideo(publicId);
      if (res.success) {
        setVideos((prev) => prev.filter((v) => v.public_id !== publicId));
        message.success("Video deleted successfully");
      }
    } catch (err) {
      console.error("Delete video error:", err);
      message.error("Failed to delete video.");
    }
  };

  // MISS-007: Open stream session details & fetch chat
  const handleViewStreamSession = async (st) => {
    setSelectedStreamModal(st);
    if (st.chatMessages && st.chatMessages.length > 0) {
      setStreamChatMessages(st.chatMessages);
      return;
    }
    if (st._id) {
      setLoadingChat(true);
      try {
        const chatRes = await getStreamChat(st._id);
        if (chatRes && chatRes.data && chatRes.data.chatMessages) {
          setStreamChatMessages(chatRes.data.chatMessages);
        } else {
          setStreamChatMessages([]);
        }
      } catch (err) {
        console.warn("Could not fetch chat for session:", err);
        setStreamChatMessages([]);
      } finally {
        setLoadingChat(false);
      }
    } else {
      setStreamChatMessages([]);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <Card className="bg-card border border-border rounded-2xl p-6">
          <Skeleton avatar active paragraph={{ rows: 4 }} />
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Streamer Header Card */}
      <Card className="bg-card border border-border rounded-2xl shadow-sm p-2 sm:p-4" variant="borderless">
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} sm={6} className="text-center">
            <Avatar
              size={110}
              src={profileData?.profilePic || profileData?.photoURL}
              icon={<UserOutlined />}
              className="border-4 border-primary bg-navy shadow-md"
            />
          </Col>

          <Col xs={24} sm={18}>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-navy">
                    {profileData?.name || profileData?.displayName || "Streamer"}
                  </h2>
                  <span className="text-sm text-text font-medium">{profileData?.email}</span>
                </div>

                {!isPublic && (
                  <Space>
                    <Button icon={<EditOutlined />} onClick={handleOpenEditModal} className="border-border text-navy font-semibold rounded-lg hover:border-primary hover:text-primary">
                      Edit Profile
                    </Button>
                    <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadModalVisible(true)} className="bg-primary hover:bg-secondary text-white border-none font-semibold rounded-lg">
                      Upload Video
                    </Button>
                  </Space>
                )}
              </div>

              <div className="bg-background p-3 rounded-xl border border-border">
                <p className="text-sm text-text">
                  {profileData?.bio || (isPublic ? "No bio provided yet." : "Click 'Edit Profile' to add a custom bio.")}
                </p>
              </div>

              {!isPublic && (
                <div className="bg-background p-3 rounded-xl border border-border space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-text">
                    <span>Cloud Storage Used</span>
                    <span className="text-navy">{usedMB} MB / 1 GB</span>
                  </div>
                  <Progress percent={storagePercent} strokeColor="#A34BD0" size="small" showInfo={false} />
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Card>

      {/* Tabs for Videos & Past Streams */}
      <Tabs
        defaultActiveKey="videos"
        className="bg-card p-4 rounded-2xl border border-border shadow-sm"
        items={[
          {
            key: "videos",
            label: (
              <span className="font-semibold">
                <PlaySquareOutlined /> Channel Videos ({videos.length})
              </span>
            ),
            children: (
              <div className="mt-4">
                {videos.length === 0 ? (
                  <Card className="bg-background border border-border text-center py-12 rounded-xl" variant="borderless">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={<span className="text-text">No videos uploaded yet.</span>}
                    />
                  </Card>
                ) : (
                  <Row gutter={[20, 20]}>
                    {videos.map((vid, idx) => (
                      <Col xs={24} sm={12} md={8} lg={6} key={vid.public_id || idx}>
                        <Card hoverable className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden" variant="borderless">
                          <div className="relative w-full h-40 bg-black rounded-lg overflow-hidden flex items-center justify-center">
                            <video
                              src={vid.url}
                              className="w-full h-full object-cover"
                              controls
                              playsInline
                            />
                          </div>

                          <div className="pt-3">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-base font-bold text-navy truncate">
                                {vid.title || "Untitled Video"}
                              </h4>
                              {!isPublic && (
                                <Popconfirm
                                  title="Delete Video"
                                  description="Are you sure you want to delete this video from Cloudinary?"
                                  onConfirm={() => handleDeleteVideo(vid.public_id)}
                                  okText="Yes, Delete"
                                  cancelText="Cancel"
                                  okButtonProps={{ danger: true }}
                                >
                                  <Button danger type="text" icon={<DeleteOutlined />} size="small" className="text-red-500 hover:text-red-700" />
                                </Popconfirm>
                              )}
                            </div>
                            {/* MISS-005: Display video size and timestamp */}
                            <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px] text-text">
                              <span>{vid.createdAt ? new Date(vid.createdAt).toLocaleDateString() : "Uploaded video"}</span>
                              {vid.sizeInBytes ? <span>{(vid.sizeInBytes / (1024 * 1024)).toFixed(1)} MB</span> : null}
                            </div>
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </div>
            ),
          },
          {
            key: "streams",
            label: (
              <span className="font-semibold">
                <HistoryOutlined /> Stream History ({pastStreams.length})
              </span>
            ),
            children: (
              <div className="mt-4">
                {pastStreams.length === 0 ? (
                  <Card className="bg-background border border-border text-center py-12 rounded-xl" variant="borderless">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={<span className="text-text">No past stream records found.</span>}
                    />
                  </Card>
                ) : (
                  <Row gutter={[16, 16]}>
                    {pastStreams.map((st, i) => (
                      <Col xs={24} sm={12} md={8} key={st._id || i}>
                        <Card
                          hoverable
                          onClick={() => handleViewStreamSession(st)}
                          className="bg-card border border-border rounded-xl p-4 shadow-sm cursor-pointer hover:border-primary transition-all"
                          variant="borderless"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Tag color="purple" icon={<VideoCameraOutlined />} className="rounded-md font-semibold border-primary text-primary bg-primary/10">
                              Stream Session
                            </Tag>
                            <span className="text-xs text-text font-medium">{st.viewers || 0} Peak Viewers</span>
                          </div>
                          <h4 className="text-base font-bold text-navy mb-1 truncate">
                            {st.streamTitle}
                          </h4>
                          <div className="text-xs text-text flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                            <span className="flex items-center gap-1.5"><ClockCircleOutlined /> {st.startTime ? new Date(st.startTime).toLocaleString() : "Recorded"}</span>
                            <span className="text-primary font-semibold flex items-center gap-1"><MessageOutlined /> Details</span>
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </div>
            ),
          },
        ]}
      />

      {/* P4-12 / MISS-002: Edit Profile Modal (Name, ProfilePic, Bio) */}
      <Modal
        title={<span className="text-navy font-bold">Edit Profile</span>}
        open={bioEditModal}
        onOk={handleUpdateProfile}
        onCancel={() => setBioEditModal(false)}
        okText="Save Changes"
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <div>
            <label className="block text-sm text-text mb-1 font-medium">Display Name</label>
            <Input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Your Channel / Display Name"
              className="rounded-lg border-border"
            />
          </div>
          <div>
            <label className="block text-sm text-text mb-1 font-medium">Profile Picture URL</label>
            <Input
              value={profilePicInput}
              onChange={(e) => setProfilePicInput(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="rounded-lg border-border"
            />
          </div>
          <div>
            <label className="block text-sm text-text mb-1 font-medium">Channel Bio</label>
            <Input.TextArea
              rows={4}
              value={bioInput}
              onChange={(e) => setBioInput(e.target.value)}
              placeholder="Tell viewers about your channel and streaming schedule..."
              className="rounded-lg border-border"
            />
          </div>
        </Space>
      </Modal>

      {/* Upload Video Modal */}
      <Modal
        title={<span className="text-navy font-bold">Upload Video to Channel</span>}
        open={uploadModalVisible}
        onOk={handleUploadSubmit}
        onCancel={() => setUploadModalVisible(false)}
        confirmLoading={uploading}
        okText={uploading ? "Uploading..." : "Start Upload"}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <div>
            <label className="block text-sm text-text mb-1 font-medium">Video Title</label>
            <Input
              placeholder="Enter video title"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              className="rounded-lg border-border"
            />
          </div>

          <div>
            <label className="block text-sm text-text mb-1 font-medium">Select File (MP4, WebM)</label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="text-sm text-text"
            />
          </div>
        </Space>
      </Modal>

      {/* MISS-007: Stream Session Details & Recorded Chat Modal */}
      <Modal
        title={<span className="text-navy font-bold">Stream Session Details</span>}
        open={Boolean(selectedStreamModal)}
        onCancel={() => setSelectedStreamModal(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedStreamModal(null)} className="rounded-lg">
            Close
          </Button>,
        ]}
      >
        {selectedStreamModal && (
          <Space direction="vertical" style={{ width: "100%" }} orientation="vertical" size="small">
            <h3 className="text-lg font-bold text-navy">{selectedStreamModal.streamTitle}</h3>
            <div className="flex justify-between text-xs text-text bg-background p-2 rounded-lg">
              <span><strong>Started:</strong> {selectedStreamModal.startTime ? new Date(selectedStreamModal.startTime).toLocaleString() : "N/A"}</span>
              <span><strong>Peak Viewers:</strong> {selectedStreamModal.viewers || 0}</span>
            </div>
            <div className="mt-3">
              <h4 className="text-sm font-semibold text-navy mb-2 flex items-center gap-1.5">
                <MessageOutlined /> Recorded Chat Messages ({streamChatMessages.length})
              </h4>
              <div className="max-h-48 overflow-y-auto bg-background p-3 rounded-lg border border-border">
                {loadingChat ? (
                  <Skeleton active paragraph={{ rows: 2 }} />
                ) : streamChatMessages.length === 0 ? (
                  <p className="text-xs text-text italic">No chat messages were recorded during this session.</p>
                ) : (
                  <List
                    size="small"
                    dataSource={streamChatMessages}
                    renderItem={(item) => (
                      <List.Item className="!py-1 !px-0 border-b border-border/30">
                        <span className="text-xs">
                          <strong className="text-primary">{item.sender}:</strong> {item.message}
                        </span>
                      </List.Item>
                    )}
                  />
                )}
              </div>
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
}
