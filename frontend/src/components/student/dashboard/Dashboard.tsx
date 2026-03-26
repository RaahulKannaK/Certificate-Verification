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

    // Show SigningSetup inside the box
    if (showSigning) {
        return (
            <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px 0" }}>
                <div style={{
                    background: 'white',
                    borderRadius: '20px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                    padding: '32px',
                    position: 'relative',
                    minHeight: '600px'
                }}>
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