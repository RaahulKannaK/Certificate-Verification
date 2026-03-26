import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
    User, Mail, Phone, Calendar, Key, Copy, Check,
    Lock, Eye, EyeOff, Shield, ChevronRight, Loader2
} from "lucide-react";
import { toast } from "sonner";

const InstitutionProfile: React.FC = () => {
    const { user } = useAuth();
    const [copiedKey, setCopiedKey] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    if (!user) return null;

    const fullName = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.name || "—";

    const copyKey = async () => {
        const key = user.walletPublicKey || user.publicKey || "";
        if (key) {
            await navigator.clipboard.writeText(key);
            setCopiedKey(true);
            setTimeout(() => setCopiedKey(false), 2000);
            toast.success("Public key copied!");
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            toast.error("New password must be at least 6 characters");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/change-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: user.email,
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword,
                }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            toast.success("Password updated successfully!");
            setShowPasswordForm(false);
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err: any) {
            toast.error(err.message || "Failed to change password");
        } finally {
            setIsSubmitting(false);
        }
    };

    const accent = "#1e1a6b"; // Blue accent
    const fields = [
        { icon: <User size={18} color={accent} />, label: "Institution Name", value: fullName },
        { icon: <Mail size={18} color={accent} />, label: "Email Address", value: user.email || "—" },
        { icon: <Phone size={18} color={accent} />, label: "Phone Number", value: user.phone || "—" },
        // { icon: <Calendar size={18} color={accent} />, label: "Established", value: "—" },
        { icon: <Shield size={18} color={accent} />, label: "Role", value: user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Institution" },
    ];

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'flex-start', 
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '40px 48px',
            textAlign: 'left'
        }}>
            {/* Page Header */}
            <div style={{ marginBottom: "40px", textAlign: "left" }}>
                <h1 style={{
                    fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 900,
                    color: "#0f172a", marginBottom: "10px",
                    fontFamily: "Space Grotesk, sans-serif",
                    letterSpacing: "-0.02em",
                }}>
                    Institution Profile
                </h1>
                <p style={{ fontSize: "15px", color: "#64748b", lineHeight: 1.6, maxWidth: "600px", margin: "0" }}>
                    Your institution's account information and security settings.
                </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "32px", width: "100%", maxWidth: "800px", textAlign: "left" }}>

                {/* Avatar + Name Banner */}
                <div style={{
                    display: "flex", alignItems: "center", gap: "20px",
                    background: "white", borderRadius: "20px",
                    padding: "24px 28px", border: "1px solid #e2e8f0",
                    boxShadow: "none",
                }}>
                    <div style={{
                        width: "60px", height: "60px", borderRadius: "50%",
                        background: `linear-gradient(135deg, ${accent}, #2c258e)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, boxShadow: "none",
                    }}>
                        <span style={{ fontSize: "24px", fontWeight: 800, color: "white" }}>
                            {fullName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginBottom: "6px" }}>{fullName}</h2>
                        <span style={{
                            display: "inline-block", padding: "3px 12px", borderRadius: "99px",
                            fontSize: "12px", fontWeight: 600,
                            background: "#ede9fe", color: accent, border: "1px solid #c4b5fd",
                        }}>
                            {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Institution"} Account
                        </span>
                    </div>
                </div>

                {/* Account Details */}
                <div style={{
                    background: "white", borderRadius: "20px",
                    border: "1px solid #e2e8f0", overflow: "hidden",
                    boxShadow: "none",
                }}>
                    <div style={{ padding: "20px 28px", borderBottom: "1px solid #f1f5f9" }}>
                        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>Account Details</h3>
                    </div>
                    <div style={{ padding: "4px 0" }}>
                        {fields.map((f, i) => (
                            <div key={i} style={{
                                display: "flex", alignItems: "center", gap: "14px",
                                padding: "14px 28px",
                                borderBottom: i < fields.length - 1 ? "1px solid #f8fafc" : "none",
                            }}>
                                <div style={{
                                    width: "36px", height: "36px", borderRadius: "10px",
                                    background: "#f5f3ff", display: "flex", alignItems: "center",
                                    justifyContent: "center", flexShrink: 0,
                                }}>
                                    {f.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500, marginBottom: "2px" }}>{f.label}</p>
                                    <p style={{ fontSize: "15px", color: "#0f172a", fontWeight: 600 }}>{f.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Public Key Card */}
                <div style={{
                    background: "white", borderRadius: "20px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "none",
                    padding: "20px 28px",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Key size={16} color={accent} />
                        </div>
                        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>Institution Key</h3>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                            flex: 1, background: "#f8fafc", borderRadius: "12px",
                            padding: "12px 16px", fontSize: "13px", color: "#334155",
                            border: "1px solid #e2e8f0", overflow: "hidden",
                            textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace",
                        }}>
                            {user.walletPublicKey || user.publicKey || "Not available"}
                        </div>
                        <button
                            onClick={copyKey}
                            style={{
                                width: "44px", height: "44px", borderRadius: "12px",
                                background: "white", border: "1px solid #e2e8f0",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", flexShrink: 0, transition: "all 0.2s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                            onMouseLeave={e => e.currentTarget.style.background = "white"}
                        >
                            {copiedKey ? <Check size={18} color="#22c55e" /> : <Copy size={18} color="#64748b" />}
                        </button>
                    </div>
                </div>

                {/* Change Password */}
                <div style={{
                    background: "white", borderRadius: "20px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "none",
                    overflow: "hidden",
                }}>
                    <button
                        onClick={() => setShowPasswordForm(!showPasswordForm)}
                        style={{
                            width: "100%", padding: "20px 28px",
                            display: "flex", alignItems: "center", gap: "14px",
                            background: "transparent", border: "none", cursor: "pointer",
                            textAlign: "left",
                            borderBottom: showPasswordForm ? "1px solid #f1f5f9" : "none",
                        }}
                    >
                        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Lock size={16} color="#d97706" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", marginBottom: "2px" }}>Change Password</p>
                            <p style={{ fontSize: "13px", color: "#64748b" }}>Update your account password</p>
                        </div>
                        <ChevronRight size={18} color="#94a3b8" style={{
                            transition: "transform 0.2s",
                            transform: showPasswordForm ? "rotate(90deg)" : "rotate(0deg)",
                        }} />
                    </button>

                    {showPasswordForm && (
                        <form onSubmit={handlePasswordChange} style={{ padding: "24px 32px" }}>
                            {[
                                { label: "Current Password", key: "currentPassword", show: showCurrent, toggle: () => setShowCurrent(!showCurrent) },
                                { label: "New Password", key: "newPassword", show: showNew, toggle: () => setShowNew(!showNew) },
                                { label: "Confirm New Password", key: "confirmPassword", show: showConfirm, toggle: () => setShowConfirm(!showConfirm) },
                            ].map(({ label, key, show, toggle }) => (
                                <div key={key} style={{ marginBottom: "16px" }}>
                                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "8px" }}>
                                        {label}
                                    </label>
                                    <div style={{ position: "relative" }}>
                                        <input
                                            type={show ? "text" : "password"}
                                            required
                                            value={(passwordForm as any)[key]}
                                            onChange={e => setPasswordForm(prev => ({ ...prev, [key]: e.target.value }))}
                                            style={{
                                                width: "100%", padding: "12px 44px 12px 16px",
                                                borderRadius: "12px", border: "1.5px solid #e2e8f0",
                                                fontSize: "14px", outline: "none", boxSizing: "border-box",
                                                transition: "border-color 0.2s",
                                            }}
                                            onFocus={e => e.currentTarget.style.borderColor = accent}
                                            onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"}
                                        />
                                        <button
                                            type="button"
                                            onClick={toggle}
                                            style={{
                                                position: "absolute", right: "14px", top: "50%",
                                                transform: "translateY(-50%)", background: "none",
                                                border: "none", cursor: "pointer", padding: 0,
                                            }}
                                        >
                                            {show ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                                <button
                                    type="button"
                                    onClick={() => { setShowPasswordForm(false); setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); }}
                                    style={{
                                        flex: 1, padding: "12px", borderRadius: "12px",
                                        border: "1.5px solid #e2e8f0", background: "white",
                                        fontSize: "14px", fontWeight: 600, color: "#64748b", cursor: "pointer",
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    style={{
                                        flex: 1, padding: "12px", borderRadius: "12px",
                                        border: "none", background: `linear-gradient(135deg, ${accent}, #2c258e)`,
                                        fontSize: "14px", fontWeight: 600, color: "white",
                                        cursor: isSubmitting ? "not-allowed" : "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                        opacity: isSubmitting ? 0.7 : 1,
                                        boxShadow: "none",
                                    }}
                                >
                                    {isSubmitting ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Updating...</> : "Update Password"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default InstitutionProfile;
