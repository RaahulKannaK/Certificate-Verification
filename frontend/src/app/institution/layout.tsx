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
import { Link, useLocation, Navigate } from "react-router-dom";

import Sidebar from "@/components/ui/StudentSidebar";

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { user, logout } = useAuth();
    const { pathname } = useLocation();
    const [copiedKey, setCopiedKey] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    if (!user) return <Navigate to="/" replace />;

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
        { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/institution/dashboard" },
        { name: "Face Verification", icon: <ScanFace size={20} />, path: "/institution/verification" },
        { name: "Profile", icon: <User size={20} />, path: "/institution/profile" },
    ];

    return (
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
            <Sidebar 
                isOpen={isSidebarOpen} 
                user={user} 
                logout={logout} 
                pathname={pathname}
                menuItems={menuItems}
            />

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
                            {menuItems.find(item => pathname === item.path)?.name || "Institution Dashboard"}
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
                            <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>Institution Key:</span>
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
                                {(() => { const k = user.publicKey || user.walletPublicKey || ""; return k.length > 10 ? `${k.slice(0, 5)}...${k.slice(-5)}` : k || "—"; })()}
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
                                <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0, lineHeight: 1 }}>{user.name || "Institution"}</p>
                                <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0', lineHeight: 1 }}>Institution Account</p>
                            </div>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #16a34a, #047857)', // Green gradient for Institution
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: 700
                            }}>
                                {user.name ? user.name.charAt(0).toUpperCase() : "I"}
                            </div>
                        </div>
                    </div>
                </header>

                {/* ── SCROLLABLE CONTENT ── */}
                <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '4px 32px 32px', position: 'relative' }}>

                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Layout;
