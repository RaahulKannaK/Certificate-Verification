import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BiometricSetup } from "./BiometricSetup";
import { DocumentSigningFlow } from "../signing/DocumentSigningFlow";
import {
  Copy, Check, LogOut, FileSignature, Shield, Key,
  Settings, Fingerprint, ScanFace, CreditCard, Sparkles, Activity,
} from "lucide-react";
import { toast } from "sonner";

interface DashboardProps {
  onNavigate: (view: "digital-signature") => void;
}

const getTheme = (role: string) => {
  if (role === "institution") {
    // Jungle Green family
    return {
      pageBg: "#f0faf4",
      blob1: "radial-gradient(circle, #bbf7d0 0%, transparent 70%)",
      blob2: "radial-gradient(circle, #d1fae5 0%, transparent 70%)",
      navBorder: "#e2e8f0",
      logoGradient: "linear-gradient(135deg, #16a34a, #059669)",
      logoShadow: "0 4px 12px rgba(22,163,74,0.30)",
      badgeBg: "#f0fdf4",
      badgeBorder: "#86efac",
      badgeColor: "#16a34a",
      btnGradient: "linear-gradient(135deg, #16a34a, #059669)",
      btnShadow: "0 6px 20px rgba(22,163,74,0.32)",
      btnShadowHover: "0 10px 28px rgba(22,163,74,0.44)",
      actionBg: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
      actionBorder: "#86efac",
      accentText: "linear-gradient(135deg, #16a34a, #059669)",
      statIconColor: "#16a34a",
      cardBorder: "#bbf7d0",
      cardShadow: "0 4px 16px rgba(22,163,74,0.06)",
      outlineBorderColor: "#86efac",
      outlineHoverColor: "#16a34a",
      cards: [
        { iconColor: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
        { iconColor: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
        { iconColor: "#0d9488", bg: "#f0fdfa", border: "#99f6e4" },
      ],
    };
  }

  // Student — Purple family
  return {
    pageBg: "#f5f3ff",
    blob1: "radial-gradient(circle, #ddd6fe 0%, transparent 70%)",
    blob2: "radial-gradient(circle, #ede9fe 0%, transparent 70%)",
    navBorder: "#e2e8f0",
    logoGradient: "linear-gradient(135deg, #7c3aed, #6366f1)",
    logoShadow: "0 4px 12px rgba(124,58,237,0.30)",
    badgeBg: "#f5f3ff",
    badgeBorder: "#c4b5fd",
    badgeColor: "#7c3aed",
    btnGradient: "linear-gradient(135deg, #7c3aed, #6366f1)",
    btnShadow: "0 6px 20px rgba(124,58,237,0.32)",
    btnShadowHover: "0 10px 28px rgba(124,58,237,0.44)",
    actionBg: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
    actionBorder: "#c4b5fd",
    accentText: "linear-gradient(135deg, #7c3aed, #6366f1)",
    statIconColor: "#7c3aed",
    cardBorder: "#ddd6fe",
    cardShadow: "0 4px 16px rgba(124,58,237,0.06)",
    outlineBorderColor: "#c4b5fd",
    outlineHoverColor: "#7c3aed",
    cards: [
      { iconColor: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
      { iconColor: "#6366f1", bg: "#eef2ff", border: "#c7d2fe" },
      { iconColor: "#8b5cf6", bg: "#faf5ff", border: "#e9d5ff" },
    ],
  };
};

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [showSigning, setShowSigning] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  if (!user) return null;

  const t = getTheme(user.role || "student");

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
      <div style={{ background: t.pageBg }} className="min-h-screen flex items-center justify-center p-6">
        <BiometricSetup onComplete={() => setShowBiometricSetup(false)} onSkip={() => setShowBiometricSetup(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: t.pageBg }}>

      {/* ── Background blobs — same as HeroSection ── */}
      <div style={{
        position: 'fixed', top: '-100px', right: '-100px',
        width: '500px', height: '500px', borderRadius: '50%',
        background: t.blob1, zIndex: 0, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '-80px', left: '-80px',
        width: '420px', height: '420px', borderRadius: '50%',
        background: t.blob2, zIndex: 0, pointerEvents: 'none',
      }} />

      {/* ── NAVBAR — exact HeroSection style ── */}
      <div style={{ position: 'sticky', top: '16px', left: 0, right: 0, zIndex: 50, display: 'flex', justifyContent: 'center', padding: '0 24px' }}>
        <nav style={{
          width: '100%', maxWidth: '1100px',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(16px)',
          borderRadius: '16px',
          border: `1px solid ${t.navBorder}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          transition: 'box-shadow 0.3s ease',
          padding: '12px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: t.logoGradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: t.logoShadow,
            }}>
              <FileSignature size={18} color="white" />
            </div>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '19px', fontWeight: 700, color: '#1e293b' }}>
              SignChain
            </span>
          </div>

          {/* Role Badge */}
          <div style={{
            padding: '5px 14px', borderRadius: '999px',
            background: t.badgeBg, border: `1px solid ${t.badgeBorder}`,
            fontSize: '13px', fontWeight: 600, color: t.badgeColor,
            textTransform: 'capitalize',
          }}>
            {user.role || 'Student'}
          </div>

          {/* Nav Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setShowBiometricSetup(true)}
              style={{
                padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0',
                background: 'white', color: '#374151', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget.style.background = '#f8fafc'); (e.currentTarget.style.borderColor = t.outlineBorderColor); }}
              onMouseLeave={e => { (e.currentTarget.style.background = 'white'); (e.currentTarget.style.borderColor = '#e2e8f0'); }}
            >
              <Settings size={16} color="#64748b" />
            </button>
            <button
              onClick={logout}
              style={{
                padding: '8px 20px', borderRadius: '8px',
                border: '1px solid #e2e8f0', background: 'white',
                color: '#374151', fontSize: '14px', fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
              onMouseEnter={e => { (e.currentTarget.style.borderColor = '#fca5a5'); (e.currentTarget.style.color = '#ef4444'); }}
              onMouseLeave={e => { (e.currentTarget.style.borderColor = '#e2e8f0'); (e.currentTarget.style.color = '#374151'); }}
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </nav>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', padding: '60px 24px 80px' }}>

        {/* Welcome Heading — same style as HeroSection h1 */}
        <div style={{ marginBottom: '48px' }}>
          <h1 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 800, lineHeight: 1.1,
            color: '#0f172a', marginBottom: '12px',
          }}>
            Welcome back,{' '}
            <span style={{
              background: t.accentText,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {user.name}
            </span>
          </h1>
          <p style={{ fontSize: '17px', color: '#64748b', lineHeight: 1.75, maxWidth: '540px' }}>
            Securely manage your digital identity and document signatures.
          </p>
        </div>

        {/* ── STAT CARDS — same style as HeroSection feature cards ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '22px', marginBottom: '32px',
        }}>

          {/* Public Key Card */}
          <div style={{
            background: 'white', borderRadius: '16px',
            border: `1px solid ${t.cards[0].border}`,
            padding: '28px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget.style.transform = 'translateY(-4px)'); (e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'); }}
            onMouseLeave={e => { (e.currentTarget.style.transform = 'translateY(0)'); (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.05)'); }}
          >
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: t.cards[0].bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Key size={22} color={t.cards[0].iconColor} />
            </div>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Public Key</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                flex: 1, background: '#f8fafc', borderRadius: '8px',
                padding: '8px 12px', fontFamily: 'monospace', fontSize: '12px',
                color: '#334155', border: '1px solid #e2e8f0',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {user.publicKey || user.walletPublicKey || '—'}
              </div>
              <button onClick={copyPublicKey}
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}>
                {copiedKey ? <Check size={14} color="#22c55e" /> : <Copy size={14} color="#64748b" />}
              </button>
            </div>
          </div>

          {/* Security Card */}
          <div style={{
            background: 'white', borderRadius: '16px',
            border: `1px solid ${t.cards[1].border}`,
            padding: '28px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget.style.transform = 'translateY(-4px)'); (e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'); }}
            onMouseLeave={e => { (e.currentTarget.style.transform = 'translateY(0)'); (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.05)'); }}
          >
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: t.cards[1].bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Shield size={22} color={t.cards[1].iconColor} />
            </div>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Security</h3>
            {user.biometricSetup ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#374151' }}>
                {user.biometricType === "fingerprint" ? <Fingerprint size={18} color={t.statIconColor} /> : <ScanFace size={18} color={t.statIconColor} />}
                <span>{user.biometricType === "fingerprint" ? "Fingerprint Enabled" : "Face Recognition Enabled"}</span>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.65, marginBottom: '14px' }}>Biometric authentication not configured.</p>
                <button onClick={() => setShowBiometricSetup(true)}
                  style={{ padding: '8px 18px', borderRadius: '8px', border: `1px solid ${t.cards[1].border}`, background: t.cards[1].bg, color: t.cards[1].iconColor, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  Enable Now
                </button>
              </div>
            )}
          </div>

          {/* Documents Card */}
          <div style={{
            background: 'white', borderRadius: '16px',
            border: `1px solid ${t.cards[2].border}`,
            padding: '28px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget.style.transform = 'translateY(-4px)'); (e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'); }}
            onMouseLeave={e => { (e.currentTarget.style.transform = 'translateY(0)'); (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.05)'); }}
          >
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: t.cards[2].bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Activity size={22} color={t.cards[2].iconColor} />
            </div>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Documents</h3>
            <div style={{ display: 'flex', gap: '28px' }}>
              <div>
                <p style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>0</p>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Pending</p>
              </div>
              <div style={{ width: '1px', background: '#e2e8f0' }} />
              <div>
                <p style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>0</p>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Signed</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── ACTION PANEL — same style as HeroSection CTA area ── */}
        <div style={{
          background: t.actionBg, borderRadius: '24px',
          border: `1px solid ${t.actionBorder}`,
          boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
          padding: '52px 32px', textAlign: 'center',
        }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '20px',
            background: t.btnGradient, boxShadow: t.btnShadow,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <Sparkles size={32} color="white" />
          </div>

          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
            Start Secure Signing
          </h2>
          <p style={{ fontSize: '17px', color: '#64748b', lineHeight: 1.75, maxWidth: '540px', margin: '0 auto 36px' }}>
            Upload documents and initiate secure signing workflows —
            self-signing, sequential approvals, or parallel signatures.
          </p>

          {/* CTA Buttons — exact HeroSection button style */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '14px' }}>
            <button
              onClick={handleStartSigning}
              style={{
                padding: '13px 32px', borderRadius: '10px', border: 'none',
                background: t.btnGradient, color: 'white',
                fontSize: '15px', fontWeight: 600, cursor: 'pointer',
                boxShadow: t.btnShadow, transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget.style.transform = 'translateY(-2px)'); (e.currentTarget.style.boxShadow = t.btnShadowHover); }}
              onMouseLeave={e => { (e.currentTarget.style.transform = 'translateY(0)'); (e.currentTarget.style.boxShadow = t.btnShadow); }}
            >
              Start Signing
            </button>
            <button
              onClick={() => onNavigate("digital-signature")}
              style={{
                padding: '13px 32px', borderRadius: '10px',
                border: `1.5px solid ${t.outlineBorderColor}`, background: 'white',
                color: '#374151', fontSize: '15px', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
              onMouseEnter={e => { (e.currentTarget.style.borderColor = t.outlineHoverColor); (e.currentTarget.style.color = t.outlineHoverColor); (e.currentTarget.style.background = '#fafaff'); }}
              onMouseLeave={e => { (e.currentTarget.style.borderColor = t.outlineBorderColor); (e.currentTarget.style.color = '#374151'); (e.currentTarget.style.background = 'white'); }}
            >
              <CreditCard size={16} /> View Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;