import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useLocation, Link } from "react-router-dom";
import {
  Card,
  Input,
  Row,
  Col,
  Typography,
  Skeleton,
  Empty,
  Avatar,
  Tabs,
  Alert,
  Space,
  Button,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  VideoCameraOutlined,
  ReloadOutlined,
  PlaySquareOutlined,
} from "@ant-design/icons";
import socket from "../../socket";
import { getAllVideos } from "../../api/videos";

const { Text } = Typography;

const VideoCard = ({ vid }) => {
  const [playing, setPlaying] = useState(false);

  return (
    <Card hoverable className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden glass" variant="borderless">
      <div className="relative w-full h-44 bg-black rounded-lg overflow-hidden flex items-center justify-center">
        {playing ? (
          <video
            src={vid.url}
            className="w-full h-full object-cover"
            controls
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <div className="relative w-full h-full cursor-pointer flex items-center justify-center group" onClick={() => setPlaying(true)}>
            <img
              src={vid.coverImage || vid.url}
              alt={vid.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-navy/40 flex items-center justify-center group-hover:bg-navy/20 transition-colors">
              <PlayCircleOutlined className="text-4xl text-primary drop-shadow-md group-hover:scale-110 transition-transform" />
            </div>
          </div>
        )}
      </div>

      <div className="pt-3">
        <h4 className="text-base font-bold text-navy truncate mb-1">
          {vid.title || "Untitled Video"}
        </h4>
        <div className="flex items-center gap-2">
          <Avatar size="small" className="bg-primary">
            {vid.uploaderName ? vid.uploaderName.charAt(0).toUpperCase() : "U"}
          </Avatar>
          <span className="text-xs text-text font-medium">By {vid.uploaderName || "Unknown"}</span>
        </div>
      </div>
    </Card>
  );
};

VideoCard.propTypes = {
  vid: PropTypes.shape({
    url: PropTypes.string,
    coverImage: PropTypes.string,
    title: PropTypes.string,
    uploaderName: PropTypes.string,
  }).isRequired,
};

const Browse = ({ defaultTab }) => {
  const location = useLocation();
  const isVideosRoute = location.pathname.includes("/videos") || defaultTab === "videos";

  const [streams, setStreams] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(isVideosRoute ? "videos" : "all");

  useEffect(() => {
    if (isVideosRoute) {
      setActiveTab("videos");
    }
  }, [location.pathname, isVideosRoute]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      socket.emit("get-streams");

      const videoRes = await getAllVideos();
      if (videoRes && videoRes.data && videoRes.data.videos) {
        setVideos(videoRes.data.videos);
      } else if (videoRes && Array.isArray(videoRes.videos)) {
        setVideos(videoRes.videos);
      } else if (Array.isArray(videoRes)) {
        setVideos(videoRes);
      }
    } catch (err) {
      console.error("Error fetching browse data:", err);
      setError("Failed to load videos. Please check backend server connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleStreamList = (data) => {
      if (data && data.liveStreams) {
        setStreams(data.liveStreams);
      }
    };

    const handleUpdateStreams = (updatedList) => {
      if (Array.isArray(updatedList)) {
        setStreams(updatedList);
      }
    };

    socket.on("stream-list", handleStreamList);
    socket.on("update-streams", handleUpdateStreams);

    return () => {
      socket.off("stream-list", handleStreamList);
      socket.off("update-streams", handleUpdateStreams);
    };
  }, []);

  const filteredStreams = streams.filter(
    (s) =>
      s.streamTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.streamerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVideos = videos.filter(
    (v) =>
      v.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.uploaderName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy mb-1">
            Explore Touch Live
          </h2>
          <p className="text-sm text-text">
            Watch real-time live broadcasts and user-posted videos from Cloudinary.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Input
            placeholder="Search streams or videos..."
            prefix={<SearchOutlined className="text-text" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 rounded-xl border-border"
            allowClear
          />
          <Button icon={<ReloadOutlined />} onClick={fetchData} className="border-border text-navy font-medium rounded-xl hover:border-primary hover:text-primary">
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert
          message="Notice"
          description={error}
          type="warning"
          showIcon
          className="rounded-xl"
        />
      )}

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="bg-card p-4 rounded-2xl border border-border shadow-sm"
        items={[
          {
            key: "all",
            label: (
              <span className="font-semibold">
                <PlaySquareOutlined /> All Content ({filteredStreams.length + filteredVideos.length})
              </span>
            ),
            children: (
              <Space direction="vertical" size={32} className="w-full mt-4">
                {/* Section 1: Live Channels */}
                <div>
                  <h3 className="text-xl font-bold text-navy mb-4 flex items-center gap-2">
                    🔴 Live Broadcasts ({filteredStreams.length})
                  </h3>
                  {loading ? (
                    <Row gutter={[20, 20]}>
                      {[1, 2].map((n) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={n}>
                          <Card className="bg-card border border-border rounded-xl" variant="borderless">
                            <Skeleton.Node active style={{ width: "100%", height: 140 }} />
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  ) : filteredStreams.length === 0 ? (
                    <Card className="bg-background border border-border text-center py-6 rounded-xl" variant="borderless">
                      <Text className="text-text">No streams currently live. Start your own broadcast!</Text>
                    </Card>
                  ) : (
                    <Row gutter={[20, 20]}>
                      {filteredStreams.map((stream) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={stream.id || stream.streamerId}>
                          <Link to={`/livestreamingplatform/watch/${stream.id}`}>
                            <Card hoverable className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden glass" variant="borderless">
                              <div className="relative w-full h-44 bg-navy rounded-lg overflow-hidden flex items-center justify-center">
                                <VideoCameraOutlined className="text-4xl text-primary" />
                                <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider animate-pulse">
                                  LIVE
                                </div>
                                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1">
                                  <EyeOutlined /> {stream.viewers || 0}
                                </div>
                              </div>
                              <div className="pt-3">
                                <h4 className="text-base font-bold text-navy truncate mb-1">
                                  {stream.streamTitle || "Live Broadcast"}
                                </h4>
                                <div className="flex items-center gap-2">
                                  <Avatar src={stream.profilePic} className="bg-primary">
                                    {stream.streamerName ? stream.streamerName.charAt(0).toUpperCase() : "S"}
                                  </Avatar>
                                  <span className="text-xs text-text font-medium">{stream.streamerName || "Streamer"}</span>
                                </div>
                              </div>
                            </Card>
                          </Link>
                        </Col>
                      ))}
                    </Row>
                  )}
                </div>

                {/* Section 2: Uploaded Videos */}
                <div>
                  <h3 className="text-xl font-bold text-navy mb-4 flex items-center gap-2">
                    🎬 Posted / Uploaded Videos ({filteredVideos.length})
                  </h3>
                  {loading ? (
                    <Row gutter={[20, 20]}>
                      {[1, 2, 3, 4].map((n) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={n}>
                          <Card className="bg-card border border-border rounded-xl" variant="borderless">
                            <Skeleton.Node active style={{ width: "100%", height: 140 }} />
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  ) : filteredVideos.length === 0 ? (
                    <Card className="bg-background border border-border text-center py-6 rounded-xl" variant="borderless">
                      <Text className="text-text">No uploaded videos yet. Go to your Profile page to upload videos!</Text>
                    </Card>
                  ) : (
                    <Row gutter={[20, 20]}>
                      {filteredVideos.map((vid, idx) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={vid.public_id || idx}>
                          <VideoCard vid={vid} />
                        </Col>
                      ))}
                    </Row>
                  )}
                </div>
              </Space>
            ),
          },
          {
            key: "videos",
            label: (
              <span className="font-semibold">
                <PlaySquareOutlined /> Uploaded Videos ({filteredVideos.length})
              </span>
            ),
            children: (
              <div className="mt-4">
                {filteredVideos.length === 0 ? (
                  <Card className="bg-background border border-border text-center py-12 rounded-xl" variant="borderless">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={<span className="text-text">No uploaded videos found in Cloudinary.</span>}
                    />
                  </Card>
                ) : (
                  <Row gutter={[20, 20]}>
                    {filteredVideos.map((vid, idx) => (
                      <Col xs={24} sm={12} md={8} lg={6} key={vid.public_id || idx}>
                        <VideoCard vid={vid} />
                      </Col>
                    ))}
                  </Row>
                )}
              </div>
            ),
          },
          {
            key: "live",
            label: (
              <span className="font-semibold">
                <VideoCameraOutlined /> Live Channels ({filteredStreams.length})
              </span>
            ),
            children: (
              <div className="mt-4">
                {filteredStreams.length === 0 ? (
                  <Card className="bg-background border border-border text-center py-12 rounded-xl" variant="borderless">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={<span className="text-text">No active live streams.</span>}
                    />
                  </Card>
                ) : (
                  <Row gutter={[20, 20]}>
                    {filteredStreams.map((stream) => (
                      <Col xs={24} sm={12} md={8} lg={6} key={stream.id || stream.streamerId}>
                        <Link to={`/livestreamingplatform/watch/${stream.id}`}>
                          <Card hoverable className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden" variant="borderless">
                            <div className="relative w-full h-44 bg-navy rounded-lg overflow-hidden flex items-center justify-center">
                              <VideoCameraOutlined className="text-4xl text-primary" />
                              <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider animate-pulse">
                                LIVE
                              </div>
                              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1">
                                <EyeOutlined /> {stream.viewers || 0}
                              </div>
                            </div>
                            <div className="pt-3">
                              <h4 className="text-base font-bold text-navy truncate mb-1">
                                {stream.streamTitle || "Live Broadcast"}
                              </h4>
                              <div className="flex items-center gap-2">
                                <Avatar src={stream.profilePic} className="bg-primary">
                                  {stream.streamerName ? stream.streamerName.charAt(0).toUpperCase() : "S"}
                                </Avatar>
                                <span className="text-xs text-text font-medium">{stream.streamerName || "Streamer"}</span>
                              </div>
                            </div>
                          </Card>
                        </Link>
                      </Col>
                    ))}
                  </Row>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

Browse.propTypes = {
  defaultTab: PropTypes.string,
};

export default Browse;
