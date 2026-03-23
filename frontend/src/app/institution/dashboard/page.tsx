import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BiometricSetup } from "@/components/biometric/BiometricSetup";
import { SigningSetup } from "@/components/signing/SigningSetup";
import VerificationList, { Certificate } from "@/components/student/dashboard/VerificationList";
import { SigningView } from "@/components/signing/SigningView";
import Layout from "../layout";
import { Sparkles, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

const InstitutionDashboardPage: React.FC<{ onHome?: () => void }> = ({ onHome }) => {
    const { user } = useAuth();
    const [showBiometricSetup, setShowBiometricSetup] = useState(false);
    const [showSigning, setShowSigning] = useState(false);
    const [showRecords, setShowRecords] = useState(false);
    const [selectedCertId, setSelectedCertId] = useState<string | null>(null);

    if (!user) return <Navigate to="/" replace />;

    const handleStartSigning = () => {
        if (!user.biometricSetup) {
            toast.info("Please set up biometric authentication first");
            setShowBiometricSetup(true);
            return;
        }
        setShowSigning(true);
    };

    if (showSigning) return <SigningSetup onBack={() => setShowSigning(false)} />;

    if (showBiometricSetup) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-[#f8fafc]">
                <BiometricSetup onComplete={() => setShowBiometricSetup(false)} onSkip={() => setShowBiometricSetup(false)} />
            </div>
        );
    }

    return (
        <Layout>
            <div className="w-full">
                {selectedCertId ? (
                    <SigningView
                        credentialId={selectedCertId}
                        onBack={() => setSelectedCertId(null)}
                    />
                ) : (
                    <VerificationList 
                        onSign={(cert: Certificate) => setSelectedCertId(cert.id)} 
                        onStartSigning={handleStartSigning}
                    />
                )}
            </div>
        </Layout>
    );
};

export default InstitutionDashboardPage;