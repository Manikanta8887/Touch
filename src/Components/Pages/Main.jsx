import { useEffect, useState } from "react";
import { Layout, Menu, Button, Avatar, Row, Col, Space } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { setFirebaseUser, logoutUser } from "../Redux/userSlice";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  VideoCameraOutlined,
  UserOutlined,
  LogoutOutlined,
  LoginOutlined,
  PlaySquareOutlined,
} from "@ant-design/icons";
import Logo from "../../assets/logo1.png";
import { Outlet, useLocation, useNavigate, Link } from "react-router-dom";

const { Header, Sider, Content, Footer } = Layout;

const LiveStreamingPlatform = () => {
  const [collapsed, setCollapsed] = useState(window.innerWidth < 768);
  const [selectedKey, setSelectedKey] = useState("/livestreamingplatform");
  const auth = getAuth();
  const dispatch = useDispatch();
  const firebaseUser = useSelector((state) => state.user.firebaseUser);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setSelectedKey(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        dispatch(
          setFirebaseUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split("@")[0] || "Streamer",
            photoURL: user.photoURL || null,
          })
        );
      } else {
        dispatch(setFirebaseUser(null));
      }
    });
    return () => unsubscribe();
  }, [auth, dispatch]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch(logoutUser());
      navigate("/login");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const streamerPath = firebaseUser
    ? `/livestreamingplatform/stream/${firebaseUser.uid}`
    : "/login";

  return (
    <Layout className="min-h-screen bg-background font-sans">
      {/* Sticky Fixed Sider */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="bg-navy border-r border-border/20 shadow-xl flex flex-col justify-between z-40"
        width={240}
        collapsedWidth={70}
        style={{
          background: "#061B33",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        <div
          className="p-4 flex items-center gap-3 cursor-pointer border-b border-white/10 hover:bg-white/5 transition-colors"
          onClick={() => navigate("/")}
        >
          <img src={Logo} alt="Logo" className="h-8 w-auto object-contain" />
          {!collapsed && (
            <span className="text-lg font-extrabold text-white tracking-wide">
              Touch <span className="text-secondary">Live</span>
            </span>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => navigate(key)}
          className="bg-transparent py-3 text-white/90 font-medium"
          style={{ background: "transparent" }}
          items={[
            { key: "/livestreamingplatform", icon: <HomeOutlined className="text-secondary" />, label: "Browse Streams" },
            { key: "/livestreamingplatform/videos", icon: <PlaySquareOutlined className="text-secondary" />, label: "Uploaded Videos" },
            { key: streamerPath, icon: <VideoCameraOutlined className="text-secondary" />, label: "Go Live" },
            { key: "/livestreamingplatform/profile", icon: <UserOutlined className="text-secondary" />, label: "My Profile" },
          ]}
        />

        <div className="p-3 border-t border-white/10 mt-auto">
          {!collapsed && firebaseUser && (
            <div className="flex items-center gap-3 p-2.5 mb-3 bg-darkPurple/80 rounded-xl border border-white/10 shadow-inner">
              <Avatar src={firebaseUser.photoURL} icon={<UserOutlined />} className="bg-primary flex-shrink-0 border border-white/20" />
              <div className="overflow-hidden text-xs">
                <div className="font-bold text-white truncate">{firebaseUser.displayName}</div>
                <div className="text-white/70 text-[11px] truncate">{firebaseUser.email}</div>
              </div>
            </div>
          )}

          {firebaseUser ? (
            <Button
              type="primary"
              danger
              block={!collapsed}
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 border-none font-semibold rounded-xl shadow-md"
            >
              {!collapsed && "Logout"}
            </Button>
          ) : (
            <Button
              type="primary"
              block={!collapsed}
              icon={<LoginOutlined />}
              onClick={() => navigate("/login")}
              className="bg-primary hover:bg-secondary border-none font-semibold rounded-xl shadow-md"
            >
              {!collapsed && "Login"}
            </Button>
          )}
        </div>
      </Sider>

      <Layout className="bg-background flex flex-col flex-1 min-w-0">
        <Header
          className="sticky top-0 z-30 px-6 py-3 flex items-center justify-between shadow-sm h-auto"
          style={{ background: "#FFFFFF", borderBottom: "1px solid #D9D9D9" }}
        >
          <Row align="middle" justify="space-between" className="w-full">
            <Col flex="none">
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined className="text-darkPurple text-lg" /> : <MenuFoldOutlined className="text-darkPurple text-lg" />}
                onClick={() => setCollapsed(!collapsed)}
                className="text-darkPurple hover:text-primary hover:bg-background"
              />
            </Col>

            <Col flex="none">
              <Space size="middle" align="center">
                {firebaseUser ? (
                  <Link to="/livestreamingplatform/profile" className="flex items-center gap-2 text-darkPurple font-bold hover:text-primary transition-colors">
                    <Avatar
                      src={firebaseUser.photoURL}
                      icon={<UserOutlined />}
                      alt="Profile"
                      className="border-2 border-primary cursor-pointer shadow-sm"
                    />
                    <span className="hidden sm:inline text-sm">{firebaseUser.displayName}</span>
                  </Link>
                ) : (
                  <Button type="primary" size="small" onClick={() => navigate("/login")} className="bg-primary hover:bg-secondary text-white border-none rounded-lg font-semibold px-4">
                    Sign In
                  </Button>
                )}
              </Space>
            </Col>
          </Row>
        </Header>

        <Content className="p-4 sm:p-6 bg-background min-h-[calc(100vh-120px)]">
          <Outlet />
        </Content>

        <Footer className="text-center py-4 bg-card border-t border-border text-xs text-text">
          © {new Date().getFullYear()} Touch Live. Built for sub-second live streaming.
        </Footer>
      </Layout>
    </Layout>
  );
};

export default LiveStreamingPlatform;
