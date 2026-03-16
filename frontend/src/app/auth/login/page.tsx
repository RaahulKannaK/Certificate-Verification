import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import api from "../../../api/axios";
import { theme } from "../../../theme/theme";
import Login, { LoginFormData } from "../../../components/auth/Login";
import ThemeButton from "../../../components/ui/ThemeButton";

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (formData: LoginFormData) => {
        if (!formData.email.trim()) { toast.error("Please enter your email"); return; }
        if (!formData.password.trim()) { toast.error("Please enter your password"); return; }
        if (!formData.publicKey.trim()) { toast.error("Please enter your public key"); return; }

        try {
            setLoading(true);
            const res = await api.post(`${import.meta.env.VITE_API_URL}/login`, {
                email: formData.email.trim(),
                password: formData.password,
                publicKey: formData.publicKey.trim(),
            });

            const data = res.data;
            if (data.user) {
                const success = await login({
                    email: formData.email.trim(),
                    password: formData.password,
                    publicKey: formData.publicKey.trim(),
                    userData: data.user,
                });
                if (success) {
                    toast.success("Login successful!");
                    navigate(data.user?.role === "institution" ? "/institution/dashboard" : "/student/dashboard");
                } else {
                    toast.error("Failed to set user context");
                }
            } else {
                toast.error("Invalid credentials. Please check and try again.");
            }
        } catch (err: any) {
            if (err?.response?.status === 401) toast.error("Invalid password");
            else if (err?.response?.status === 404) toast.error("User not found. Check your email and public key.");
            else toast.error(err?.response?.data?.message || "Server error during login");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{ background: theme.colors.background, minHeight: "100vh" }}
            className="flex flex-col lg:flex-row overflow-hidden h-screen"
        >
            {/* ── LEFT: Branding Panel ── */}
            <div className="w-full lg:w-1/2 flex flex-col p-8 sm:p-12 lg:p-20 lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:justify-start">
                <div className="flex flex-col items-start gap-6 mb-8 lg:mb-16">
                    <ThemeButton onClick={() => navigate("/")} showIcon={false} className="!px-4 !py-1.5 !text-xs !border-[#1e1a6b]/20">
                        <ArrowLeft size={14} className="mr-1" /> Back to Home
                    </ThemeButton>
                    <div className="flex items-center gap-4">
                        <img src="/images/logo.png" alt="SigNemic Logo" className="h-10 sm:h-12 w-auto object-contain" />
                        <span style={{ fontSize: "25px", fontWeight: 700, color: theme.colors.brand, fontFamily: "WeSignFont" }}>
                            SigNemic
                        </span>
                    </div>
                </div>
                <div className="flex flex-col items-start lg:flex-grow lg:justify-start lg:pt-12 lg:pl-12">
                    <h1 style={{
                        fontFamily: "WeSignFont",
                        fontSize: "clamp(3.5rem, 8vw, 6rem)",
                        fontWeight: 900,
                        lineHeight: 1.1,
                        background: `linear-gradient(135deg, ${theme.colors.brand}, ${theme.colors.brandDark})`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        marginBottom: "20px",
                        letterSpacing: "-0.02em",
                    }}>
                        Login
                    </h1>
                    <p style={{ fontFamily: "WeSignFont", fontSize: "18px", color: "#1d1d1e", maxWidth: "450px", lineHeight: 1.6 }}>
                        Enter your public key to access your dashboard (student or institution)
                    </p>
                </div>
            </div>

            {/* ── RIGHT: Form Card ── */}
            <div className="w-full lg:w-1/2 lg:ml-[50%] flex justify-center items-center h-full p-4 sm:p-10">
                <div className="w-full max-w-lg">
                    <div style={{
                        background: "#ffffff",
                        borderRadius: "20px",
                        border: "1px solid #c4b5fd",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                        padding: "28px",
                    }}>
                        <Login onSubmit={handleSubmit} loading={loading} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
