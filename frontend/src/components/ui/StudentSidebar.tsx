import React from "react";
import { Link } from "react-router-dom";
import {
    LayoutDashboard,
    ScanFace,
    User,
    LogOut,
} from "lucide-react";

export interface MenuItem {
    name: string;
    icon: React.ReactNode;
    path: string;
}

interface SidebarProps {
    isOpen: boolean;
    user: any;
    logout: () => void;
    pathname: string;
    menuItems: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, user, logout, pathname, menuItems }) => {

    const sidebarWidth = isOpen ? "260px" : "80px";

    return (
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
                {isOpen && (
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
                                {isOpen && <span>{item.name}</span>}
                            </Link>

                            {isVerification && isOpen && user.biometricSetup && (
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
                    {isOpen && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
