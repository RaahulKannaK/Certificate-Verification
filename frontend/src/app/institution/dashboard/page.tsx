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

    // "Manage Records" clicked — show VerificationList for institution
    if (showRecords) {
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
                                onClick={() => setShowRecords(false)}
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
                                ← Back to Dashboard
                            </button>
                            <VerificationList onSign={(cert: Certificate) => setSelectedCertId(cert.id)} />
                        </>
                    )}
                </div>
            </Layout>
        );
    }

    const t = {
        btnShadow: "0 6px 20px rgba(22,163,74,0.24)",
        btnShadowHover: "0 10px 28px rgba(22,163,74,0.36)",
        actionBorder: "#e2e8f0",
    };

    return (
        <Layout>
            <div>
                {/* ACTION PANEL */}
                <div style={{
                    background: 'white',
                    borderRadius: '20px', 
                    border: `1px solid ${t.actionBorder}`,
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', 
                    padding: '48px 32px', 
                    textAlign: 'center'
                }}>
                    <div style={{ 
                        width: '64px', 
                        height: '64px', 
                        borderRadius: '20px', 
                        background: '#1e1a6b', // Dark blue for Student theme similarity
                        boxShadow: t.btnShadow, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        margin: '0 auto 24px' 
                    }}>
                        <Sparkles size={32} color="white" />
                    </div>
                    <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>Institution Panel</h2>
                    <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.6, maxWidth: '500px', margin: '0 auto 32px' }}>
                        Digitally sign and distribute verified academic certificates to your alumni and current students instantly.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px' }}>
                        <button 
                            onClick={handleStartSigning} 
                            style={{ 
                                padding: '12px 32px', 
                                borderRadius: '12px', 
                                border: 'none', 
                                background: '#1e1a6b', // Blue button
                                color: 'white', 
                                fontSize: '15px', 
                                fontWeight: 600, 
                                cursor: 'pointer', 
                                boxShadow: t.btnShadow, 
                                transition: 'all 0.2s' 
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = t.btnShadowHover; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = t.btnShadow; }}
                        >
                            Issue Certificate
                        </button>
                        <button 
                            onClick={() => setShowRecords(true)}
                            style={{ 
                                padding: '12px 32px', 
                                borderRadius: '12px', 
                                border: `1.5px solid #e2e8f0`, 
                                background: 'white', 
                                color: '#374151', 
                                fontSize: '15px', 
                                fontWeight: 600, 
                                cursor: 'pointer', 
                                transition: 'all 0.2s', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px' 
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#1e1a6b'; e.currentTarget.style.color = '#1e1a6b'; e.currentTarget.style.background = '#f8fafc'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#374151'; e.currentTarget.style.background = 'white'; }}
                        >
                            <CreditCard size={18} /> Manage Records
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default InstitutionDashboardPage;