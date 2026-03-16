import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import api from "../../../api/axios";
import { Wallet as EthersWallet } from "ethers";
import { theme } from "../../../theme/theme";
import Register, { RegisterFormData } from "../../../components/auth/Register";
import ThemeButton from "../../../components/ui/ThemeButton";

interface WalletKeys { publicKey: string; privateKey: string; }

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [walletKeys, setWalletKeys] = useState<WalletKeys | null>(null);
    const [copiedPublic, setCopiedPublic] = useState(false);
    const [copiedPrivate, setCopiedPrivate] = useState(false);
    const [showPrivateKey, setShowPrivateKey] = useState(false);

    const copy = async (text: string, type: "public" | "private") => {
        await navigator.clipboard.writeText(text);
        if (type === "public") { setCopiedPublic(true); setTimeout(() => setCopiedPublic(false), 2000); }
        else { setCopiedPrivate(true); setTimeout(() => setCopiedPrivate(false), 2000); }
        toast.success(`${type === "public" ? "Public" : "Private"} key copied`);
    };

    const handleSubmit = async (formData: RegisterFormData) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) { toast.error("Please enter a valid email address"); return; }
        if (formData.phone.length < 10) { toast.error("Please enter a valid 10-digit phone number"); return; }
        if (formData.role === "student" && !formData.rollNo) { toast.error("Please fill all mandatory fields"); return; }
        if (formData.role === "institution" && !formData.empId) { toast.error("Please fill all mandatory fields"); return; }
        if (formData.password !== formData.confirmPassword) { toast.error("Passwords do not match"); return; }
        if (formData.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }

        try {
            setLoading(true);
            const wallet = EthersWallet.createRandom();
            const keys: WalletKeys = { publicKey: wallet.address, privateKey: wallet.privateKey };
            const response = await api.post("/signup", {
                ...formData,
                walletPublicKey: keys.publicKey,
                walletPrivateKeyEncrypted: keys.privateKey,
            });
            setWalletKeys(keys);
            toast.success(response.data.message || "Account created successfully");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Signup failed");
        } finally {
            setLoading(false);
        }
    };

    /* ── Wallet Display Step ── */
    if (walletKeys) {
        return (
            <div style={{ background: theme.colors.background, minHeight: "100vh" }} className="flex items-center justify-center p-6">
                <div className="w-full max-w-lg">
                    <h1 style={{
                        fontFamily: "WeSignFont", fontSize: "2.5rem", fontWeight: 900,
                        background: `linear-gradient(135deg, ${theme.colors.brand}, ${theme.colors.brandDark})`,
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        marginBottom: "8px",
                    }}>Wallet Created!</h1>
                    <p style={{ color: "#64748b", marginBottom: "28px", fontSize: "15px" }}>
                        Save these keys securely. You will <strong>NOT</strong> be able to recover them later.
                    </p>

                    <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid #c4b5fd", padding: "28px" }} className="space-y-6">
                        {/* Public Key */}
                        <div>
                            <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "8px" }}>
                                Public Key (Wallet Address)
                            </label>
                            <div className="flex items-center gap-2">
                                <div style={{ background: theme.colors.background, border: "1px solid #e2e8f0", borderRadius: "10px" }}
                                    className="flex-1 p-3 font-mono text-xs break-all text-slate-700">
                                    {walletKeys.publicKey}
                                </div>
                                <button onClick={() => copy(walletKeys.publicKey, "public")}
                                    style={{ background: theme.colors.background, border: "1px solid #c4b5fd", borderRadius: "8px", padding: "8px", cursor: "pointer" }}>
                                    {copiedPublic ? <Check className="w-4 h-4 text-[#1e1a6b]" /> : <Copy className="w-4 h-4 text-slate-500" />}
                                </button>
                            </div>
                        </div>

                        {/* Private Key */}
                        <div>
                            <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "8px" }}>
                                Private Key <span style={{ color: "#ef4444" }}>(Keep Secret!)</span>
                            </label>
                            <div className="flex items-center gap-2">
                                <div style={{ background: theme.colors.background, border: "1px solid #e2e8f0", borderRadius: "10px" }}
                                    className="flex-1 p-3 font-mono text-xs break-all text-slate-700">
                                    {showPrivateKey ? walletKeys.privateKey : "•".repeat(66)}
                                </div>
                                <button onClick={() => setShowPrivateKey(!showPrivateKey)}
                                    style={{ background: theme.colors.background, border: "1px solid #c4b5fd", borderRadius: "8px", padding: "8px", cursor: "pointer" }}>
                                    {showPrivateKey ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
                                </button>
                                <button onClick={() => copy(walletKeys.privateKey, "private")}
                                    style={{ background: theme.colors.background, border: "1px solid #c4b5fd", borderRadius: "8px", padding: "8px", cursor: "pointer" }}>
                                    {copiedPrivate ? <Check className="w-4 h-4 text-[#1e1a6b]" /> : <Copy className="w-4 h-4 text-slate-500" />}
                                </button>
                            </div>
                            <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "8px" }}>
                                ⚠️ Never share your private key. Anyone with it can sign documents as you.
                            </p>
                        </div>

                        <button
                            onClick={() => navigate("/auth/login")}
                            className="w-full py-2.5 px-4 rounded-xl text-white font-bold transition-all hover:scale-[1.02]"
                            style={{ background: `linear-gradient(135deg, ${theme.colors.brand}, ${theme.colors.brandDark})`, border: "none", cursor: "pointer", fontSize: "14px" }}
                        >
                            Continue to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Registration Form Step ── */
    return (
        <div style={{ background: theme.colors.background, minHeight: "100vh" }} className="flex flex-col lg:flex-row overflow-hidden h-screen">
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
                        fontWeight: 900, lineHeight: 1.1,
                        background: `linear-gradient(135deg, ${theme.colors.brand}, ${theme.colors.brandDark})`,
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        backgroundClip: "text", marginBottom: "20px", letterSpacing: "-0.02em",
                    }}>
                        Register
                    </h1>
                    <p style={{ fontFamily: "WeSignFont", fontSize: "18px", color: "#1d1d1e", maxWidth: "450px", lineHeight: 1.6 }}>
                        Fill in your details to register the account.
                    </p>
                </div>
            </div>

            {/* ── RIGHT: Form Card ── */}
            <div className="w-full lg:w-1/2 lg:ml-[50%] flex justify-center items-center h-full p-4 sm:p-10">
                <div className="w-full max-w-lg">
                    <div style={{
                        background: "#ffffff", borderRadius: "20px",
                        border: "1px solid #c4b5fd", boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                        padding: "28px",
                    }}>
                        <Register onSubmit={handleSubmit} loading={loading} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
