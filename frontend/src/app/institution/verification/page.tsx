import React, { useState } from "react";
import Layout from "../layout";
import { BiometricSetup } from "../../../components/biometric/BiometricSetup";
import { useAuth } from "../../../contexts/AuthContext";
import { ScanFace, CheckCircle2, RefreshCw, ShieldCheck } from "lucide-react";
import { Navigate } from "react-router-dom";

const InstitutionVerificationPage: React.FC = () => {
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
            <div style={{ 
                padding: '40px 48px', 
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'flex-start', 
                textAlign: 'left'
            }}>
                {/* Page Header */}
                <div style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <h1 style={{
                        fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
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
                        maxWidth: '600px',
                    }}>
                        Protect your institution account and enable document signing with biometric authentication.
                    </p>
                </div>

                {/* Status Card */}
                <div style={{
                    background: 'white',
                    borderRadius: '20px',
                    border: `1px solid ${isSetup ? '#818cf8' : '#e2e8f0'}`,
                    padding: '36px 40px',
                    width: '100%',
                    maxWidth: '800px',
                    boxShadow: isSetup
                        ? '0 10px 40px rgba(99,102,241,0.08)'
                        : '0 10px 40px rgba(0,0,0,0.04)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '24px',
                    textAlign: 'left',
                }}>
                    {/* Icon Container - Left Side */}
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '16px',
                        background: isSetup ? '#eef2ff' : '#f8fafc',
                        border: `1px solid ${isSetup ? '#a5b4fc' : '#e2e8f0'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        {isSetup
                            ? <CheckCircle2 size={32} color="#1e1a6b" />
                            : <ScanFace size={32} color="#1e1a6b" />
                        }
                    </div>

                    {/* Content Container - Right Side */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
                        {/* Status label */}
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            padding: '4px 12px', borderRadius: '99px', fontSize: '13px', fontWeight: 600,
                            background: isSetup ? '#f0fdf4' : '#fef9c3',
                            color: isSetup ? '#16a34a' : '#a16207',
                            border: `1px solid ${isSetup ? '#86efac' : '#fde68a'}`,
                            marginBottom: '16px',
                        }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isSetup ? '#22c55e' : '#eab308' }} />
                            {isSetup ? 'Biometric Setup Complete' : 'Setup Required'}
                        </span>

                        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '8px', fontFamily: 'Space Grotesk, sans-serif' }}>
                            {isSetup ? 'Face Recognition Active' : 'Set Up Face Recognition'}
                        </h2>
                        <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '28px', maxWidth: '500px' }}>
                            {isSetup
                                ? `Your biometric authentication is active (${user.biometricType || 'face'}). Use it to securely sign certificates.`
                                : 'You haven\'t set up biometric authentication yet. Secure your account and enable one-click signing.'
                            }
                        </p>

                        {!isSetup ? (
                            // Not set up - show enable button
                            <button
                                onClick={() => setShowSetup(true)}
                                style={{
                                    padding: '14px 36px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #1e1a6b, #2c258e)',
                                    color: 'white',
                                    fontSize: '15px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 4px 12px rgba(30,26,107,0.20)'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(30,26,107,0.36)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(30,26,107,0.20)';
                                }}
                            >
                                Enable Face Verification
                            </button>
                        ) : (
                            // Already set up - show success message + re-enable button
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                {/* Success status */}
                                <div style={{
                                    padding: '12px 24px',
                                    borderRadius: '12px',
                                    background: '#f0fdf4',
                                    border: '1px solid #bbf7d0',
                                    color: '#16a34a',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                }}>
                                    <CheckCircle2 size={18} color="#16a34a" />
                                    Biometric setup successfully
                                </div>

                                {/* Re-enable / Update face button */}
                                <button
                                    onClick={() => setShowSetup(true)}
                                    style={{
                                        padding: '12px 24px',
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        background: 'white',
                                        color: '#374151',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = '#1e1a6b';
                                        e.currentTarget.style.color = '#1e1a6b';
                                        e.currentTarget.style.background = '#f5f3ff';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                        e.currentTarget.style.color = '#374151';
                                        e.currentTarget.style.background = 'white';
                                    }}
                                >
                                    <RefreshCw size={16} />
                                    Re-enable / Update Face
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Security Note */}
                <div style={{
                    marginTop: '24px',
                    padding: '16px 20px',
                    background: 'transparent',
                    borderRadius: '12px',
                    maxWidth: '800px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    textAlign: 'left'
                }}>
                    <ShieldCheck size={20} color="#64748b" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                        Your biometric data is encrypted and stored securely. We do not share your raw face scan with third parties. You can update your face recognition data at any time from this panel.
                    </p>
                </div>
            </div>
        </Layout>
    );
};

export default InstitutionVerificationPage;