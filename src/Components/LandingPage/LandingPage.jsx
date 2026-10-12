import { Button, Card, Tag, Row, Col } from "antd";
import { PlayCircleOutlined, VideoCameraOutlined, EyeOutlined, SafetyCertificateOutlined, ThunderboltOutlined, TeamOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import AppHeader from "./Header";
import Landimage1 from "../../assets/landimage.svg";

const LandingPage = () => {


  return (
    <div className="min-h-screen bg-background text-text font-sans selection:bg-primary selection:text-white">
      <AppHeader />

      {/* Hero Section */}
      <section className="relative py-12 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <Row gutter={[40, 40]} align="middle">
          <Col xs={24} lg={12}>
            <div className="mb-6">
              <Tag color="purple" icon={<ThunderboltOutlined />} className="px-3.5 py-1 text-xs sm:text-sm font-bold rounded-full border-primary/30 text-primary bg-primary/10 tracking-wide uppercase">
                Next-Gen WebRTC Streaming
              </Tag>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-darkPurple tracking-tight mb-6 leading-tight">
              Broadcast Live. <br />
              <span className="bg-gradient-to-r from-primary via-secondary to-darkPurple bg-clip-text text-transparent drop-shadow-sm">
                Connect Instantly.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-text mb-8 leading-relaxed max-w-xl font-normal">
              Touch Live is a high-performance, real-time live streaming platform powered by WebRTC. Stream in sub-second latency, engage with active communities, and record your streams effortlessly.
            </p>
            <div className="flex flex-wrap gap-4 mb-10">
              <Link to="/login">
                <Button
                  type="primary"
                  size="large"
                  icon={<VideoCameraOutlined />}
                  className="bg-primary hover:bg-secondary text-white font-bold h-12 px-7 rounded-xl border-none shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Start Streaming
                </Button>
              </Link>
              <Link to="/livestreamingplatform">
                <Button
                  size="large"
                  icon={<PlayCircleOutlined className="text-primary" />}
                  className="border-2 border-primary/20 text-darkPurple hover:text-primary hover:border-primary font-bold h-12 px-7 rounded-xl bg-card hover:bg-white shadow-sm hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Browse Streams
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-border max-w-xl">
              <div>
                <span className="block text-2xl sm:text-3xl font-extrabold text-darkPurple">Sub-sec</span>
                <span className="text-xs sm:text-sm text-text font-semibold">WebRTC Latency</span>
              </div>
              <div>
                <span className="block text-2xl sm:text-3xl font-extrabold text-darkPurple">100%</span>
                <span className="text-xs sm:text-sm text-text font-semibold">Real-time Signaling</span>
              </div>
              <div>
                <span className="block text-2xl sm:text-3xl font-extrabold text-darkPurple">HD</span>
                <span className="text-xs sm:text-sm text-text font-semibold">Adaptive Quality</span>
              </div>
            </div>
          </Col>

          {/* Interactive Mockup / Live Stream Preview */}
          <Col xs={24} lg={12}>
            <div className="bg-darkPurple rounded-2xl border-2 border-primary/30 shadow-2xl overflow-hidden hover:shadow-primary/20 transition-all duration-500">
              <div className="bg-navy px-4 py-3 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                </div>
                <span className="bg-red-600 text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 animate-pulse shadow-md">
                  LIVE NOW
                </span>
              </div>
              <div className="relative bg-black">
                <img src={Landimage1} alt="Live Stream Preview" className="w-full h-80 sm:h-96 object-cover" />
                <div className="absolute bottom-4 left-4 right-4 bg-navy/90 backdrop-blur-md p-4 rounded-xl flex items-center justify-between border border-white/15 text-white shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-bold text-sm shadow-md">
                      TL
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">Touch Live Streamer</div>
                      <div className="text-xs text-white/70 font-medium">Gaming & Tech Discussions</div>
                    </div>
                  </div>
                  <div className="bg-primary/30 border border-primary/50 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 text-white">
                    <EyeOutlined className="text-secondary" /> 1.4k watching
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </section>

      {/* Feature Showcase Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-darkPurple mb-3">Why Choose Touch Live?</h2>
          <p className="text-text text-base sm:text-lg max-w-2xl mx-auto font-normal">Everything you need for interactive, professional streaming</p>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <Card className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full" variant="borderless">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5 text-white bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/30">
                <ThunderboltOutlined />
              </div>
              <h3 className="text-xl font-extrabold text-darkPurple mb-2">Sub-Second Signaling</h3>
              <p className="text-text text-sm leading-relaxed font-normal">
                Powered by direct peer-to-peer WebRTC connections and custom Xirsys TURN signaling for crystal clear streams.
              </p>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full" variant="borderless">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5 text-white bg-gradient-to-br from-secondary to-darkPurple shadow-lg shadow-secondary/30">
                <TeamOutlined />
              </div>
              <h3 className="text-xl font-extrabold text-darkPurple mb-2">Real-Time Community Chat</h3>
              <p className="text-text text-sm leading-relaxed font-normal">
                Interactive WebSocket chat rooms with zero lag, instant message routing, and dedicated streamer badges.
              </p>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full" variant="borderless">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5 text-white bg-gradient-to-br from-darkPurple to-navy shadow-lg shadow-darkPurple/30">
                <SafetyCertificateOutlined />
              </div>
              <h3 className="text-xl font-extrabold text-darkPurple mb-2">Secure & Authenticated</h3>
              <p className="text-text text-sm leading-relaxed font-normal">
                Firebase token authentication and Cloudinary storage management keep your channel and videos safe.
              </p>
            </Card>
          </Col>
        </Row>
      </section>
    </div>
  );
};

export default LandingPage;
