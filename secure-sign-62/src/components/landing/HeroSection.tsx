import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, FileSignature, Link2, Menu, X } from 'lucide-react';

interface HeroSectionProps {
  onCreateAccount: () => void;
  onLogin: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onCreateAccount, onLogin }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = ['Home', 'About', 'Features'];

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
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '19px', fontWeight: 700, color: '#1e293b',
            }}>
              SignChain
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div style={{ display: 'flex', gap: '32px' }} className="hidden md:flex">
            {navLinks.map((link) => (
              <a key={link} href="#" style={{
                fontSize: '14px', fontWeight: 500,
                color: '#64748b', textDecoration: 'none',
                transition: 'color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.color = '#1e293b')}
                onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
              >
                {link}
              </a>
            ))}
          </div>

          {/* Desktop Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} className="hidden md:flex">
            <button
              onClick={onLogin}
              style={{
                padding: '8px 20px', borderRadius: '8px',
                border: '1px solid #e2e8f0', background: 'white',
                color: '#374151', fontSize: '14px', fontWeight: 500,
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
                color: 'white', fontSize: '14px', fontWeight: 600,
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget.style.opacity = '0.9'); (e.currentTarget.style.transform = 'translateY(-1px)'); }}
              onMouseLeave={e => { (e.currentTarget.style.opacity = '1'); (e.currentTarget.style.transform = 'translateY(0)'); }}
            >
              Create Account
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
            <a key={link} href="#" onClick={() => setMenuOpen(false)}
              style={{ fontSize: '14px', fontWeight: 500, color: '#374151', textDecoration: 'none' }}>
              {link}
            </a>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
            <button onClick={() => { onLogin(); setMenuOpen(false); }}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 500, cursor: 'pointer', color: '#374151' }}>
              Login
            </button>
            <button onClick={() => { onCreateAccount(); setMenuOpen(false); }}
              style={{ padding: '10px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
              Create Account
            </button>
          </div>
        </div>
      )}

      {/* ===== HERO CONTENT ===== */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', padding: '160px 24px 80px' }}>
        <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto' }}>

          {/* Badge */}
          

          {/* Heading */}
          <h1 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 'clamp(2.6rem, 6vw, 4.8rem)',
            fontWeight: 800, lineHeight: 1.1,
            color: '#0f172a', marginBottom: '24px',
          }}>
            Digital Signatures
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Powered by Trust
            </span>
          </h1>

          {/* Subtext */}
          <p style={{ fontSize: '17px', color: '#64748b', lineHeight: 1.75, maxWidth: '540px', margin: '0 auto 44px' }}>
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
                color: 'white', fontSize: '15px', fontWeight: 600,
                cursor: 'pointer', boxShadow: '0 6px 20px rgba(99,102,241,0.35)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget.style.transform = 'translateY(-2px)'); (e.currentTarget.style.boxShadow = '0 10px 28px rgba(99,102,241,0.45)'); }}
              onMouseLeave={e => { (e.currentTarget.style.transform = 'translateY(0)'); (e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.35)'); }}
            >
              Create Your Wallet
            </button>
            <button
              onClick={onLogin}
              style={{
                padding: '13px 32px', borderRadius: '10px',
                border: '1.5px solid #cbd5e1', background: 'white',
                color: '#374151', fontSize: '15px', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget.style.borderColor = '#6366f1'); (e.currentTarget.style.color = '#6366f1'); (e.currentTarget.style.background = '#fafaff'); }}
              onMouseLeave={e => { (e.currentTarget.style.borderColor = '#cbd5e1'); (e.currentTarget.style.color = '#374151'); (e.currentTarget.style.background = 'white'); }}
            >
              Access Dashboard
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
              <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                {card.title}
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.65 }}>
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({
  icon, title, description,
}) => (
  <div className="glass rounded-2xl p-6 hover:bg-secondary/30 transition-all duration-300 group">
    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="font-display text-lg font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm">{description}</p>
  </div>
);

export default HeroSection;