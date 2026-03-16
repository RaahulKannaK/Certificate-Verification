import React, { useState } from "react";
import Layout from "../layout";
import { BiometricSetup } from "../../../components/biometric/BiometricSetup";
import { useAuth } from "../../../contexts/AuthContext";
import { ScanFace, CheckCircle2, ShieldAlert, Shield } from "lucide-react";
import { Navigate } from "react-router-dom";

const StudentVerificationPage: React.FC = () => {
    const { user } = useAuth();
    const [showSetup, setShowSetup] = useState(false);

    if (!user) return <Navigate to="/" replace />;

    const isSetup = user.biometricSetup;

    if (showSetup) {
        return (
            <BiometricSetup
                onComplete={() => setShowSetup(false)}
                onSkip={() => setShowSetup(false)}
                onCancel={() => setShowSetup(false)}
            />
        );
    }

    return (
        <Layout>
            <div style={{ padding: '0 20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Page Header - Left Aligned */}
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{
                        fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
                        fontWeight: 900,
                        color: '#0f172a',
                        marginBottom: '10px',
                        fontFamily: 'Space Grotesk, sans-serif',
                        letterSpacing: '-0.02em',
                        background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        Face Verification
                    </h1>
                    <p style={{
                        fontSize: '15px',
                        color: '#64748b',
                        lineHeight: 1.6,
                        maxWidth: '500px',
                    }}>
                        Protect your account and enable document signing with biometric authentication.
                    </p>
                </div>

                {/* Status Card - Left Aligned & Smaller */}
                <div style={{
                    background: 'white',
                    borderRadius: '24px',
                    border: `1px solid ${isSetup ? '#86efac' : '#e2e8f0'}`,
                    padding: '36px 32px',
                    maxWidth: '480px',
                    boxShadow: isSetup
                        ? '0 10px 30px rgba(34,197,94,0.06)'
                        : '0 10px 30px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    textAlign: 'left',
                }}>
                    {/* Icon */}
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '18px',
                        background: isSetup ? '#f0fdf4' : '#f5f3ff',
                        border: `1px solid ${isSetup ? '#86efac' : '#ddd6fe'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '20px',
                    }}>
                        {isSetup
                            ? <CheckCircle2 size={32} color="#22c55e" />
                            : <ScanFace size={32} color="#7c3aed" />
                        }
                    </div>

                    {/* Status label */}
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 600,
                        background: isSetup ? '#f0fdf4' : '#fef9c3',
                        color: isSetup ? '#16a34a' : '#a16207',
                        border: `1px solid ${isSetup ? '#86efac' : '#fde68a'}`,
                        marginBottom: '16px',
                    }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isSetup ? '#22c55e' : '#eab308' }} />
                        {isSetup ? 'Biometric Setup Complete' : 'Setup Required'}
                    </span>

                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '10px', fontFamily: 'Space Grotesk, sans-serif' }}>
                        {isSetup ? 'Face Recognition Active' : 'Set Up Face Recognition'}
                    </h2>
                    <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.7, marginBottom: '28px' }}>
                        {isSetup
                            ? `Your biometric authentication is active (${user.biometricType || 'face'}). Use it to securely sign certificates.`
                            : 'You haven\'t set up biometric authentication yet. Secure your account and enable one-click signing.'
                        }
                    </p>

                    <button
                        onClick={() => setShowSetup(true)}
                        style={{
                            padding: '12px 32px',
                            borderRadius: '12px',
                            border: 'none',
                            background: isSetup ? '#1e1a6b' : 'linear-gradient(135deg, #1e1a6b, #1e1a6b)',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.background = isSetup ? '#161352' : '#161352';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.background = isSetup ? '#1e1a6b' : '#1e1a6b';
                        }}
                    >
                        {isSetup ? 'Re-setup Biometrics' : 'Enable Face Verification'}
                    </button>
                </div>
            </div>
        </Layout>
    );
};

export default StudentVerificationPage;
