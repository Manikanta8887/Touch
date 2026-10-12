import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input, Button, Form, Card, Divider } from "antd";
import { GoogleOutlined, UserOutlined, MailOutlined, LockOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";
import { Auth, GoogleProvider } from "../Firebase/Firebaseconfig";
import Logo from "../../assets/logo.png";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch } from "react-redux";
import { setFirebaseUser } from "../Redux/userSlice";
import { saveUser } from "../../api/users";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState({ email: false, google: false, guest: false });
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(Auth, (user) => {
      if (user) {
        dispatch(
          setFirebaseUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "Anonymous User",
            photoURL: user.photoURL || "",
          })
        );
      }
    });
    return () => unsubscribe();
  }, [dispatch]);

  const syncUserWithBackend = async (user, loginType) => {
    try {
      const userData = {
        uid: user.uid,
        name: user.displayName || user.email?.split("@")[0] || "Guest Streamer",
        email: user.email || `${user.uid}@guest.touchlive.com`,
        profilePic: user.photoURL || "",
      };

      await saveUser(userData);
      toast.success(`${loginType.toUpperCase()} Login Successful!`);
      setTimeout(() => navigate("/livestreamingplatform", { replace: true }), 1200);
    } catch (error) {
      console.error("Backend Sync Error:", error);
      toast.error("Account created in Firebase, but failed to sync profile data.");
    }
  };

  const handleEmailLogin = async (values) => {
    setLoading((prev) => ({ ...prev, email: true }));
    try {
      const result = await signInWithEmailAndPassword(Auth, values.email, values.password);
      await syncUserWithBackend(result.user, "Email");
    } catch (error) {
      const msg = error.code === "auth/invalid-credential" || error.code === "auth/user-not-found"
        ? "Invalid email or password"
        : error.message;
      toast.error(msg);
    } finally {
      setLoading((prev) => ({ ...prev, email: false }));
    }
  };

  const handleGoogleLogin = async () => {
    setLoading((prev) => ({ ...prev, google: true }));
    try {
      const result = await signInWithPopup(Auth, GoogleProvider);
      await syncUserWithBackend(result.user, "Google");
    } catch (error) {
      console.warn("Google login failed:", error);
      toast.error("Google sign-in canceled or failed");
    } finally {
      setLoading((prev) => ({ ...prev, google: false }));
    }
  };

  const handleGuestLogin = async () => {
    setLoading((prev) => ({ ...prev, guest: true }));
    try {
      const result = await signInAnonymously(Auth);
      await syncUserWithBackend(result.user, "Guest");
    } catch (error) {
      console.warn("Guest login failed:", error);
      toast.error("Guest login failed");
    } finally {
      setLoading((prev) => ({ ...prev, guest: false }));
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      return toast.error("Please enter a valid email address.");
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(Auth, resetEmail);
      toast.success("Password reset email sent! Check your inbox.");
      setResetMode(false);
    } catch (error) {
      toast.error("Failed to send reset email: " + error.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4 selection:bg-primary selection:text-white">
      {/* Background Decorative Ambient Glowing Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-secondary/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-darkPurple/5 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md bg-card/95 backdrop-blur-xl border border-border/80 rounded-3xl shadow-2xl p-4 sm:p-6 relative z-10" variant="borderless">
        <div className="mb-2">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/")}
            className="text-darkPurple hover:text-primary font-bold hover:bg-primary/10 rounded-lg transition-all"
          >
            Home
          </Button>
        </div>

        <div className="text-center mb-6">
          <div className="p-3 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl inline-block mb-2 shadow-inner border border-primary/20">
            <img src={Logo} alt="Touch Live Logo" className="h-12 w-auto mx-auto object-contain" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-darkPurple tracking-tight mb-1">
            {resetMode ? "Reset Password" : "Welcome Back"}
          </h2>
          <p className="text-sm text-text font-normal max-w-xs mx-auto">
            {resetMode ? "Enter your email to receive password reset instructions" : "Log in to start streaming and join live channels"}
          </p>
        </div>

        {resetMode ? (
          <div className="mt-4">
            <Form layout="vertical" onFinish={handlePasswordReset}>
              <Form.Item
                label={<span className="text-darkPurple font-bold text-sm">Email Address</span>}
                required
              >
                <Input
                  prefix={<MailOutlined className="text-primary" />}
                  placeholder="you@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="rounded-xl border-border h-12 text-sm focus:border-primary"
                />
              </Form.Item>
              <Button
                type="primary"
                block
                loading={resetLoading}
                htmlType="submit"
                size="large"
                className="bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-darkPurple text-white border-none rounded-xl font-bold h-12 shadow-lg shadow-primary/30 hover:scale-[1.01] transition-all"
              >
                Send Reset Link
              </Button>
              <Button type="link" block onClick={() => setResetMode(false)} className="text-text hover:text-primary font-bold mt-2">
                Back to Login
              </Button>
            </Form>
          </div>
        ) : (
          <>
            <Form layout="vertical" onFinish={handleEmailLogin} requiredMark={false}>
              <Form.Item
                name="email"
                label={<span className="text-darkPurple font-bold text-sm">Email Address</span>}
                rules={[
                  { required: true, message: "Email is required" },
                  { type: "email", message: "Please enter a valid email address" },
                ]}
              >
                <Input prefix={<MailOutlined className="text-primary" />} placeholder="you@example.com" size="large" className="rounded-xl border-border h-12 text-sm" />
              </Form.Item>

              <Form.Item
                name="password"
                label={<span className="text-darkPurple font-bold text-sm">Password</span>}
                rules={[{ required: true, message: "Password is required" }]}
              >
                <Input.Password prefix={<LockOutlined className="text-primary" />} placeholder="••••••••" size="large" className="rounded-xl border-border h-12 text-sm" />
              </Form.Item>

              <div className="text-right mb-5">
                <span className="text-xs font-bold text-primary hover:text-secondary cursor-pointer transition-colors" onClick={() => setResetMode(true)}>
                  Forgot password?
                </span>
              </div>

              <Button
                type="primary"
                htmlType="submit"
                loading={loading.email}
                size="large"
                block
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-95 text-white border-none rounded-xl font-bold h-12 shadow-lg shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
              >
                Sign In with Email
              </Button>
            </Form>

            <Divider className="my-6 border-border text-xs text-text font-semibold">
              Or continue with
            </Divider>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <Button
                block
                size="large"
                icon={<GoogleOutlined style={{ color: "#ea4335" }} />}
                loading={loading.google}
                onClick={handleGoogleLogin}
                className="border-2 border-border/80 text-darkPurple font-bold rounded-xl h-12 hover:border-primary hover:text-primary shadow-sm hover:shadow transition-all"
              >
                Google
              </Button>
              <Button
                block
                size="large"
                icon={<UserOutlined className="text-primary" />}
                loading={loading.guest}
                onClick={handleGuestLogin}
                className="border-2 border-border/80 text-darkPurple font-bold rounded-xl h-12 hover:border-primary hover:text-primary shadow-sm hover:shadow transition-all"
              >
                Guest Login
              </Button>
            </div>

            <p className="text-center text-sm text-text font-medium">
              Don&apos;t have an account? <Link to="/signup" className="text-primary font-bold hover:text-secondary">Sign up</Link>
            </p>
          </>
        )}
      </Card>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
    </div>
  );
};

export default Login;