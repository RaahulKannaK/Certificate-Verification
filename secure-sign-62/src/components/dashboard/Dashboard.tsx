import React, { useState } from "react";
import { Button } from "@/components/ui/button";
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

/* ── Role-based theme ── */
const getTheme = (role: string) => {
  if (role === "institution") {
    return {
      // Rose/Pink theme
      pageBg: "#fff5f5",
      blob1: "radial-gradient(circle, #ffe4e6 0%, transparent 70%)",
      blob2: "radial-gradient(circle, #fce7f3 0%, transparent 70%)",
      navBg: "rgba(255,255,255,0.88)",
      navBorder: "#fecdd3",
      iconGradient: "linear-gradient(135deg, #f43f5e, #ec4899)",
      iconShadow: "0 8px 20px rgba(244,63,94,0.35)",
      cardBorder: "#fecdd3",
      cardShadow: "0 4px 16px rgba(244,63,94,0.08)",
      badgeBg: "#fff1f2",
      badgeBorder: "#fecdd3",
      badgeColor: "#f43f5e",
      btnGradient: "linear-gradient(135deg, #f43f5e, #ec4899)",
      btnShadow: "0 6px 20px rgba(244,63,94,0.35)",
      btnShadowHover: "0 10px 28px rgba(244,63,94,0.45)",
      actionBg: "linear-gradient(135deg, #fff1f2 0%, #fce7f3 100%)",
      actionBorder: "#fecdd3",
      accentText: "linear-gradient(135deg, #f43f5e, #ec4899)",
      statIconColor: "#f43f5e",
    };
  }
  // Default: Student — Blue/Indigo theme
  return {
    pageBg: "#f0f4f8",
    blob1: "radial-gradient(circle, #dbeafe 0%, transparent 70%)",
    blob2: "radial-gradient(circle, #ede9fe 0%, transparent 70%)",
    navBg: "rgba(255,255,255,0.88)",
    navBorder: "#bfdbfe",
    iconGradient: "linear-gradient(135deg, #3b82f6, #6366f1)",
    iconShadow: "0 8px 20px rgba(99,102,241,0.35)",
    cardBorder: "#bfdbfe",
    cardShadow: "0 4px 16px rgba(99,102,241,0.08)",
    badgeBg: "#eff6ff",
    badgeBorder: "#bfdbfe",
    badgeColor: "#3b82f6",
    btnGradient: "linear-gradient(135deg, #3b82f6, #6366f1)",
    btnShadow: "0 6px 20px rgba(99,102,241,0.35)",
    btnShadowHover: "0 10px 28px rgba(99,102,241,0.45)",
    actionBg: "linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)",
    actionBorder: "#bfdbfe",
    accentText: "linear-gradient(135deg, #3b82f6, #6366f1)",
    statIconColor: "#3b82f6",
  };
};

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [showSigning, setShowSigning] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  if (!user) return null;

  const theme = getTheme(user.role || "student");

  const copyPublicKey = async () => {
    await navigator.clipboard.writeText(user.publicKey);
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
      <div style={{ background: theme.pageBg }} className="min-h-screen flex items-center justify-center p-6">
        <BiometricSetup onComplete={() => setShowBiometricSetup(false)} onSkip={() => setShowBiometricSetup(false)} />
      </div>
    );
  }

  return (
    <div style={{ background: theme.pageBg, position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>

      {/* Background blobs */}
      <div style={{
        position: 'fixed', top: '-100px', right: '-100px',
        width: '500px', height: '500px', borderRadius: '50%',
        background: theme.blob1, zIndex: 0, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '-80px', left: '-80px',
        width: '420px', height: '420px', borderRadius: '50%',
        background: theme.blob2, zIndex: 0, pointerEvents: 'none',
      }} />

      {/* ── NAVBAR ── */}
      <div style={{ position: 'sticky', top: '16px', zIndex: 50, display: 'flex', justifyContent: 'center', padding: '0 24px' }}>
        <nav style={{
          width: '100%', maxWidth: '1100px',
          background: theme.navBg,
          backdropFilter: 'blur(16px)',
          borderRadius: '16px',
          border: `1px solid ${theme.navBorder}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          padding: '12px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: theme.iconGradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: theme.iconShadow,
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
            background: theme.badgeBg, border: `1px solid ${theme.badgeBorder}`,
            fontSize: '13px', fontWeight: 600, color: theme.badgeColor,
            textTransform: 'capitalize',
          }}>
            {user.role || 'Student'}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setShowBiometricSetup(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', color: '#64748b', transition: 'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <Settings size={20} />
            </button>
            <button
              onClick={logout}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0',
                background: 'white', color: '#64748b', fontSize: '14px', fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget.style.borderColor = '#fca5a5'); (e.currentTarget.style.color = '#ef4444'); }}
              onMouseLeave={e => { (e.currentTarget.style.borderColor = '#e2e8f0'); (e.currentTarget.style.color = '#64748b'); }}
            >
              <LogOut size={15} /> Logout
            </button>
          </div>
        </nav>
      </div>

      {/* ── MAIN ── */}
      <main style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 60px' }}>

        {/* Welcome */}
        <div style={{ marginBottom: '36px' }}>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            Welcome back,{' '}
            <span style={{ background: theme.accentText, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {user.name}
            </span>
          </h1>
          <p style={{ fontSize: '16px', color: '#64748b' }}>
            Securely manage your digital identity and document signatures.
          </p>
        </div>

        {/* ── STAT CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>

          {/* Public Key */}
          <div style={{
            background: 'white', borderRadius: '16px',
            border: `1px solid ${theme.cardBorder}`,
            boxShadow: theme.cardShadow, padding: '24px',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget.style.transform = 'translateY(-3px)'); (e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'); }}
            onMouseLeave={e => { (e.currentTarget.style.transform = 'translateY(0)'); (e.currentTarget.style.boxShadow = theme.cardShadow); }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Key size={18} color={theme.statIconColor} />
              <span style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>Public Key</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                flex: 1, background: '#f8fafc', borderRadius: '8px',
                padding: '8px 12px', fontFamily: 'monospace', fontSize: '12px',
                color: '#334155', border: '1px solid #e2e8f0',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {user.publicKey}
              </div>
              <button
                onClick={copyPublicKey}
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}
              >
                {copiedKey ? <Check size={15} color="#22c55e" /> : <Copy size={15} color="#64748b" />}
              </button>
            </div>
          </div>

          {/* Security */}
          <div style={{
            background: 'white', borderRadius: '16px',
            border: `1px solid ${theme.cardBorder}`,
            boxShadow: theme.cardShadow, padding: '24px',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget.style.transform = 'translateY(-3px)'); (e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'); }}
            onMouseLeave={e => { (e.currentTarget.style.transform = 'translateY(0)'); (e.currentTarget.style.boxShadow = theme.cardShadow); }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Shield size={18} color={theme.statIconColor} />
              <span style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>Security</span>
            </div>
            {user.biometricSetup ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#374151' }}>
                {user.biometricType === "fingerprint"
                  ? <Fingerprint size={18} color={theme.statIconColor} />
                  : <ScanFace size={18} color={theme.statIconColor} />}
                <span>{user.biometricType === "fingerprint" ? "Fingerprint Enabled" : "Face Recognition Enabled"}</span>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>Biometric authentication not configured.</p>
                <button
                  onClick={() => setShowBiometricSetup(true)}
                  style={{
                    padding: '7px 16px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}`,
                    background: theme.badgeBg, color: theme.badgeColor,
                    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Enable Now
                </button>
              </div>
            )}
          </div>

          {/* Documents */}
          <div style={{
            background: 'white', borderRadius: '16px',
            border: `1px solid ${theme.cardBorder}`,
            boxShadow: theme.cardShadow, padding: '24px',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget.style.transform = 'translateY(-3px)'); (e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'); }}
            onMouseLeave={e => { (e.currentTarget.style.transform = 'translateY(0)'); (e.currentTarget.style.boxShadow = theme.cardShadow); }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Activity size={18} color={theme.statIconColor} />
              <span style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>Documents</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>0</p>
                <p style={{ fontSize: '13px', color: '#94a3b8' }}>Pending</p>
              </div>
              <div>
                <p style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>0</p>
                <p style={{ fontSize: '13px', color: '#94a3b8' }}>Signed</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── ACTION PANEL ── */}
        <div style={{
          background: theme.actionBg,
          borderRadius: '24px',
          border: `1px solid ${theme.actionBorder}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          padding: '48px 32px',
          textAlign: 'center',
        }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '20px',
            background: theme.iconGradient,
            boxShadow: theme.iconShadow,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <Sparkles size={32} color="white" />
          </div>

          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
            Start Secure Signing
          </h2>
          <p style={{ fontSize: '15px', color: '#64748b', maxWidth: '520px', margin: '0 auto 32px', lineHeight: 1.7 }}>
            Upload documents and initiate secure signing workflows —
            self-signing, sequential approvals, or parallel signatures.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '14px' }}>
            <button
              onClick={handleStartSigning}
              style={{
                padding: '13px 32px', borderRadius: '10px', border: 'none',
                background: theme.btnGradient, color: 'white',
                fontSize: '15px', fontWeight: 600, cursor: 'pointer',
                boxShadow: theme.btnShadow, transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget.style.transform = 'translateY(-2px)'); (e.currentTarget.style.boxShadow = theme.btnShadowHover); }}
              onMouseLeave={e => { (e.currentTarget.style.transform = 'translateY(0)'); (e.currentTarget.style.boxShadow = theme.btnShadow); }}
            >
              Start Signing
            </button>

            <button
              onClick={() => onNavigate("digital-signature")}
              style={{
                padding: '13px 32px', borderRadius: '10px',
                border: `1.5px solid ${theme.cardBorder}`, background: 'white',
                color: '#374151', fontSize: '15px', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
              onMouseEnter={e => { (e.currentTarget.style.borderColor = theme.statIconColor); (e.currentTarget.style.color = theme.statIconColor); }}
              onMouseLeave={e => { (e.currentTarget.style.borderColor = theme.cardBorder); (e.currentTarget.style.color = '#374151'); }}
            >
              <CreditCard size={16} /> View Credentials
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;