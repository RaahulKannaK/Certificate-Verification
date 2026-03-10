import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
    LayoutDashboard,
    ScanFace,
    User,
    LogOut,
    Copy,
    Check,
    Menu,
    X,
    Shield
} from "lucide-react";
import { toast } from "sonner";
import { Link, useLocation } from "react-router-dom";

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { user, logout } = useAuth();
    const { pathname } = useLocation();
    const [copiedKey, setCopiedKey] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    if (!user) return null;

    const copyPublicKey = async () => {
        const key = user.publicKey || user.walletPublicKey || "";
        if (key) {
            await navigator.clipboard.writeText(key);
            setCopiedKey(true);
            setTimeout(() => setCopiedKey(false), 2000);
            toast.success("Public key copied!");
        }
    };

    const menuItems = [
        { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/student" },
        { name: "Face Verification", icon: <ScanFace size={20} />, path: "/student/verification" },
        { name: "Profile", icon: <User size={20} />, path: "/student/profile" },
    ];

    const sidebarWidth = isSidebarOpen ? "260px" : "80px";

    return (
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
            {/* ── SIDEBAR ── */}
            <aside
                style={{
                    width: sidebarWidth,
                    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    backgroundColor: '#1e1a6b',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 50,
                    boxShadow: '4px 0 10px rgba(0,0,0,0.05)'
                }}
            >
                {/* Logo Section */}
                <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{
                        minWidth: '32px',
                        height: '32px',
                        background: 'white',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                    }}>
                        <img src="/images/logo.png" alt="Signemic Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    {isSidebarOpen && (
                        <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>Signemic</span>
                    )}
                </div>

                {/* Navigation Items */}
                <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {menuItems.map((item) => {
                        const isActive = pathname === item.path;
                        const isVerification = item.name === "Face Verification";
                        return (
                            <div key={item.name} style={{ display: 'flex', flexDirection: 'column' }}>
                                <Link
                                    to={item.path}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px',
                                        borderRadius: '10px',
                                        transition: 'all 0.2s',
                                        textDecoration: 'none',
                                        color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
                                        background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                                        fontWeight: isActive ? 600 : 400
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                            e.currentTarget.style.color = 'white';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                                        }
                                    }}
                                >
                                    <div style={{ minWidth: '20px' }}>{item.icon}</div>
                                    {isSidebarOpen && <span>{item.name}</span>}
                                </Link>

                                {isVerification && isSidebarOpen && user.biometricSetup && (
                                    <div style={{
                                        paddingLeft: '44px',
                                        paddingBottom: '8px',
                                        marginTop: '-4px'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            fontSize: '11px',
                                            color: '#22c55e',
                                            fontWeight: 500
                                        }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                                            Face Recognition Enabled
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Logout Button */}
                <div style={{ padding: '20px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <button
                        onClick={logout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            width: '100%',
                            borderRadius: '10px',
                            background: 'transparent',
                            border: 'none',
                            color: 'rgba(255,255,255,0.7)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            textAlign: 'left'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                            e.currentTarget.style.color = '#ef4444';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                        }}
                    >
                        <LogOut size={20} />
                        {isSidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* ── MAIN CONTENT AREA ── */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                {/* ── HEADER ── */}
                <header
                    style={{
                        height: '72px',
                        background: 'white',
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 24px',
                        zIndex: 40
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#64748b',
                                cursor: 'pointer',
                                padding: '8px',
                                borderRadius: '8px',
                                display: 'flex'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
                            {menuItems.find(item => pathname === item.path)?.name || "Dashboard"}
                        </h2>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#f8fafc',
                            padding: '6px 12px',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0'
                        }}>
                            <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>Public Key:</span>
                            <span style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#0f172a',
                                maxWidth: '150px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontFamily: 'monospace'
                            }}>
                                {user.publicKey || user.walletPublicKey || "—"}
                            </span>
                            <button
                                onClick={copyPublicKey}
                                style={{
                                    background: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    padding: '4px',
                                    cursor: 'pointer',
                                    display: 'flex'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                onMouseLeave={e => e.currentTarget.style.background = 'white'}
                            >
                                {copiedKey ? <Check size={14} color="#22c55e" /> : <Copy size={14} color="#64748b" />}
                            </button>
                        </div>

                        <div style={{ width: '1px', height: '24px', background: '#e2e8f0', margin: '0 4px' }} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ textAlign: 'right' }} className="hidden md:block">
                                <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0, lineHeight: 1 }}>{user.name || "Student"}</p>
                                <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0', lineHeight: 1 }}>Student Account</p>
                            </div>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #1e1a6b, #4338ca)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: 700
                            }}>
                                {user.name ? user.name.charAt(0).toUpperCase() : "S"}
                            </div>
                        </div>
                    </div>
                </header>

                {/* ── SCROLLABLE CONTENT ── */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '32px', position: 'relative' }}>
                    {/* Background decorations */}
                    <div style={{
                        position: 'absolute',
                        top: '-10%',
                        right: '-10%',
                        width: '400px',
                        height: '400px',
                        background: 'radial-gradient(circle, rgba(30,26,107,0.03) 0%, transparent 70%)',
                        zIndex: -1
                    }} />

                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Layout;

