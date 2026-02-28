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
    const timer = setTimeout(() => setAnimationComplete(true), 3500);
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
          maxWidth: '700px',
          height: '400px',
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
            borderRadius: '16px',
            boxShadow: '0 25px 80px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
            transform: 'rotate(-1.5deg)',
          }} />
          
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '16px',
            boxShadow: '0 25px 80px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
            transform: 'rotate(0.5deg)',
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
            borderRadius: '16px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}>
            
            {/* Grid Lines */}
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 59px, #e2e8f0 59px, #e2e8f0 60px)',
              opacity: 0.4,
            }} />

            {/* Signature SVG - "Sinemic" */}
            <svg 
              width="500" 
              height="160" 
              viewBox="0 0 500 160" 
              style={{ position: 'relative', zIndex: 5 }}
            >
              <defs>
                <linearGradient id="inkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="30%" stopColor="#1e293b" />
                  <stop offset="60%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                <filter id="inkShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="1" dy="2" stdDeviation="1" floodColor="#000000" floodOpacity="0.15"/>
                </filter>
              </defs>
              
              {/* "Sinemic" Signature Path - Elegant cursive */}
              <path
                id="signaturePath"
                d="M 50,100 
                   C 50,100 45,80 50,70 
                   C 55,60 65,55 75,60
                   C 85,65 90,75 85,85
                   C 80,95 70,100 60,95
                   C 50,90 55,80 65,75
                   M 100,85
                   L 100,50
                   C 100,50 105,45 110,50
                   C 115,55 110,60 105,65
                   M 125,70
                   C 125,70 130,50 135,45
                   C 140,40 145,45 145,55
                   C 145,65 140,75 135,80
                   C 130,85 135,85 140,82
                   M 160,60
                   C 160,60 165,40 170,35
                   C 175,30 180,35 180,45
                   C 180,55 175,65 170,70
                   C 165,75 170,75 175,72
                   M 195,50
                   C 195,50 200,30 205,25
                   C 210,20 215,25 215,35
                   C 215,45 210,55 205,60
                   C 200,65 205,65 210,62
                   M 230,40
                   C 230,40 235,20 240,15
                   C 245,10 250,15 250,25
                   C 250,35 245,45 240,50
                   C 235,55 240,55 245,52
                   M 265,30
                   L 265,75
                   M 265,35
                   C 265,35 275,25 280,30
                   C 285,35 280,45 275,50
                   C 270,55 275,55 280,52
                   M 300,45
                   C 300,45 305,25 310,20
                   C 315,15 320,20 320,30
                   C 320,40 315,50 310,55
                   C 305,60 310,60 315,57"
                fill="none"
                stroke="url(#inkGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#inkShadow)"
                style={{
                  strokeDasharray: 1500,
                  strokeDashoffset: 1500,
                  animation: 'drawSignature 3.5s ease-in-out forwards',
                }}
              />
              
              <style>{`
                @keyframes drawSignature {
                  0% {
                    stroke-dashoffset: 1500;
                    opacity: 0;
                  }
                  5% {
                    opacity: 1;
                  }
                  100% {
                    stroke-dashoffset: 0;
                    opacity: 1;
                  }
                }
              `}</style>
            </svg>

            {/* Luxury Pen - 2000 Rupee Style */}
            <div 
              style={{
                position: 'absolute',
                zIndex: 20,
                animation: 'penWrite 3.5s ease-in-out forwards',
                transformOrigin: 'center center',
                filter: 'drop-shadow(4px 8px 16px rgba(0,0,0,0.4))',
              }}
            >
              <style>{`
                @keyframes penWrite {
                  0% {
                    transform: translate(-200px, 50px) rotate(-35deg);
                    opacity: 0;
                  }
                  8% {
                    opacity: 1;
                  }
                  100% {
                    transform: translate(200px, -40px) rotate(-10deg);
                    opacity: 1;
                  }
                }
              `}</style>
              
              {/* Pen Container */}
              <div style={{
                width: '180px',
                height: '24px',
                position: 'relative',
                transform: 'rotate(-90deg)',
              }}>
                
                {/* Pen Tip - Iridium Point */}
                <div style={{
                  position: 'absolute',
                  left: '0',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '0',
                  height: '0',
                  borderTop: '8px solid transparent',
                  borderBottom: '8px solid transparent',
                  borderRight: '12px solid #1a1a1a',
                  zIndex: 10,
                }}>
                  {/* Iridium Ball */}
                  <div style={{
                    position: 'absolute',
                    left: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '4px',
                    height: '4px',
                    background: 'radial-gradient(circle at 30% 30%, #silver, #666)',
                    borderRadius: '50%',
                  }} />
                </div>

                {/* Nib Section - Gold Plated */}
                <div style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '25px',
                  height: '16px',
                  background: 'linear-gradient(180deg, #d4af37 0%, #b8860b 50%, #d4af37 100%)',
                  borderRadius: '2px',
                  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.3)',
                }}>
                  {/* Engraving Lines */}
                  <div style={{
                    position: 'absolute',
                    top: '20%',
                    left: '10%',
                    right: '10%',
                    height: '1px',
                    background: 'rgba(255,255,255,0.4)',
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '10%',
                    right: '10%',
                    height: '1px',
                    background: 'rgba(255,255,255,0.4)',
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: '80%',
                    left: '10%',
                    right: '10%',
                    height: '1px',
                    background: 'rgba(255,255,255,0.4)',
                  }} />
                </div>

                {/* Grip Section - Black Lacquer */}
                <div style={{
                  position: 'absolute',
                  left: '37px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '50px',
                  height: '20px',
                  background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 30%, #0a0a0a 50%, #1a1a1a 70%, #0a0a0a 100%)',
                  borderRadius: '3px',
                  boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.5)',
                }}>
                  {/* Grip Texture Rings */}
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} style={{
                      position: 'absolute',
                      left: `${10 + i * 10}px`,
                      top: '0',
                      width: '2px',
                      height: '100%',
                      background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                    }} />
                  ))}
                </div>

                {/* Barrel - Premium Metal with Gold Accent */}
                <div style={{
                  position: 'absolute',
                  left: '87px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '70px',
                  height: '22px',
                  background: 'linear-gradient(180deg, #1a1a1a 0%, #2a2a2a 20%, #1a1a1a 40%, #2a2a2a 60%, #1a1a1a 80%, #2a2a2a 100%)',
                  borderRadius: '3px',
                  boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.15), inset 0 -1px 3px rgba(0,0,0,0.4)',
                }}>
                  {/* Gold Ring */}
                  <div style={{
                    position: 'absolute',
                    left: '20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '8px',
                    height: '24px',
                    background: 'linear-gradient(180deg, #d4af37 0%, #ffd700 50%, #b8860b 100%)',
                    borderRadius: '2px',
                    boxShadow: '0 0 4px rgba(212,175,55,0.5)',
                  }} />
                  
                  {/* Brand Engraving Area */}
                  <div style={{
                    position: 'absolute',
                    left: '35px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '25px',
                    height: '12px',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '2px',
                  }} />
                </div>

                {/* Cap - Premium Finish */}
                <div style={{
                  position: 'absolute',
                  left: '157px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '35px',
                  height: '24px',
                  background: 'linear-gradient(180deg, #d4af37 0%, #ffd700 30%, #d4af37 50%, #b8860b 70%, #d4af37 100%)',
                  borderRadius: '0 6px 6px 0',
                  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -1px 2px rgba(0,0,0,0.3), 2px 0 8px rgba(0,0,0,0.3)',
                }}>
                  {/* Clip */}
                  <div style={{
                    position: 'absolute',
                    right: '8px',
                    top: '-8px',
                    width: '6px',
                    height: '40px',
                    background: 'linear-gradient(90deg, #d4af37 0%, #ffd700 50%, #b8860b 100%)',
                    borderRadius: '3px 3px 0 0',
                    boxShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                    transform: 'rotate(-5deg)',
                  }} />
                  
                  {/* Top Jewel */}
                  <div style={{
                    position: 'absolute',
                    right: '-4px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '8px',
                    height: '8px',
                    background: 'radial-gradient(circle at 30% 30%, #1a1a1a, #000)',
                    borderRadius: '50%',
                    boxShadow: '0 0 4px rgba(0,0,0,0.5)',
                  }} />
                </div>
              </div>
            </div>

            {/* Ink Splatter Effect */}
            <div style={{
              position: 'absolute',
              width: '6px',
              height: '6px',
              background: '#0f172a',
              borderRadius: '50%',
              left: '15%',
              top: '55%',
              opacity: 0,
              animation: 'inkDrop 0.4s ease-out 3.2s forwards',
              filter: 'blur(0.5px)',
            }}>
              <style>{`
                @keyframes inkDrop {
                  0% { 
                    opacity: 0; 
                    transform: scale(0) translateY(-10px); 
                  }
                  50% {
                    opacity: 0.8;
                    transform: scale(1.5) translateY(0);
                  }
                  100% { 
                    opacity: 0.4; 
                    transform: scale(1) translateY(2px); 
                  }
                }
              `}</style>
            </div>

            {/* Secondary Ink Drops */}
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                position: 'absolute',
                width: `${3 + i}px`,
                height: `${3 + i}px`,
                background: '#1e293b',
                borderRadius: '50%',
                left: `${20 + i * 5}%`,
                top: `${50 + i * 3}%`,
                opacity: 0,
                animation: `inkDrop${i} 0.3s ease-out ${3.3 + i * 0.1}s forwards`,
              }}>
                <style>{`
                  @keyframes inkDrop${i} {
                    0% { opacity: 0; transform: scale(0); }
                    100% { opacity: ${0.3 - i * 0.1}; transform: scale(1); }
                  }
                `}</style>
              </div>
            ))}
          </div>

          {/* Click to Enter Text - Shows after animation */}
          {animationComplete && (
            <div 
              style={{
                position: 'absolute',
                bottom: '30px',
                left: '50%',
                transform: 'translateX(-50%)',
                opacity: 0,
                animation: 'fadeInUp 0.6s ease-out forwards',
                cursor: 'pointer',
              }}
              onClick={onLogin}
            >
              <style>{`
                @keyframes fadeInUp {
                  from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(15px);
                  }
                  to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                  }
                }
              `}</style>
              <span style={{
                fontFamily: 'Cabinet Grotesk',
                fontSize: '13px',
                color: '#64748b',
                letterSpacing: '3px',
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