"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { User, Mail, Phone, Calendar, Shield, Key } from "lucide-react";

export default function ProfilePage() {
    const { user } = useAuth();

    if (!user) return null;

    const infoItems = [
        { icon: <User size={20} color="#1e1a6b" />, label: "Full Name", value: user.name || `${user.firstName} ${user.lastName}` },
        { icon: <Mail size={20} color="#1e1a6b" />, label: "Email Address", value: user.email },
        { icon: <Phone size={20} color="#1e1a6b" />, label: "Phone Number", value: user.phone || "Not provided" },
        { icon: <Calendar size={20} color="#1e1a6b" />, label: "Age", value: user.age || "Not provided" },
    ];

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>User Profile</h1>
                <p style={{ color: '#64748b', fontSize: '16px' }}>Manage your personal information and security settings.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Personal Information */}
                <div style={{ background: 'white', padding: '32px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <User size={22} color="#1e1a6b" /> Personal Details
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {infoItems.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '40px', height: '40px', background: '#f5f3ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {item.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{item.label}</p>
                                    <p style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{item.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Security & Keys */}
                <div style={{ background: 'white', padding: '32px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Shield size={22} color="#1e1a6b" /> Security Information
                    </h3>

                    <div style={{ marginBottom: '24px' }}>
                        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>Public Key</p>
                        <div style={{
                            background: '#f8fafc',
                            padding: '12px',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                            fontSize: '13px',
                            fontFamily: 'monospace',
                            wordBreak: 'break-all',
                            color: '#1e1a6b',
                            fontWeight: 500
                        }}>
                            {user.publicKey || user.walletPublicKey}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                        <div style={{ width: '32px', height: '32px', background: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Shield size={16} color="white" />
                        </div>
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#166534', margin: 0 }}>Biometric Status</p>
                            <p style={{ fontSize: '12px', color: '#166534', margin: 0 }}>{user.biometricSetup ? "Enrolled & Secure" : "Not Setup"}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
