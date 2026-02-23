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
    // Brown + Peach — #50311D
    return {
      pageBg: "#fdf6f0",
      blob1: "radial-gradient(circle, #f5dcc8 0%, transparent 70%)",
      blob2: "radial-gradient(circle, #ede0d4 0%, transparent 70%)",
      navBorder: "#d4a882",
      iconGradient: "linear-gradient(135deg, #50311D, #a0522d)",
      iconShadow: "0 8px 20px rgba(80,49,29,0.35)",
      cardBorder: "#d4a882",
      cardShadow: "0 4px 16px rgba(80,49,29,0.08)",
      badgeBg: "#fdf0e6",
      badgeBorder: "#d4a882",
      badgeColor: "#50311D",
      btnGradient: "linear-gradient(135deg, #50311D, #a0522d)",
      btnShadow: "0 6px 20px rgba(80,49,29,0.35)",
      btnShadowHover: "0 10px 28px rgba(80,49,29,0.45)",
      actionBg: "linear-gradient(135deg, #fdf6f0 0%, #f5dcc8 100%)",
      actionBorder: "#d4a882",
      accentText: "linear-gradient(135deg, #50311D, #a0522d)",
      statIconColor: "#50311D",
    };
  }

  // Student — Hot Chocolate + Gold Leaf
  // Deep chocolate brown bg, warm gold accents
  return {
    pageBg: "#1a0e08",                          // deep hot chocolate bg
    blob1: "radial-gradient(circle, #3b1f0e 0%, transparent 70%)",   // dark cocoa
    blob2: "radial-gradient(circle, #2a1505 0%, transparent 70%)",   // espresso
    navBorder: "#c9973a",                        // gold leaf border
    iconGradient: "linear-gradient(135deg, #b8762a, #f0c060)",       // gold gradient
    iconShadow: "0 8px 20px rgba(192,148,50,0.45)",
    cardBorder: "#c9973a",
    cardShadow: "0 4px 16px rgba(192,148,50,0.15)",
    badgeBg: "#2a1a08",
    badgeBorder: "#c9973a",
    badgeColor: "#f0c060",
    btnGradient: "linear-gradient(135deg, #b8762a, #f0c060)",
    btnShadow: "0 6px 20px rgba(192,148,50,0.4)",
    btnShadowHover: "0 10px 28px rgba(192,148,50,0.55)",
    actionBg: "linear-gradient(135deg, #2a1505 0%, #3b1f0e 100%)",
    actionBorder: "#c9973a",
    accentText: "linear-gradient(135deg, #c9973a, #f0c060)",
    statIconColor: "#f0c060",
    // card & text overrides for dark bg
    cardBg: "#241208",
    cardTextPrimary: "#f5e6c8",
    cardTextSecondary: "#9a7a5a",
    navBg: "rgba(26,14,8,0.92)",
    headingColor: "#f5e6c8",
    subTextColor: "#9a7a5a",
    welcomeNameColor: "linear-gradient(135deg, #c9973a, #f0c060)",
    statNumberColor: "#f5e6c8",
    statLabelColor: "#9a7a5a",
    inputBg: "#2a1505",
    inputBorder: "#c9973a",
    inputText: "#f5e6c8",
    outlineBtnBg: "#241208",
    outlineBtnText: "#f5e6c8",
    outlineBtnBorder: "#c9973a",
  };
};

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [showSigning, setShowSigning] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  if (!user) return null;

  const theme = getTheme(user.role || "student");
  const isStudent = (user.role || "student") === "student";

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

  // resolved values
  const cardBg = isStudent ? (theme as any).cardBg : "white";
  const cardTextPrimary = isStudent ? (theme as any).cardTextPrimary : "#0f172a";
  const cardTextSecondary = isStudent ? (theme as any).cardTextSecondary : "#94a3b8";
  const navBg = isStudent ? (theme as any).navBg : "rgba(255,255,255,0.90)";
  const headingColor = isStudent ? (theme as any).headingColor : "#0f172a";
  const subTextColor = isStudent ? (theme as any).subTextColor : "#64748b";
  const statNumberColor = isStudent ? (theme as any).statNumberColor : "#0f172a";
  const statLabelColor = isStudent ? (theme as any).statLabelColor : "#94a3b8";
  const inputBg = isStudent ? (theme as any).inputBg : "#f8fafc";
  const inputBorder = isStudent ? (theme as any).inputBorder : "#e2e8f0";
  const inputText = isStudent ? (theme as any).inputText : "#334155";
  const outlineBtnBg = isStudent ? (theme as any).outlineBtnBg : "white";
  const outlineBtnText = isStudent ? (theme as any).outlineBtnText : "#374151";
  const outlineBtnBorder = isStudent ? (theme as any).outlineBtnBorder : theme.cardBorder;

  return (
    <div style={{ background: theme.pageBg, position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>

      {/* Background blobs */}
      <div style={{ position: 'fixed', top: '-100px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: theme.blob1, zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-80px', left: '-80px', width: '420px', height: '420px', borderRadius: '50%', background: theme.blob2, zIndex: 0, pointerEvents: 'none' }} />

      {/* ── NAVBAR ── */}
      <div style={{ position: 'sticky', top: '16px', zIndex: 50, display: 'flex', justifyContent: 'center', padding: '0 24px' }}>
        <nav style={{
          width: '100%', maxWidth: '1100px',
          background: navBg,
          backdropFilter: 'blur(16px)',
          borderRadius: '16px',
          border: `1px solid ${theme.navBorder}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          padding: '12px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: theme.iconGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: theme.iconShadow }}>
              <FileSignature size={18} color={isStudent ? "#1a0e08" : "white"} />
            </div>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '19px', fontWeight: 700, color: cardTextPrimary }}>
              SignChain
            </span>
          </div>

          <div style={{ padding: '5px 14px', borderRadius: '999px', background: theme.badgeBg, border: `1px solid ${theme.badgeBorder}`, fontSize: '13px', fontWeight: 600, color: theme.badgeColor, textTransform: 'capitalize' }}>
            {user.role || 'Student'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => setShowBiometricSetup(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', color: subTextColor, transition: 'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.background = isStudent ? '#2a1505' : '#f1f5f9')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <Settings size={20} />
            </button>
            <button onClick={logout}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: `1px solid ${isStudent ? '#3b1f0e' : '#e2e8f0'}`, background: isStudent ? '#2a1505' : 'white', color: subTextColor, fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget.style.borderColor = '#fca5a5'); (e.currentTarget.style.color = '#ef4444'); }}
              onMouseLeave={e => { (e.currentTarget.style.borderColor = isStudent ? '#3b1f0e' : '#e2e8f0'); (e.currentTarget.style.color = subTextColor); }}
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
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, color: headingColor, marginBottom: '8px' }}>
            Welcome back,{' '}
            <span style={{ background: theme.accentText, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {user.name}
            </span>
          </h1>
          <p style={{ fontSize: '16px', color: subTextColor }}>
            Securely manage your digital identity and document signatures.
          </p>
        </div>

        {/* ── STAT CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>

          {/* Public Key */}
          {[
            {
              icon: <Key size={18} color={theme.statIconColor} />,
              label: "Public Key",
              content: (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, background: inputBg, borderRadius: '8px', padding: '8px 12px', fontFamily: 'monospace', fontSize: '12px', color: inputText, border: `1px solid ${inputBorder}`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.publicKey}
                  </div>
                  <button onClick={copyPublicKey} style={{ background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: '8px', padding: '8px', cursor: 'pointer' }}>
                    {copiedKey ? <Check size={15} color="#22c55e" /> : <Copy size={15} color={subTextColor} />}
                  </button>
                </div>
              )
            },
            {
              icon: <Shield size={18} color={theme.statIconColor} />,
              label: "Security",
              content: user.biometricSetup ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: cardTextPrimary }}>
                  {user.biometricType === "fingerprint" ? <Fingerprint size={18} color={theme.statIconColor} /> : <ScanFace size={18} color={theme.statIconColor} />}
                  <span>{user.biometricType === "fingerprint" ? "Fingerprint Enabled" : "Face Recognition Enabled"}</span>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '13px', color: cardTextSecondary, marginBottom: '12px' }}>Biometric authentication not configured.</p>
                  <button onClick={() => setShowBiometricSetup(true)}
                    style={{ padding: '7px 16px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}`, background: theme.badgeBg, color: theme.badgeColor, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                    Enable Now
                  </button>
                </div>
              )
            },
            {
              icon: <Activity size={18} color={theme.statIconColor} />,
              label: "Documents",
              content: (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div><p style={{ fontSize: '28px', fontWeight: 800, color: statNumberColor }}>0</p><p style={{ fontSize: '13px', color: statLabelColor }}>Pending</p></div>
                  <div><p style={{ fontSize: '28px', fontWeight: 800, color: statNumberColor }}>0</p><p style={{ fontSize: '13px', color: statLabelColor }}>Signed</p></div>
                </div>
              )
            }
          ].map((card, i) => (
            <div key={i} style={{ background: cardBg, borderRadius: '16px', border: `1px solid ${theme.cardBorder}`, boxShadow: theme.cardShadow, padding: '24px', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { (e.currentTarget.style.transform = 'translateY(-3px)'); (e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.2)'); }}
              onMouseLeave={e => { (e.currentTarget.style.transform = 'translateY(0)'); (e.currentTarget.style.boxShadow = theme.cardShadow); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                {card.icon}
                <span style={{ fontWeight: 700, fontSize: '15px', color: cardTextPrimary }}>{card.label}</span>
              </div>
              {card.content}
            </div>
          ))}
        </div>

        {/* ── ACTION PANEL ── */}
        <div style={{ background: theme.actionBg, borderRadius: '24px', border: `1px solid ${theme.actionBorder}`, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', padding: '48px 32px', textAlign: 'center' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: theme.iconGradient, boxShadow: theme.iconShadow, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Sparkles size={32} color={isStudent ? "#1a0e08" : "white"} />
          </div>

          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '28px', fontWeight: 800, color: headingColor, marginBottom: '12px' }}>
            Start Secure Signing
          </h2>
          <p style={{ fontSize: '15px', color: subTextColor, maxWidth: '520px', margin: '0 auto 32px', lineHeight: 1.7 }}>
            Upload documents and initiate secure signing workflows —
            self-signing, sequential approvals, or parallel signatures.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '14px' }}>
            <button onClick={handleStartSigning}
              style={{ padding: '13px 32px', borderRadius: '10px', border: 'none', background: theme.btnGradient, color: isStudent ? "#1a0e08" : "white", fontSize: '15px', fontWeight: 700, cursor: 'pointer', boxShadow: theme.btnShadow, transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget.style.transform = 'translateY(-2px)'); (e.currentTarget.style.boxShadow = theme.btnShadowHover); }}
              onMouseLeave={e => { (e.currentTarget.style.transform = 'translateY(0)'); (e.currentTarget.style.boxShadow = theme.btnShadow); }}
            >
              Start Signing
            </button>

            <button onClick={() => onNavigate("digital-signature")}
              style={{ padding: '13px 32px', borderRadius: '10px', border: `1.5px solid ${outlineBtnBorder}`, background: outlineBtnBg, color: outlineBtnText, fontSize: '15px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
              onMouseEnter={e => { (e.currentTarget.style.borderColor = theme.statIconColor); (e.currentTarget.style.color = theme.statIconColor); }}
              onMouseLeave={e => { (e.currentTarget.style.borderColor = outlineBtnBorder); (e.currentTarget.style.color = outlineBtnText); }}
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