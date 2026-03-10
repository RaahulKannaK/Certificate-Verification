import React, { useState, useEffect } from "react";
import { Menu, X, LogOut, Settings, FileSignature } from "lucide-react";
import { theme } from "@/theme/theme";
import Button from "@/components/context/Button";
import { useAuth } from "@/contexts/AuthContext";

interface NavbarProps {
    isLanding?: boolean;
    onHome?: () => void;
    onCreateAccount?: () => void;
    onLogin?: () => void;
    onNavigateToStudent?: () => void;
    onNavigateToInstitution?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
    isLanding = false,
    onHome,
    onCreateAccount,
    onLogin,
    onNavigateToStudent,
    onNavigateToInstitution,
}) => {
    const { user, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleStudentClick = () => {
        if (!user) {
            onLogin?.();
            return;
        }
        if (user.role === "student") {
            onNavigateToStudent?.();
        } else {
            alert("Please log in as a student to access the student dashboard");
            onLogin?.();
        }
    };

    const handleInstitutionClick = () => {
        if (!user) {
            onLogin?.();
            return;
        }
        if (user.role === "institution") {
            onNavigateToInstitution?.();
        } else {
            alert("Please log in as an institution to access the institution dashboard");
            onLogin?.();
        }
    };

    const navLinks = isLanding
        ? [
            { label: "Student", onClick: handleStudentClick },
            { label: "Institution", onClick: handleInstitutionClick },
        ]
        : [];

    return (
        <div style={{
            position: "fixed",
            top: "16px", left: 0, right: 0, zIndex: 100,
            display: "flex", justifyContent: "center", padding: "0 24px"
        }}>
            <nav style={{
                width: "100%",
                maxWidth: "1100px",
                background: "#ffffff",
                backdropFilter: "blur(12px)",
                borderRadius: "16px",
                border: "1px solid rgba(30, 26, 107, 0.1)",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
                transition: "all 0.3s ease",
                padding: "12px 28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                position: "relative",
            }}>

                {/* ── Logo (left) ── */}
                <div
                    style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
                    onClick={() => {
                        if (onHome) onHome();
                        else window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                >
                    <img
                        src="/images/logo.png"
                        alt="SigNemic Logo"
                        style={{
                            height: '38px',
                            width: 'auto',
                            objectFit: 'contain',
                            pointerEvents: 'none',
                            userSelect: 'none'
                        }}
                    />
                    <span style={{ fontSize: "19px", fontWeight: 700, color: theme.colors.brand, userSelect: "none" }}>
                        SigNemic
                    </span>
                </div>

                {/* ── Nav Links (Center) ── */}
                {isLanding && (
                    <div
                        className="hidden md:flex"
                        style={{
                            position: "absolute",
                            left: "50%",
                            transform: "translateX(-50%)",
                            display: "flex",
                            alignItems: "center",
                            gap: "40px",
                        }}
                    >
                        {navLinks.map((link) => (
                            <button
                                key={link.label}
                                onClick={link.onClick}
                                className="nav-link-hover"
                                style={{
                                    fontSize: "15px",
                                    fontWeight: 700,
                                    color: "rgba(30, 26, 107, 0.7)",
                                    background: "none",
                                    border: "none",
                                    padding: "4px 0",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    letterSpacing: "0.02em",
                                    position: "relative",
                                }}
                                onMouseEnter={e => (e.currentTarget.style.color = theme.colors.brand)}
                                onMouseLeave={e => (e.currentTarget.style.color = "rgba(30, 26, 107, 0.7)")}
                            >
                                {link.label}
                                <span className="underline-effect" style={{
                                    position: "absolute",
                                    bottom: 0,
                                    left: 0,
                                    width: "0%",
                                    height: "2px",
                                    background: theme.colors.brand,
                                    transition: "width 0.3s ease",
                                }} />
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Role Badge (Dashboard Center) ── */}
                {!isLanding && user && (
                    <div
                        className="hidden md:block"
                        style={{
                            position: "absolute",
                            left: "50%",
                            transform: "translateX(-50%)",
                        }}
                    >
                        <div style={{
                            padding: "5px 14px", borderRadius: "999px",
                            background: "rgba(255, 255, 255, 0.5)",
                            border: `1px solid #c4b5fd`,
                            fontSize: "13px", fontWeight: 600,
                            color: "#1e1a6b",
                            textTransform: "capitalize",
                        }}>
                            {user.role}
                        </div>
                    </div>
                )}

                {/* ── Auth/Nav Actions (Right) ── */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {isLanding ? (
                        <div className="hidden md:flex" style={{ gap: "15px" }}>
                            <Button onClick={onLogin} showIcon={false} className="!px-6 !py-2">Login</Button>
                            <Button onClick={onCreateAccount} showIcon={false} className="!px-6 !py-2">Register</Button>
                        </div>
                    ) : (
                        <>
                            <button
                                style={{
                                    padding: "10px", borderRadius: "10px", border: `1px solid rgba(30, 26, 107, 0.1)`,
                                    background: "rgba(30, 26, 107, 0.05)", color: theme.colors.brand, cursor: "pointer", transition: "all 0.2s",
                                }}
                                onMouseEnter={e => { (e.currentTarget.style.background = "rgba(30, 26, 107, 0.12)"); (e.currentTarget.style.borderColor = "rgba(30, 26, 107, 0.2)"); }}
                                onMouseLeave={e => { (e.currentTarget.style.background = "rgba(30, 26, 107, 0.05)"); (e.currentTarget.style.borderColor = "rgba(30, 26, 107, 0.1)"); }}
                            >
                                <Settings size={20} />
                            </button>
                            <button
                                onClick={logout}
                                style={{
                                    padding: "8px 16px", borderRadius: "8px", border: `1px solid rgba(30, 26, 107, 0.1)`,
                                    background: "rgba(30, 26, 107, 0.05)", color: theme.colors.brand,
                                    cursor: "pointer", transition: "all 0.2s",
                                    fontSize: "13px", fontWeight: 600,
                                    display: "flex", alignItems: "center", gap: "6px",
                                }}
                                onMouseEnter={e => { (e.currentTarget.style.borderColor = "#fca5a5"); (e.currentTarget.style.color = "#ef4444"); (e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)"); }}
                                onMouseLeave={e => { (e.currentTarget.style.borderColor = "rgba(30, 26, 107, 0.1)"); (e.currentTarget.style.color = theme.colors.brand); (e.currentTarget.style.background = "rgba(30, 26, 107, 0.05)"); }}
                            >
                                <LogOut size={14} /> Logout
                            </button>
                        </>
                    )}

                    {/* Mobile Hamburger */}
                    <button
                        className="md:hidden"
                        onClick={() => setMenuOpen(!menuOpen)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: theme.colors.brand }}
                    >
                        {menuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {menuOpen && (
                    <div style={{
                        position: "fixed", top: "80px", left: "24px", right: "24px", zIndex: 49,
                        background: "#fff", backdropFilter: "blur(16px)",
                        borderRadius: "14px", border: "1px solid rgba(30, 26, 107, 0.1)",
                        padding: "16px 20px",
                        display: "flex", flexDirection: "column", gap: "10px",
                        boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                    }}>
                        {navLinks.map((link) => (
                            <button
                                key={link.label}
                                onClick={() => { link.onClick(); setMenuOpen(false); }}
                                style={{
                                    fontSize: "16px", fontWeight: 700,
                                    color: theme.colors.brand, textAlign: "left", background: "none",
                                    border: "none", padding: "10px 0", cursor: "pointer",
                                }}
                            >
                                {link.label}
                            </button>
                        ))}
                        {isLanding && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
                                <Button onClick={() => { onLogin?.(); setMenuOpen(false); }} showIcon={false} className="!w-full">Login</Button>
                                <Button onClick={() => { onCreateAccount?.(); setMenuOpen(false); }} showIcon={false} className="!w-full">Register</Button>
                            </div>
                        )}
                        {!isLanding && user && (
                            <Button onClick={() => { logout(); setMenuOpen(false); }} showIcon={false} className="!w-full">Logout</Button>
                        )}
                    </div>
                )}
            </nav>
        </div>
    );
};

export default Navbar;
