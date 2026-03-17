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
            <div style={{ 
                padding: '40px 20px', 
                minHeight: 'calc(100vh - 100px)', // Adjust based on header height
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                textAlign: 'center'
            }}>
                {/* Page Header - Centered */}
                <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
                        fontSize: '14px',
                        color: '#64748b',
                        lineHeight: 1.6,
                        maxWidth: '500px',
                    }}>
                        Protect your account and enable document signing with biometric authentication.
                    </p>
                </div>

                {/* Status Card - Centered */}
                <div style={{
                    background: 'white',
                    borderRadius: '20px',
                    border: `1px solid ${isSetup ? '#818cf8' : '#e2e8f0'}`,
                    padding: '36px 32px',
                    width: '100%',
                    maxWidth: '440px',
                    boxShadow: isSetup
                        ? '0 10px 40px rgba(99,102,241,0.08)'
                        : '0 10px 40px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                }}>
                    {/* Icon */}
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '16px',
                        background: isSetup ? '#eef2ff' : '#f8fafc',
                        border: `1px solid ${isSetup ? '#a5b4fc' : '#e2e8f0'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '20px',
                    }}>
                        {isSetup
                            ? <CheckCircle2 size={28} color="#1e1a6b" />
                            : <ScanFace size={28} color="#1e1a6b" />
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

                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '8px', fontFamily: 'Space Grotesk, sans-serif' }}>
                        {isSetup ? 'Face Recognition Active' : 'Set Up Face Recognition'}
                    </h2>
                    <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, marginBottom: '28px', maxWidth: '360px' }}>
                        {isSetup
                            ? `Your biometric authentication is active (${user.biometricType || 'face'}). Use it to securely sign certificates.`
                            : 'You haven\'t set up biometric authentication yet. Secure your account and enable one-click signing.'
                        }
                    </p>

                    {!isSetup ? (
                        <button
                            onClick={() => setShowSetup(true)}
                            style={{
                                padding: '12px 32px',
                                borderRadius: '10px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #1e1a6b, #2c258e)',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                width: '100%',
                                maxWidth: '280px'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 12px 32px rgba(30,26,107,0.36)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            Enable Face Verification
                        </button>
                    ) : (
                        <div style={{
                            padding: '12px 20px',
                            borderRadius: '10px',
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            color: '#16a34a',
                            fontSize: '14px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            width: '100%',
                            maxWidth: '280px'
                        }}>
                            <CheckCircle2 size={18} color="#16a34a" />
                            Biometric setup successfully
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default StudentVerificationPage;
