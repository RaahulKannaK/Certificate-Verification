import React, { useState, useEffect } from 'react';
import { FileSignature, Menu, X, ShieldCheck, ScanFace } from 'lucide-react';

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleStudentClick = () => {
    if (!isAuthenticated) return onLogin();
    if (userRole === 'student') onNavigateToStudent?.();
    else {
      alert('Please log in as a student');
      onLogin();
    }
  };

  const handleInstitutionClick = () => {
    if (!isAuthenticated) return onLogin();
    if (userRole === 'institution') onNavigateToInstitution?.();
    else {
      alert('Please log in as an institution');
      onLogin();
    }
  };

  const navLinks = [
    { label: 'Home', onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { label: 'Student Portal', onClick: handleStudentClick },
    { label: 'Institution Portal', onClick: handleInstitutionClick },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)' }}>

      {/* NAVBAR */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
        <nav style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(10px)' : 'none',
          borderBottom: scrolled ? '1px solid #e0e7ff' : 'none',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              padding: '8px',
              borderRadius: '8px'
            }}>
              <FileSignature size={24} color="#ffffff" />
            </div>
            <span style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#1e1b4b'
            }}>
              SigNemic
            </span>
          </div>

          <div className="hidden md:flex" style={{ gap: '28px' }}>
            {navLinks.map(link => (
              <button
                key={link.label}
                onClick={link.onClick}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '15px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  color: '#4338ca',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#4338ca'}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex" style={{ gap: '12px' }}>
            <button
              onClick={onLogin}
              style={{
                padding: '8px 18px',
                borderRadius: '6px',
                border: '1px solid #3b82f6',
                background: 'white',
                cursor: 'pointer',
                fontWeight: 500,
                color: '#3b82f6',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#eff6ff';
                e.currentTarget.style.borderColor = '#6366f1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#3b82f6';
              }}
            >
              Login
            </button>

            <button
              onClick={onCreateAccount}
              style={{
                padding: '8px 18px',
                borderRadius: '6px',
                border: 'none',
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 8px 12px -1px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.3)';
              }}
            >
              Create Account
            </button>
          </div>

          <button
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4338ca' }}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>
      </div>

      {/* HERO */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '140px 24px 80px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '60px',
        alignItems: 'center'
      }}>

        {/* LEFT CONTENT */}
        <div>
          <div style={{
            display: 'inline-block',
            padding: '6px 14px',
            borderRadius: '999px',
            background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '20px',
            color: '#4338ca',
            border: '1px solid #c7d2fe'
          }}>
            Blockchain + Biometric Credential System
          </div>

          <h1 style={{
            fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            color: '#1e1b4b',
            marginBottom: '20px'
          }}>
            Secure Academic Credentials
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Verified with Digital Signatures
            </span>
          </h1>

          <p style={{
            fontSize: '17px',
            color: '#4b5563',
            lineHeight: 1.7,
            marginBottom: '36px',
            maxWidth: '520px'
          }}>
            A biometric-protected digital signature system enabling students
            and institutions to securely issue, sign, and verify academic credentials
            using cryptographic public key authentication.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={onLogin}
              style={{
                padding: '14px 28px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px -1px rgba(59, 130, 246, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.3)';
              }}
            >
              Login with Wallet
            </button>

            <button
              onClick={onCreateAccount}
              style={{
                padding: '14px 28px',
                borderRadius: '8px',
                border: '1px solid #c7d2fe',
                background: 'white',
                fontWeight: 600,
                cursor: 'pointer',
                color: '#4338ca',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#eff6ff';
                e.currentTarget.style.borderColor = '#3b82f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#c7d2fe';
              }}
            >
              Request Access
            </button>
          </div>
        </div>

        {/* RIGHT VISUAL PANEL */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          border: '1px solid #e0e7ff',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            marginBottom: '24px',
            padding: '16px',
            background: 'linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)',
            borderRadius: '12px',
            border: '1px solid #dbeafe'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              padding: '10px',
              borderRadius: '10px',
              height: 'fit-content'
            }}>
              <ShieldCheck size={24} color="#ffffff" />
            </div>
            <div>
              <strong style={{ color: '#1e1b4b', fontSize: '16px' }}>Biometric Authorization</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                Face authentication required before signing
              </p>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '16px',
            padding: '16px',
            background: 'linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)',
            borderRadius: '12px',
            border: '1px solid #dbeafe'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              padding: '10px',
              borderRadius: '10px',
              height: 'fit-content'
            }}>
              <ScanFace size={24} color="#ffffff" />
            </div>
            <div>
              <strong style={{ color: '#1e1b4b', fontSize: '16px' }}>Hash Integrity Check</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                Document hash verified before and after signature
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;