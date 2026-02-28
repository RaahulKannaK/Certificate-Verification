import React, { useState, useEffect } from 'react';
import { FileSignature, Menu, X, Shield, Link2, Pen } from 'lucide-react';

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
  const [isSigning, setIsSigning] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleStudentClick = () => {
    if (!isAuthenticated) {
      onLogin();
      return;
    }
    if (userRole === 'student') {
      onNavigateToStudent?.();
    } else {
      alert('Please log in as a student to access the student dashboard');
      onLogin();
    }
  };

  const handleInstitutionClick = () => {
    if (!isAuthenticated) {
      onLogin();
      return;
    }
    if (userRole === 'institution') {
      onNavigateToInstitution?.();
    } else {
      alert('Please log in as an institution to access the institution dashboard');
      onLogin();
    }
  };

  const handleEnterClick = () => {
    setIsSigning(true);
    setTimeout(() => {
      setIsSigning(false);
      onLogin();
    }, 1500);
  };

  const navLinks = [
    { label: 'Home', onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { label: 'Student', onClick: handleStudentClick },
    { label: 'Institution', onClick: handleInstitutionClick },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#f0f4f8' }}>

      {/* Subtle background blobs */}
      <div style={{
        position: 'absolute', top: '-100px', right: '-100px',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, #dbeafe 0%, transparent 70%)',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', bottom: '-80px', left: '-80px',
        width: '420px', height: '420px', borderRadius: '50%',
        background: 'radial-gradient(circle, #ede9fe 0%, transparent 70%)',
        zIndex: 0,
      }} />

      {/* ===== NAVBAR with BOX ===== */}
      <div style={{ position: 'fixed', top: '16px', left: 0, right: 0, zIndex: 50, display: 'flex', justifyContent: 'center', padding: '0 24px' }}>
        <nav style={{
          width: '100%',
          maxWidth: '1100px',
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(16px)',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: scrolled
            ? '0 8px 32px rgba(99, 102, 241, 0.12), 0 2px 8px rgba(0,0,0,0.08)'
            : '0 4px 20px rgba(0,0,0,0.08)',
          transition: 'box-shadow 0.3s ease',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
            }}>
              <FileSignature size={18} color="white" />
            </div>
            <span style={{
              fontFamily: 'Sansita Swashed',
              fontSize: '20px', fontWeight: 900, color: '#1e293b',
            }}>
              WeSign 
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div style={{ display: 'flex', gap: '32px' }} className="hidden md:flex">
            {navLinks.map((link) => (
              <button 
                key={link.label} 
                onClick={link.onClick}
                style={{
                  fontFamily: 'Cabinet Grotesk', fontSize: '16px', fontWeight: 900,
                  color: '#64748b', textDecoration: 'none',
                  transition: 'color 0.2s',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#1e293b')}
                onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Desktop Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} className="hidden md:flex">
            <button
              onClick={onLogin}
              style={{
                padding: '8px 20px', borderRadius: '8px',
                border: '1px solid #e2e8f0', background: 'white',
                color: '#191919', fontFamily: 'Cabinet Grotesk', fontSize: '16px', fontWeight: 900,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget.style.background = '#f8fafc'); (e.currentTarget.style.borderColor = '#c7d2fe'); (e.currentTarget.style.color = '#4f46e5'); }}
              onMouseLeave={e => { (e.currentTarget.style.background = 'white'); (e.currentTarget.style.borderColor = '#e2e8f0'); (e.currentTarget.style.color = '#374151'); }}
            >
              Login
            </button>
            <button
              onClick={onCreateAccount}
              style={{
                padding: '8px 20px', borderRadius: '8px', border: 'none',
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                color: 'white', fontFamily: 'Cabinet Grotesk', fontSize: '16px', fontWeight: 900,
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget.style.opacity = '0.9'); (e.currentTarget.style.transform = 'translateY(-1px)'); }}
              onMouseLeave={e => { (e.currentTarget.style.opacity = '1'); (e.currentTarget.style.transform = 'translateY(0)'); }}
            >
              Register
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1e293b' }}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: '80px', left: '16px', right: '16px', zIndex: 49,
          background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(16px)',
          borderRadius: '14px', border: '1px solid #e2e8f0',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: '14px',
        }}>
          {navLinks.map((link) => (
            <button 
              key={link.label} 
              onClick={() => { link.onClick(); setMenuOpen(false); }}
              style={{ 
                fontFamily: 'Cabinet Grotesk', 
                fontSize: '16px', 
                fontWeight: 900, 
                color: '#374151', 
                textDecoration: 'none', 
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                padding: 0,
              }}
            >
              {link.label}
            </button>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
            <button onClick={() => { onLogin(); setMenuOpen(false); }}
              style={{ padding: '10px', borderRadius: '18px', border: '1px solid #e2e8f0', background: 'white', fontFamily: 'Cabinet Grotesk', fontWeight: 900, cursor: 'pointer', color: '#374151' }}>
              Login
            </button>
            <button onClick={() => { onCreateAccount(); setMenuOpen(false); }}
              style={{ padding: '10px', borderRadius: '18px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white', fontFamily: 'Cabinet Grotesk', fontWeight: 900, cursor: 'pointer' }}>
              Register
            </button>
          </div>
        </div>
      )}

      {/* ===== HERO CONTENT ===== */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', padding: '160px 24px 80px' }}>
        <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto' }}>

          {/* Heading */}
          <h1 style={{
            fontFamily: 'Poppins Semi-Bold',
            fontSize: 'clamp(2.6rem, 6vw, 4.8rem)',
            fontWeight: 900, lineHeight: 1.1,
            color: '#0f172a', marginBottom: '24px',
          }}>
            Digital Signatures
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #0a0a0a, #0d0d0e)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Powered by Trust
            </span>
          </h1>

          {/* Subtext */}
          <p style={{ fontFamily: 'Familjen Grotesk', fontSize: '18px', color: '#1d1d1e', lineHeight: 1.75, maxWidth: '600px', margin: '0 auto 44px' }}>
            Secure, verifiable, and tamper-proof document signing between students and institutions.
            Your keys, your identity, your signature.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '14px' }}>
            <button
              onClick={onCreateAccount}
              style={{
                padding: '13px 32px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                color: 'white', fontFamily: 'Cabinet Grotesk', fontSize: '18px', fontWeight: 900,
                cursor: 'pointer', boxShadow: '0 6px 20px rgba(99,102,241,0.35)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget.style.transform = 'translateY(-2px)'); (e.currentTarget.style.boxShadow = '0 10px 28px rgba(99,102,241,0.45)'); }}
              onMouseLeave={e => { (e.currentTarget.style.transform = 'translateY(0)'); (e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.35)'); }}
            >
              Get Started
            </button>
            
            {/* Animated Enter Button with Pen Signing */}
            <button
              onClick={handleEnterClick}
              disabled={isSigning}
              style={{
                padding: '13px 32px', borderRadius: '10px',
                border: '1.5px solid #cbd5e1', background: 'white',
                color: '#374151', fontFamily: 'Cabinet Grotesk', fontSize: '18px', fontWeight: 900,
                cursor: isSigning ? 'wait' : 'pointer', 
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden',
                minWidth: '140px',
                height: '54px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={e => { 
                if (!isSigning) {
                  (e.currentTarget.style.borderColor = '#6366f1'); 
                  (e.currentTarget.style.color = '#6366f1'); 
                  (e.currentTarget.style.background = '#fafaff'); 
                }
              }}
              onMouseLeave={e => { 
                if (!isSigning) {
                  (e.currentTarget.style.borderColor = '#cbd5e1'); 
                  (e.currentTarget.style.color = '#374151'); 
                  (e.currentTarget.style.background = 'white'); 
                }
              }}
            >
              {isSigning ? (
                <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* Signature Line Animation */}
                  <svg 
                    width="80" 
                    height="30" 
                    viewBox="0 0 80 30" 
                    style={{ position: 'absolute' }}
                  >
                    <path
                      d="M5,20 Q15,5 25,20 T45,20 T65,15 T75,20"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="2"
                      strokeLinecap="round"
                      style={{
                        strokeDasharray: 100,
                        strokeDashoffset: 100,
                        animation: 'signAnimation 1s ease-out forwards',
                      }}
                    />
                    <style>{`
                      @keyframes signAnimation {
                        to {
                          stroke-dashoffset: 0;
                        }
                      }
                    `}</style>
                  </svg>
                  
                  {/* Pen Animation */}
                  <div 
                    style={{
                      position: 'absolute',
                      animation: 'penMove 1s ease-out forwards',
                      transformOrigin: 'bottom center',
                    }}
                  >
                    <style>{`
                      @keyframes penMove {
                        0% {
                          transform: translate(-30px, 10px) rotate(-45deg);
                          opacity: 0;
                        }
                        20% {
                          opacity: 1;
                        }
                        100% {
                          transform: translate(30px, -5px) rotate(-15deg);
                          opacity: 1;
                        }
                      }
                    `}</style>
                    <Pen size={20} color="#6366f1" style={{ transform: 'rotate(-45deg)' }} />
                  </div>
                </div>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Enter
                  <Pen size={18} style={{ opacity: 0.6 }} />
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ===== FEATURE CARDS ===== */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '22px', marginTop: '90px',
        }}>
          {[
            { icon: <Shield size={22} color="#3b82f6" />, title: 'Biometric Security', desc: 'Access your private key securely using fingerprint or face recognition', bg: '#eff6ff', border: '#bfdbfe' },
            { icon: <FileSignature size={22} color="#6366f1" />, title: 'Multi-Party Signing', desc: 'Sequential or parallel signing workflows with deadline tracking', bg: '#eef2ff', border: '#c7d2fe' },
            { icon: <Link2 size={22} color="#10b981" />, title: 'Blockchain Verified', desc: 'Every signature is cryptographically verified and immutable', bg: '#f0fdf4', border: '#a7f3d0' },
          ].map((card, i) => (
            <div key={i} style={{
              background: 'white', borderRadius: '16px',
              border: `1px solid ${card.border}`,
              padding: '28px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { (e.currentTarget.style.transform = 'translateY(-4px)'); (e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'); }}
              onMouseLeave={e => { (e.currentTarget.style.transform = 'translateY(0)'); (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.05)'); }}
            >
              <div style={{
                width: '46px', height: '46px', borderRadius: '12px',
                background: card.bg, display: 'flex',
                alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
              }}>
                {card.icon}
              </div>
              <h3 style={{ fontFamily: 'Open Sans', fontSize: '18px', fontWeight: 900, color: '#0f172a', marginBottom: '8px' }}>
                {card.title}
              </h3>
              <p style={{ fontFamily: 'Cabinet Grotesk', fontSize: '18px', color: '#1f2021', lineHeight: 1.73 }}>
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;