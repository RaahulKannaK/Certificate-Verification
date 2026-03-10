import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BiometricSetup } from "@/components/dashboard/BiometricSetup";
import { DocumentSigningFlow } from "@/components/signing/DocumentSigningFlow";
import Layout from "./layout";
import {
    Copy, Check, FileSignature, Shield, Key,
    Settings, Fingerprint, ScanFace, CreditCard, Sparkles, Activity,
} from "lucide-react";
import { toast } from "sonner";

const StudentPage: React.FC<{ onHome?: () => void }> = ({ onHome }) => {
    const { user } = useAuth();
    const [showBiometricSetup, setShowBiometricSetup] = useState(false);
    const [showSigning, setShowSigning] = useState(false);
    const [copiedKey, setCopiedKey] = useState(false);

    if (!user) return null;

    // Unified Brand — Dark Blue family (HeroSection style)
    const t = {
        blob1: "radial-gradient(circle, #ddd6fe 0%, transparent 70%)",
        blob2: "radial-gradient(circle, #ede9fe 0%, transparent 70%)",
        accentText: "linear-gradient(135deg, #1e1a6b, #2c258e)",
        btnGradient: "linear-gradient(135deg, #1e1a6b, #1e1a6b)",
        btnShadow: "0 6px 20px rgba(30,26,107,0.24)",
        btnShadowHover: "0 10px 28px rgba(30,26,107,0.36)",
        actionBg: "white",
        actionBorder: "#c4b5fd",
        outlineBorderColor: "#c4b5fd",
        outlineHoverColor: "#1e1a6b",
        cards: [
            { iconColor: "#1e1a6b", bg: "#f5f3ff", border: "#c4b5fd" },
            { iconColor: "#1e1a6b", bg: "#f5f3ff", border: "#c4b5fd" },
            { iconColor: "#1e1a6b", bg: "#f5f3ff", border: "#c4b5fd" },
        ],
    };

    const copyPublicKey = async () => {
        await navigator.clipboard.writeText(user.publicKey || user.walletPublicKey || "");
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
        toast.success("Public key copied!");
    };

    const handleStartSigning = () => {
        if (!user.biometricSetup) {
            toast.info("Please set up biometric authentication first");
            setShowBiometricSetup(true);
            return;
        }
        setShowSigning(true);
    };

    if (showSigning) return <DocumentSigningFlow onBack={() => setShowSigning(false)} />;

    if (showBiometricSetup) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <BiometricSetup onComplete={() => setShowBiometricSetup(false)} onSkip={() => setShowBiometricSetup(false)} />
            </div>
        );
    }

    return (
        <Layout>
            {/* Welcome Heading */}
            <div style={{ marginBottom: '48px' }}>
                <h1 style={{
                    fontSize: 'clamp(2rem, 4vw, 3rem)',
                    fontWeight: 800, lineHeight: 1.1,
                    color: '#0f172a', marginBottom: '12px',
                }}>
                    Welcome back
                </h1>
                <p style={{ fontSize: '17px', color: '#64748b', lineHeight: 1.75, maxWidth: '540px' }}>
                    Manage your account and sign your student credentials safely and easily.
                </p>
            </div>

            {/* STAT CARDS */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '22px', marginBottom: '32px',
            }}>
                {/* Public Key Card */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.45)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderRadius: '16px', border: `1px solid ${t.cards[0].border}`,
                    padding: '28px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', transition: 'all 0.2s'
                }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.05)'; }}
                >
                    <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: t.cards[0].bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                        <Key size={22} color={t.cards[0].iconColor} />
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Public Key</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, background: '#f8fafc', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#334155', border: '1px solid #e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.publicKey || user.walletPublicKey || '—'}
                        </div>
                        <button onClick={copyPublicKey} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}>
                            {copiedKey ? <Check size={14} color="#22c55e" /> : <Copy size={14} color="#64748b" />}
                        </button>
                    </div>
                </div>



                {/* Documents Card */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.45)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderRadius: '16px', border: `1px solid ${t.cards[2].border}`,
                    padding: '28px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', transition: 'all 0.2s'
                }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.05)'; }}
                >
                    <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: t.cards[2].bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                        <Activity size={22} color={t.cards[2].iconColor} />
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Documents</h3>
                    <div style={{ display: 'flex', gap: '28px' }}>
                        <div><p style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>0</p><p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Pending</p></div>
                        <div style={{ width: '1px', background: '#e2e8f0' }} />
                        <div><p style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>0</p><p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Signed</p></div>
                    </div>
                </div>
            </div>

            {/* ACTION PANEL */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.45)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: '24px', border: `1px solid ${t.actionBorder}`,
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)', padding: '52px 32px', textAlign: 'center'
            }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: t.btnGradient, boxShadow: t.btnShadow, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <Sparkles size={32} color="white" />
                </div>
                <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>Student Services</h2>
                <p style={{ fontSize: '17px', color: '#64748b', lineHeight: 1.75, maxWidth: '540px', margin: '0 auto 36px' }}>
                    Access your academic credentials and sign documents securely using your unique digital identity.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '14px' }}>
                    <button onClick={handleStartSigning} style={{ padding: '13px 32px', borderRadius: '10px', border: 'none', background: t.btnGradient, color: 'white', fontSize: '15px', fontWeight: 600, cursor: 'pointer', boxShadow: t.btnShadow, transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = t.btnShadowHover; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = t.btnShadow; }}
                    >Start Signing</button>
                    <button style={{ padding: '13px 32px', borderRadius: '10px', border: `1.5px solid ${t.outlineBorderColor}`, background: 'white', color: '#374151', fontSize: '15px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = t.outlineHoverColor; e.currentTarget.style.color = t.outlineHoverColor; e.currentTarget.style.background = '#fafaff'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = t.outlineBorderColor; e.currentTarget.style.color = '#374151'; e.currentTarget.style.background = 'white'; }}
                    ><CreditCard size={16} /> My Credentials</button>
                </div>
            </div>
        </Layout>
    );
};

export default StudentPage;
