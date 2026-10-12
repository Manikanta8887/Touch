import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, Progress } from "antd";
import { UserOutlined, MailOutlined, LockOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { Auth } from "../Firebase/Firebaseconfig";
import Logo from "../../assets/logo.png";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { saveUser } from "../../api/users";

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");

  const calculatePasswordStrength = (pass) => {
    let score = 0;
    if (!pass) return { score: 0, status: "exception", label: "Enter Password" };
    if (pass.length >= 8) score += 30;
    if (/[A-Z]/.test(pass)) score += 20;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;

    if (score < 40) return { score, status: "exception", label: "Weak" };
    if (score < 75) return { score, status: "active", label: "Medium" };
    return { score: 100, status: "success", label: "Strong" };
  };

  const strength = calculatePasswordStrength(password);

  const handleSubmit = async (values) => {
    const { username, email, password } = values;
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(Auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: username });

      await saveUser({
        uid: user.uid,
        name: username,
        email: email,
        profilePic: "",
      });

      toast.success("Account created successfully! Redirecting...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (error) {
      const errorMsg =
        error.code === "auth/email-already-in-use"
          ? "Email is already registered."
          : error.message;
      toast.error(errorMsg);
    } finally {
      setLoading(false);
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
          <h2 className="text-2xl sm:text-3xl font-extrabold text-darkPurple tracking-tight mb-1">Create Account</h2>
          <p className="text-sm text-text font-normal max-w-xs mx-auto">Join Touch Live and start streaming to the world</p>
        </div>

        <Form layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          <Form.Item
            name="username"
            label={<span className="text-darkPurple font-bold text-sm">Channel / Display Name</span>}
            rules={[{ required: true, message: "Display name is required" }]}
          >
            <Input prefix={<UserOutlined className="text-primary" />} placeholder="e.g. StreamerOne" size="large" className="rounded-xl border-border h-12 text-sm" />
          </Form.Item>

          <Form.Item
            name="email"
            label={<span className="text-darkPurple font-bold text-sm">Email Address</span>}
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Enter a valid email" },
            ]}
          >
            <Input prefix={<MailOutlined className="text-primary" />} placeholder="you@example.com" size="large" className="rounded-xl border-border h-12 text-sm" />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span className="text-darkPurple font-bold text-sm">Password</span>}
            rules={[
              { required: true, message: "Password is required" },
              { min: 8, message: "Password must be at least 8 characters" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-primary" />}
              placeholder="At least 8 characters"
              size="large"
              className="rounded-xl border-border h-12 text-sm"
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Item>

          {password && (
            <div className="mb-4 bg-background p-3 rounded-xl border border-border">
              <div className="flex justify-between items-center text-xs mb-1 font-bold text-darkPurple">
                <span>Password Strength:</span>
                <span className="text-primary">{strength.label}</span>
              </div>
              <Progress percent={strength.score} status={strength.status} showInfo={false} strokeColor={strength.score >= 75 ? "#10b981" : strength.score >= 40 ? "#AD49E1" : "#ef4444"} />
            </div>
          )}

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            block
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-95 text-white border-none rounded-xl font-bold h-12 shadow-lg shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 mt-2"
          >
            Create Account
          </Button>
        </Form>

        <p className="text-center text-sm text-text font-medium mt-6">
          Already have an account? <Link to="/login" className="text-primary font-bold hover:text-secondary">Sign in</Link>
        </p>
      </Card>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
    </div>
  );
};

export default Signup;
