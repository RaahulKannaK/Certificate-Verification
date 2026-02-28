import React, { useState, useEffect } from 'react';
import { FileSignature, Menu, X, Shield, Link2 } from 'lucide-react';

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
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setAnimationComplete(true), 3000);
    return () => clearTimeout(timer);
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

      {/* ===== HERO CONTENT - SIGNING ANIMATION ===== */}
      <div style={{ 
        position: 'relative', 
        zIndex: 1, 
        maxWidth: '1100px', 
        margin: '0 auto', 
        padding: '160px 24px 80px',
        minHeight: 'calc(100vh - 160px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ 
          position: 'relative',
          width: '100%',
          maxWidth: '600px',
          height: '300px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          
          {/* Paper Background Effect */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
            transform: 'rotate(-2deg)',
          }} />
          
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
            transform: 'rotate(1deg)',
          }} />

          {/* Signature Container */}
          <div style={{
            position: 'relative',
            zIndex: 10,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}>
            
            {/* Grid Lines */}
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 39px, #e2e8f0 39px, #e2e8f0 40px)',
              opacity: 0.5,
            }} />

            {/* Signature SVG */}
            <svg 
              width="400" 
              height="120" 
              viewBox="0 0 400 120" 
              style={{ position: 'relative', zIndex: 5 }}
            >
              <defs>
                <linearGradient id="inkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="50%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>
              </defs>
              
              {/* The Signature Path - "WeSign" in cursive style */}
              <path
                id="signaturePath"
                d="M 40,80 
                   C 40,80 45,60 50,55 
                   C 55,50 60,55 60,65 
                   C 60,75 55,85 50,90
                   M 65,70
                   C 65,70 70,50 75,45
                   C 80,40 85,45 85,55
                   C 85,65 80,75 75,80
                   C 70,85 75,85 80,82
                   M 95,60
                   C 95,60 100,40 105,35
                   C 110,30 115,35 115,45
                   C 115,55 110,65 105,70
                   C 100,75 105,75 110,72
                   M 125,50
                   L 125,85
                   M 125,55
                   C 125,55 135,45 140,50
                   C 145,55 140,65 135,70
                   C 130,75 140,75 145,72
                   M 160,60
                   C 160,60 165,40 170,35
                   C 175,30 180,35 180,45
                   C 180,55 175,65 170,70
                   C 165,75 170,75 175,72
                   M 190,50
                   C 190,50 195,30 200,25
                   C 205,20 210,25 210,35
                   C 210,45 205,55 200,60
                   C 195,65 200,65 205,62
                   M 220,40
                   C 220,40 225,20 230,15
                   C 235,10 240,15 240,25
                   C 240,35 235,45 230,50
                   C 225,55 230,55 235,52
                   M 250,30
                   C 250,30 255,10 260,5
                   C 265,0 270,5 270,15
                   C 270,25 265,35 260,40
                   C 255,45 260,45 265,42
                   M 280,20
                   C 280,20 285,0 290,-5
                   C 295,-10 300,-5 300,5
                   C 300,15 295,25 290,30
                   C 285,35 290,35 295,32
                   M 310,10
                   C 310,10 315,-10 320,-15
                   C 325,-20 330,-15 330,-5
                   C 330,5 325,15 320,20
                   C 315,25 320,25 325,22
                   M 340,0
                   C 340,0 345,-20 350,-25
                   C 355,-30 360,-25 360,-15
                   C 360,-5 355,5 350,10
                   C 345,15 350,15 355,12"
                fill="none"
                stroke="url(#inkGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 2000,
                  strokeDashoffset: 2000,
                  animation: 'drawSignature 3s ease-in-out forwards',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                }}
              />
              
              <style>{`
                @keyframes drawSignature {
                  0% {
                    stroke-dashoffset: 2000;
                    opacity: 0;
                  }
                  10% {
                    opacity: 1;
                  }
                  100% {
                    stroke-dashoffset: 0;
                    opacity: 1;
                  }
                }
              `}</style>
            </svg>

            {/* Realistic Pen */}
            <div 
              style={{
                position: 'absolute',
                zIndex: 20,
                animation: 'penWrite 3s ease-in-out forwards',
                transformOrigin: 'bottom center',
                filter: 'drop-shadow(2px 4px 8px rgba(0,0,0,0.3))',
              }}
            >
              <style>{`
                @keyframes penWrite {
                  0% {
                    transform: translate(-180px, 40px) rotate(-45deg);
                    opacity: 0;
                  }
                  5% {
                    opacity: 1;
                  }
                  100% {
                    transform: translate(180px, -60px) rotate(-15deg);
                    opacity: 1;
                  }
                }
              `}</style>
              
              {/* Pen Body */}
              <div style={{
                width: '120px',
                height: '12px',
                background: 'linear-gradient(180deg, #1e293b 0%, #334155 50%, #1e293b 100%)',
                borderRadius: '6px',
                position: 'relative',
                transform: 'rotate(-90deg)',
              }}>
                {/* Pen Tip */}
                <div style={{
                  position: 'absolute',
                  left: '-8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '0',
                  height: '0',
                  borderTop: '6px solid transparent',
                  borderBottom: '6px solid transparent',
                  borderRight: '10px solid #0f172a',
                }} />
                
                {/* Pen Cap */}
                <div style={{
                  position: 'absolute',
                  right: '-4px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '20px',
                  height: '14px',
                  background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)',
                  borderRadius: '0 6px 6px 0',
                  boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.2)',
                }} />
                
                {/* Clip */}
                <div style={{
                  position: 'absolute',
                  right: '8px',
                  top: '-4px',
                  width: '4px',
                  height: '20px',
                  background: '#4f46e5',
                  borderRadius: '2px',
                }} />
              </div>
            </div>

            {/* Ink Dots/Effects */}
            <div style={{
              position: 'absolute',
              width: '4px',
              height: '4px',
              background: '#1e293b',
              borderRadius: '50%',
              left: '20%',
              top: '45%',
              opacity: 0,
              animation: 'inkDrop 0.3s ease-out 2.8s forwards',
            }}>
              <style>{`
                @keyframes inkDrop {
                  0% { opacity: 0; transform: scale(0); }
                  100% { opacity: 0.6; transform: scale(1); }
                }
              `}</style>
            </div>
          </div>

          {/* Click to Enter Text - Shows after animation */}
          {animationComplete && (
            <div 
              style={{
                position: 'absolute',
                bottom: '40px',
                left: '50%',
                transform: 'translateX(-50%)',
                opacity: 0,
                animation: 'fadeInUp 0.5s ease-out forwards',
                cursor: 'pointer',
              }}
              onClick={onLogin}
            >
              <style>{`
                @keyframes fadeInUp {
                  from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(10px);
                  }
                  to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                  }
                }
              `}</style>
              <span style={{
                fontFamily: 'Cabinet Grotesk',
                fontSize: '14px',
                color: '#64748b',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                transition: 'color 0.2s',
              }}>
                Click to Enter
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ===== FEATURE CARDS ===== */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '22px', marginTop: '0', padding: '0 24px 80px',
        maxWidth: '1100px', marginLeft: 'auto', marginRight: 'auto',
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
  );
};

export default HeroSection;