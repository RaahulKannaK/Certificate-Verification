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
                    /* Flattened container */
                    padding: '16px 0',
                    position: 'relative',
                    minHeight: 'auto'
                }}>
                    <div style={{ marginTop: '0px' }}>
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