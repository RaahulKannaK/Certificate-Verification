"use client";

import React, { useState } from "react";
import { BiometricVerify } from "@/components/dashboard/BiometricVerify";
import { Shield, ScanFace } from "lucide-react";

export default function VerificationPage() {
    const [isVerified, setIsVerified] = useState(false);

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Face Verification</h1>
                <p style={{ color: '#64748b', fontSize: '16px' }}>Complete your identity verification to access secure services.</p>
            </div>

            {isVerified ? (
                <div style={{
                    background: 'white',
                    padding: '48px',
                    borderRadius: '24px',
                    textAlign: 'center',
                    border: '1px solid #22c55e',
                    boxShadow: '0 10px 30px rgba(34, 197, 94, 0.1)'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: '#f0fdf4',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px'
                    }}>
                        <Shield size={40} color="#22c55e" />
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Identity Verified</h2>
                    <p style={{ color: '#64748b', marginBottom: '32px' }}>Your face biometric has been successfully verified. You now have full access to Signemic services.</p>
                    <button
                        onClick={() => setIsVerified(false)}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '10px',
                            background: '#1e1a6b',
                            color: 'white',
                            border: 'none',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >Verify Again</button>
                </div>
            ) : (
                <div style={{ background: 'white', padding: '16px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                    <BiometricVerify
                        credentialId="verification-only"
                        onComplete={() => setIsVerified(true)}
                    />
                </div>
            )}
        </div>
    );
}
