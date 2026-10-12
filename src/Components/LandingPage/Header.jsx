import { useState } from "react";
import { Layout, Button, Space, Drawer } from "antd";
import { MenuOutlined, PlayCircleOutlined, UserOutlined, UserAddOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import logoIcon from "../../assets/logo1.png";

const { Header } = Layout;

const AppHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <Header
      className="sticky top-0 z-50 px-4 sm:px-8 py-3 flex items-center justify-between shadow-md leading-normal h-auto"
      style={{ background: "#2D0A45", borderBottom: "1px solid rgba(255,255,255,0.1)" }}
    >
      <Link to="/" className="flex items-center gap-3 no-underline group">
        <div className="bg-white/10 p-1.5 rounded-xl backdrop-blur-md group-hover:bg-white/20 transition-all">
          <img src={logoIcon} alt="Touch Live Logo" className="h-8 w-auto object-contain" />
        </div>
        <span className="text-2xl font-extrabold text-white tracking-wide">
          Touch <span className="text-secondary drop-shadow-sm">Live</span>
        </span>
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-4">
        <Space size="middle">
          <Link to="/livestreamingplatform">
            <Button
              type="text"
              icon={<PlayCircleOutlined className="text-secondary" />}
              className="text-white hover:text-secondary hover:bg-white/10 transition-all font-semibold flex items-center gap-1.5"
            >
              Browse Streams
            </Button>
          </Link>
          <Link to="/login">
            <Button
              type="default"
              icon={<UserOutlined />}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/40 font-semibold rounded-xl px-4 transition-all"
            >
              Login
            </Button>
          </Link>
          <Link to="/signup">
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              className="bg-primary hover:bg-secondary text-white border-none font-bold rounded-xl px-5 shadow-lg shadow-primary/30 transition-all"
            >
              Get Started
            </Button>
          </Link>
        </Space>
      </div>

      {/* Mobile Menu Toggle */}
      <Button
        type="text"
        icon={<MenuOutlined style={{ fontSize: "1.2rem", color: "#FFFFFF" }} />}
        className="md:hidden flex items-center justify-center p-2 text-white hover:bg-white/10"
        onClick={() => setMobileMenuOpen(true)}
        aria-label="Open navigation menu"
      />

      {/* Mobile Drawer Menu */}
      <Drawer
        title={<span className="text-white font-bold text-lg">Navigation</span>}
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        styles={{
          body: { background: "#2D0A45", color: "#FFFFFF" },
          header: { background: "#061B33", borderBottom: "1px solid rgba(255,255,255,0.1)" },
        }}
      >
        <div className="flex flex-col gap-4">
          <Link to="/livestreamingplatform" onClick={() => setMobileMenuOpen(false)}>
            <Button type="primary" ghost block icon={<PlayCircleOutlined />} className="border-secondary text-secondary hover:bg-secondary/10">
              Browse Streams
            </Button>
          </Link>
          <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
            <Button type="default" block icon={<UserOutlined />} className="border-white/20 text-white hover:bg-white/10">
              Login
            </Button>
          </Link>
          <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
            <Button type="primary" block icon={<UserAddOutlined />} className="bg-primary text-white hover:bg-secondary border-none">
              Sign Up
            </Button>
          </Link>
        </div>
      </Drawer>
    </Header>
  );
};

export default AppHeader;
