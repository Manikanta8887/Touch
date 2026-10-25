import { Route, Routes, useLocation, Navigate } from "react-router-dom";
import LiveStreamingPlatform from "./Components/Pages/Main";
import LandingPage from "./Components/LandingPage/LandingPage";
import Loginpage from "./Components/Login/Login";
import PageNotFound from "./Components/Login/PageNotFound";
import Signup from "./Components/Login/Signup";
import StartStreaming from "./Components/Pages/Startstreaming";
import StreamingContent from "./Components/Pages/Browse";
import ProfilePage from "./Components/Pages/Profile";
import WatchStream from "./Components/Pages/WatchStream.jsx";
import { useSelector, useDispatch } from "react-redux";

import Spin from "./assets/spinloading.svg";
import { useEffect, useRef, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, Button, Space } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { signOut } from "./api/client";
// removed duplicate import

// D-1: ProtectedRoute wrapper — redirects to /login if not authenticated
const ProtectedRoute = ({ children }) => {
  const firebaseUser = useSelector((s) => s.user.firebaseUser);
  if (firebaseUser === undefined) return null; // still loading
  if (!firebaseUser) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  const firebaseUser = useSelector((s) => s.user.firebaseUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();


  const currentBaseRoute = useMemo(() => {
    return location.pathname.split("/")[1] || "/";
  }, [location.pathname]);

  useEffect(() => {
    if (prevBaseRoute.current && prevBaseRoute.current !== currentBaseRoute) {
      setLoading(true);
      // D-6: Reduced from 1500ms to 400ms for snappier SPA navigation
      const timer = setTimeout(() => {
        setLoading(false);
      }, 400);
      return () => clearTimeout(timer);
    }
    prevBaseRoute.current = currentBaseRoute;
  }, [currentBaseRoute]);

  return (
    <>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <img src={Spin} alt="Loading..." className="w-28 h-28 object-contain" />
        </div>
      ) : (
        <>
          <nav className="glass bg-card border border-border shadow-md fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6">
            <Link to="/" className="text-xl font-bold text-primary">Touch Live</Link>
            {firebaseUser && (
              <div className="ml-auto flex items-center space-x-2">
                <Avatar src={firebaseUser.photoURL} icon={<UserOutlined />} />
                <span className="text-text">{firebaseUser.displayName || firebaseUser.email}</span>
                <Button type="primary" icon={<LogoutOutlined />} onClick={async () => { await signOut(); dispatch({ type: 'user/logout' }); navigate('/login'); }}>Logout</Button>
              </div>
            )}
          </nav>
          <div className="pt-16">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Loginpage />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/livestreamingplatform" element={<LiveStreamingPlatform />}>
                <Route index element={<StreamingContent />} />
                <Route path="videos" element={<StreamingContent defaultTab="videos" />} />
                {/* D-1: Protected routes — unauthenticated users are redirected to /login */}
                <Route path="stream/:id" element={<ProtectedRoute><StartStreaming /></ProtectedRoute>} />
                <Route path="watch/:id" element={<ProtectedRoute><WatchStream /></ProtectedRoute>} />
                {/* MISS-001: Own profile */}
                <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                {/* MISS-001: Public profile view with :uid param */}
                <Route path="profile/:uid" element={<ProfilePage />} />
              </Route>
              <Route path="/*" element={<PageNotFound />} />
            </Routes>
          </div>
        </>
      )}
    </>
  );
}

export default App;
