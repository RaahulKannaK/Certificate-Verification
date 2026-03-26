import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BiometricSetup } from "@/components/biometric/BiometricSetup";
import { SigningSetup } from "@/components/signing/SigningSetup";
import VerificationList, { Certificate } from "@/components/student/dashboard/VerificationList";
import { SigningView } from "@/components/signing/SigningView";
import Layout from "../layout";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

const InstitutionDashboardPage: React.FC<{ onHome?: () => void }> = ({ onHome }) => {
    const { user } = useAuth();
    const [showBiometricSetup, setShowBiometricSetup] = useState(false);
    const [showSigning, setShowSigning] = useState(false);
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

    // Show SigningSetup (for issuing new credentials)
    if (showSigning) {
        return (
            <Layout>
                <div style={{ padding: '20px 0' }}>
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
            </Layout>
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

    // Show SigningView for a specific credential
    if (selectedCertId) {
        return (
            <Layout>
                <div style={{ padding: '20px 0' }}>
                    <button
                        onClick={() => setSelectedCertId(null)}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            marginBottom: '24px', padding: '8px 18px', borderRadius: '10px',
                            border: '1px solid #e2e8f0', background: 'white',
                            color: '#374151', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.color = '#16a34a'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#374151'; }}
                    >
                        ← Back to Credentials
                    </button>
                    <SigningView
                        credentialId={selectedCertId}
                        onBack={() => setSelectedCertId(null)}
                    />
                </div>
            </Layout>
        );
    }

    // Main Dashboard - Show VerificationList with Start Signing button
    return (
        <Layout>
            <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px 0" }}>

                {/* VerificationList as main content */}
                <VerificationList onSign={(cert: Certificate) => setSelectedCertId(cert.id)} />
            </div>
        </Layout>
    );
};

export default InstitutionDashboardPage;