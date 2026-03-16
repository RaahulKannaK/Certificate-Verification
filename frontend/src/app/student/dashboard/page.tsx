import React, { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { BiometricSetup } from "../../../components/biometric/BiometricSetup";
import { SigningSetup } from "../../../components/signing/SigningSetup";
import StudentDashboard from "../../../components/student/dashboard/Dashboard";
import VerificationList, { Certificate } from "../../../components/student/dashboard/VerificationList";
import { SigningView } from "../../../components/signing/SigningView";
import Layout from "../layout";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

const StudentDashboardPage: React.FC<{ onHome?: () => void }> = ({ onHome }) => {
    const { user, logout } = useAuth();
    const [showBiometricSetup, setShowBiometricSetup] = useState(false);
    const [showSigning, setShowSigning] = useState(false);
    const [showCredentials, setShowCredentials] = useState(false);
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
            <div className="min-h-screen flex items-center justify-center p-6">
                <BiometricSetup 
                    onComplete={() => setShowBiometricSetup(false)} 
                    onSkip={() => setShowBiometricSetup(false)} 
                />
            </div>
        );
    }

    // "My Credentials" was clicked — show the certificate list (or signer) inside the Layout
    if (showCredentials) {
        return (
            <Layout>
                <div style={{ padding: '20px 0' }}>
                    {selectedCertId ? (
                        <SigningView
                            credentialId={selectedCertId}
                            onBack={() => setSelectedCertId(null)}
                        />
                    ) : (
                        <>
                            {/* Back button */}
                            <button
                                onClick={() => setShowCredentials(false)}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                                    marginBottom: '24px', padding: '8px 18px', borderRadius: '10px',
                                    border: '1px solid #e2e8f0', background: 'white',
                                    color: '#374151', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#1e1a6b'; e.currentTarget.style.color = '#1e1a6b'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#374151'; }}
                            >
                                ← Back to Dashboard
                            </button>
                            <VerificationList onSign={(cert: Certificate) => setSelectedCertId(cert.id)} />
                        </>
                    )}
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <StudentDashboard 
                onStartSigning={handleStartSigning}
                onShowCredentials={() => setShowCredentials(true)}
            />
        </Layout>
    );
};

export default StudentDashboardPage;
