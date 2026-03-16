import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BiometricSetup } from "@/components/biometric/BiometricSetup";
import { SigningSetup } from "@/components/signing/SigningSetup";
import Layout from "../layout";
import { Sparkles, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

const InstitutionDashboardPage: React.FC<{ onHome?: () => void }> = ({ onHome }) => {
    const { user } = useAuth();
    const [showBiometricSetup, setShowBiometricSetup] = useState(false);
    const [showSigning, setShowSigning] = useState(false);

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

    const t = {
        btnShadow: "0 6px 20px rgba(30,26,107,0.24)",
        btnShadowHover: "0 10px 28px rgba(30,26,107,0.36)",
        actionBorder: "#e2e8f0",
    };

    return (
        <Layout>
            <div>
                {/* ACTION PANEL */}
                <div style={{
                    background: 'white',
                    borderRadius: '24px', 
                    border: `1px solid ${t.actionBorder}`,
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', 
                    padding: '64px 32px', 
                    textAlign: 'center'
                }}>
                    <div style={{ 
                        width: '80px', 
                        height: '80px', 
                        borderRadius: '24px', 
                        background: '#16a34a', // Dark green for Institution theme
                        boxShadow: '0 6px 20px rgba(22,163,74,0.3)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        margin: '0 auto 28px' 
                    }}>
                        <Sparkles size={36} color="white" />
                    </div>
                    <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>Institution Panel</h2>
                    <p style={{ fontSize: '18px', color: '#64748b', lineHeight: 1.6, maxWidth: '540px', margin: '0 auto 40px' }}>
                        Digitally sign and distribute verified academic certificates to your alumni and current students instantly.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px' }}>
                        <button 
                            onClick={handleStartSigning} 
                            style={{ 
                                padding: '14px 36px', 
                                borderRadius: '12px', 
                                border: 'none', 
                                background: '#16a34a', // Green button
                                color: 'white', 
                                fontSize: '16px', 
                                fontWeight: 600, 
                                cursor: 'pointer', 
                                boxShadow: '0 6px 20px rgba(22,163,74,0.3)', 
                                transition: 'all 0.2s' 
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(22,163,74,0.4)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(22,163,74,0.3)'; }}
                        >
                            Issue Certificate
                        </button>
                        <button 
                            style={{ 
                                padding: '14px 36px', 
                                borderRadius: '12px', 
                                border: `1.5px solid #e2e8f0`, 
                                background: 'white', 
                                color: '#374151', 
                                fontSize: '16px', 
                                fontWeight: 600, 
                                cursor: 'pointer', 
                                transition: 'all 0.2s', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '10px' 
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.color = '#16a34a'; e.currentTarget.style.background = '#f0fdf4'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#374151'; e.currentTarget.style.background = 'white'; }}
                        >
                            <CreditCard size={20} /> Manage Records
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default InstitutionDashboardPage;
