import React from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { Sparkles, CreditCard } from "lucide-react";

interface DashboardProps {
    onStartSigning: () => void;
    onShowCredentials: () => void;
}

const StudentDashboard: React.FC<DashboardProps> = ({ onStartSigning, onShowCredentials }) => {
    const { user } = useAuth();

    if (!user) return null;

    const t = {
        btnShadow: "0 6px 20px rgba(30,26,107,0.24)",
        btnShadowHover: "0 10px 28px rgba(30,26,107,0.36)",
        actionBorder: "#e2e8f0",
    };

    return (
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
                    background: '#1e1a6b', 
                    boxShadow: t.btnShadow, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 28px' 
                }}>
                    <Sparkles size={36} color="white" />
                </div>
                <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>Student Services</h2>
                <p style={{ fontSize: '18px', color: '#64748b', lineHeight: 1.6, maxWidth: '540px', margin: '0 auto 40px' }}>
                    Access your academic credentials and sign documents securely using your unique digital identity.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px' }}>
                    <button 
                        onClick={onStartSigning} 
                        style={{ 
                            padding: '14px 36px', 
                            borderRadius: '12px', 
                            border: 'none', 
                            background: '#1e1a6b', 
                            color: 'white', 
                            fontSize: '16px', 
                            fontWeight: 600, 
                            cursor: 'pointer', 
                            boxShadow: t.btnShadow, 
                            transition: 'all 0.2s' 
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = t.btnShadowHover; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = t.btnShadow; }}
                    >
                        Start Signing
                    </button>
                    <button 
                        onClick={onShowCredentials}
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
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#1e1a6b'; e.currentTarget.style.color = '#1e1a6b'; e.currentTarget.style.background = '#f8fafc'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#374151'; e.currentTarget.style.background = 'white'; }}
                    >
                        <CreditCard size={20} /> My Credentials
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
