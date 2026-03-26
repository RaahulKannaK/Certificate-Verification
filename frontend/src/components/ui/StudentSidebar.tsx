import React from "react";
import { Link } from "react-router-dom";
import {
    LayoutDashboard,
    ScanFace,
    User,
    LogOut,
    Menu,
    X,
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
    onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, user, logout, pathname, menuItems, onToggle }) => {

    const sidebarWidth = isOpen ? "260px" : "80px";

    return (
        <aside
            className={`transition-all duration-300 ease-in-out ${isOpen ? 'w-[260px]' : 'w-[80px]'} md:w-[260px]`}
            style={{
                backgroundColor: '#1e1a6b',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 50,
                boxShadow: 'none'
            }}
        >
            {/* Top Section */}
            <div style={{ 
                padding: '24px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: isOpen ? 'space-between' : 'center', 
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                minHeight: '82px'
            }}>
                <div className={`${isOpen ? 'flex' : 'hidden'} md:flex`} style={{ alignItems: 'center', gap: '12px' }}>
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
                    <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>Signemic</span>
                </div>

                <button
                    onClick={onToggle}
                    className="flex md:hidden"
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255,255,255,0.7)',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '8px',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                    {isOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Navigation Items */}
            <nav style={{ flex: 1, padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                                    padding: '14px 16px',
                                    borderRadius: '12px',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    textDecoration: 'none',
                                    color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
                                    background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                                    fontWeight: isActive ? 600 : 400,
                                    boxShadow: 'none'
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
                                <span className={`${isOpen ? 'inline' : 'hidden'} md:inline`}>{item.name}</span>
                            </Link>

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
                    <span className={`${isOpen ? 'inline' : 'hidden'} md:inline`}>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
