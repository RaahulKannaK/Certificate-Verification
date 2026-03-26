import React, { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import VerificationList from "./VerificationList";
import { SigningSetup } from "../../signing/SigningSetup";
import { BiometricSetup } from "../../biometric/BiometricSetup";
import { toast } from "sonner";

interface DashboardProps {
    onShowCredentials?: () => void;
}

const StudentDashboard: React.FC<DashboardProps> = ({ onShowCredentials }) => {
    const { user } = useAuth();
    const [showSigning, setShowSigning] = useState(false);
    const [showBiometricSetup, setShowBiometricSetup] = useState(false);

    if (!user) return null;

    const handleStartSigning = () => {
        if (!user.biometricSetup) {
            toast.info("Please set up biometric authentication first");
            setShowBiometricSetup(true);
            return;
        }
        setShowSigning(true);
    };

    return (
        <div>
            {/* ACTION PANEL */}
            <div style={{
                background: 'white',
                borderRadius: '20px', 
                border: `1px solid ${t.actionBorder}`,
                boxShadow: 'none', 
                padding: '48px 32px', 
                textAlign: 'center'
            }}>
                <div style={{ 
                    width: '64px', 
                    height: '64px', 
                    borderRadius: '20px', 
                    background: '#1e1a6b', 
                    boxShadow: 'none', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 24px' 
                }}>
                    <Sparkles size={32} color="white" />
                </div>
                <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>Student Services</h2>
                <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.6, maxWidth: '500px', margin: '0 auto 32px' }}>
                    Access your academic credentials and sign documents securely using your unique digital identity.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px' }}>
                    <button 
                        onClick={onStartSigning} 
                        style={{ 
                            padding: '12px 32px', 
                            borderRadius: '12px', 
                            border: 'none', 
                            background: '#1e1a6b', 
                            color: 'white', 
                            fontSize: '15px', 
                            fontWeight: 600, 
                            cursor: 'pointer', 
                            boxShadow: 'none', 
                            transition: 'all 0.2s' 
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'none'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                        Start Signing
                    </button>
                    <button
                        onClick={() => setShowSigning(false)}
                        style={{
                            position: 'absolute',
                            top: '24px',
                            left: '24px',
                            padding: '8px 16px',
                            borderRadius: '10px',
                            border: 'none',
                            background: '#f1f5f9',
                            color: '#374151',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            zIndex: 10
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; }}
                    >
                        ← Back to Credentials
                    </button>
                    <div style={{ marginTop: '20px' }}>
                        <SigningSetup onBack={() => setShowSigning(false)} />
                    </div>
                </div>
            </div>
        );
    }

    // Show BiometricSetup
    if (showBiometricSetup) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-[#f8fafc]">
                <BiometricSetup onComplete={() => setShowBiometricSetup(false)} onSkip={() => setShowBiometricSetup(false)} />
            </div>
        );
    }

    // Main Dashboard - Show VerificationList with Issue Certificate button
    return (
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px 0" }}>
            {/* Header with Issue Certificate Button */}


            {/* VerificationList as main content */}
            <VerificationList />
        </div>
    );
};

export default StudentDashboard;