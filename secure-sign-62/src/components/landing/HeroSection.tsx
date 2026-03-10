import React from 'react';
import { theme } from '../../theme/theme';
import Button from '../context/Button';
import Navbar from '../layout/Navbar';


interface HeroSectionProps {
  onCreateAccount: () => void;
  onLogin: () => void;
  onNavigateToStudent?: () => void;
  onNavigateToInstitution?: () => void;
  isAuthenticated?: boolean;
  userRole?: string | null;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onCreateAccount,
  onLogin,
  onNavigateToStudent,
  onNavigateToInstitution,
  isAuthenticated = false,
  userRole = null,
}) => {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        backgroundImage: "url('/images/bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      {/* ===== NAVBAR ===== */}
      <Navbar
        isLanding={true}
        onCreateAccount={onCreateAccount}
        onLogin={onLogin}
        onNavigateToStudent={onNavigateToStudent}
        onNavigateToInstitution={onNavigateToInstitution}
      />

      {/* ===== HERO CONTENT ===== */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1250px', margin: '0 auto', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '100px 24px 24px', transform: 'translateY(0)' }}>
        <div style={{ textAlign: 'left', maxWidth: '700px' }}>

          {/* Heading */}
          <h1 style={{
            fontFamily: 'WeSignFont',
            fontSize: 'clamp(2.0rem, 5vw, 4.4rem)',
            fontWeight: 900, lineHeight: 1.1,
            color: '#0f172a', marginBottom: '24px',
            textAlign: 'left',
          }}>
            Digital Signature
            <br />
            <span style={{
              background: `linear-gradient(135deg, ${theme.colors.brand}, ${theme.colors.brandDark})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              for Institutional Credentials
            </span>
          </h1>

          {/* Subtext */}
          <p style={{ fontFamily: 'WeSignFont', fontSize: '18px', color: '#1d1d1e', lineHeight: 1.75, maxWidth: '600px', margin: '0 0 44px 0' }}>
            Sign and verify academic credentials securely between students and institutions.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', gap: '20px' }}>
            <Button
              onClick={onCreateAccount}
              className="!px-10 !py-4 !text-lg"
            >
              Get Started
            </Button>
            <Button
              onClick={onLogin}
              className="!px-10 !py-4 !text-lg"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HeroSection;