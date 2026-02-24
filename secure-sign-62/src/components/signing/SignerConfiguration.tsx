import React, { useState } from 'react';
import { SigningType, Signer } from '@/types';
import { Plus, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface SignerConfigurationProps {
  type: SigningType;
  onConfirm: (signers: Signer[]) => void;
}

const signerColors: Array<'signer-1' | 'signer-2' | 'signer-3' | 'signer-4'> = [
  'signer-1', 'signer-2', 'signer-3', 'signer-4',
];

/* ================= THEME ================= */
const getTheme = (role: string) => {
  if (role === 'institution') {
    return {
      pageBg: '#f0faf4',
      blob1: 'radial-gradient(circle, #bbf7d0 0%, transparent 70%)',
      blob2: 'radial-gradient(circle, #d1fae5 0%, transparent 70%)',
      gradient: 'linear-gradient(135deg, #16a34a, #059669)',
      btnShadow: '0 4px 12px rgba(22,163,74,0.28)',
      btnShadowHover: '0 8px 20px rgba(22,163,74,0.40)',
      accentColor: '#16a34a',
      cardBg: 'white',
      cardBorder: '#bbf7d0',
      cardShadow: '0 4px 20px rgba(22,163,74,0.07)',
      inputBorder: '#bbf7d0',
      inputFocus: '#16a34a',
      labelColor: '#374151',
      addBtnBorder: '#86efac',
      addBtnColor: '#16a34a',
      addBtnHoverBg: '#f0fdf4',
      badgeBg: '#f0fdf4',
      badgeBorder: '#86efac',
      badgeColor: '#16a34a',
      removeBtnHover: '#fff1f2',
    };
  }
  // Student — Purple
  return {
    pageBg: '#f5f3ff',
    blob1: 'radial-gradient(circle, #ddd6fe 0%, transparent 70%)',
    blob2: 'radial-gradient(circle, #ede9fe 0%, transparent 70%)',
    gradient: 'linear-gradient(135deg, #7c3aed, #6366f1)',
    btnShadow: '0 4px 12px rgba(124,58,237,0.28)',
    btnShadowHover: '0 8px 20px rgba(124,58,237,0.40)',
    accentColor: '#7c3aed',
    cardBg: 'white',
    cardBorder: '#ddd6fe',
    cardShadow: '0 4px 20px rgba(124,58,237,0.07)',
    inputBorder: '#ddd6fe',
    inputFocus: '#7c3aed',
    labelColor: '#374151',
    addBtnBorder: '#c4b5fd',
    addBtnColor: '#7c3aed',
    addBtnHoverBg: '#f5f3ff',
    badgeBg: '#f5f3ff',
    badgeBorder: '#c4b5fd',
    badgeColor: '#7c3aed',
    removeBtnHover: '#fff1f2',
  };
};

export const SignerConfiguration: React.FC<SignerConfigurationProps> = ({ type, onConfirm }) => {
  const { user } = useAuth();
  const t = getTheme(user?.role || 'student');

  const [signers, setSigners] = useState<Partial<Signer>[]>([
    { id: crypto.randomUUID(), name: '', publicKey: '', deadline: '', color: signerColors[0] },
    { id: crypto.randomUUID(), name: '', publicKey: '', deadline: '', color: signerColors[1] },
  ]);
  const [hoveredRemove, setHoveredRemove] = useState<string | null>(null);
  const [addHovered, setAddHovered] = useState(false);
  const [submitHovered, setSubmitHovered] = useState(false);

  /* ================= LOGIC — UNCHANGED ================= */
  const addSigner = () => {
    if (signers.length >= 4) { toast.error('Maximum 4 signers allowed'); return; }
    setSigners([...signers, { id: crypto.randomUUID(), name: '', publicKey: '', deadline: '', color: signerColors[signers.length] }]);
  };

  const removeSigner = (id: string) => {
    if (signers.length <= 2) { toast.error('Minimum 2 signers required'); return; }
    setSigners(signers.filter((s) => s.id !== id));
  };

  const updateSigner = (id: string, field: keyof Signer, value: string) => {
    setSigners(signers.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleConfirm = () => {
    for (const signer of signers) {
      if (!signer.name || !signer.publicKey) { toast.error('Please fill in all signer details'); return; }
      if (type === 'sequential' && !signer.deadline) { toast.error('Please set deadlines for all signers'); return; }
    }
    const completedSigners: Signer[] = signers.map((s, index) => ({
      id: s.id!, name: s.name!, publicKey: s.publicKey!, deadline: s.deadline,
      status: 'pending', order: type === 'sequential' ? index + 1 : undefined, color: s.color!,
    }));
    onConfirm(completedSigners);
  };

  /* ================= UI ================= */
  return (
    <div style={{ minHeight: '100vh', background: t.pageBg, position: 'relative', overflow: 'hidden' }}>

      {/* Background blobs */}
      <div style={{ position: 'fixed', top: '-100px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: t.blob1, zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-80px', left: '-80px', width: '420px', height: '420px', borderRadius: '50%', background: t.blob2, zIndex: 0, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '760px', margin: '0 auto', padding: '40px 24px 60px' }}>

        {/* Main Card */}
        <div style={{ background: t.cardBg, borderRadius: '24px', border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, padding: '40px' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: t.gradient, boxShadow: t.btnShadow, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <User size={26} color="white" />
            </div>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              Configure {type === 'sequential' ? 'Sequential' : 'Parallel'} Signers
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
              {type === 'sequential'
                ? 'Signers will sign in the order listed below'
                : 'All signers can sign simultaneously'}
            </p>
          </div>

          {/* Signer Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
            {signers.map((signer, index) => (
              <div
                key={signer.id}
                style={{
                  padding: '24px', borderRadius: '16px',
                  border: `1.5px solid hsl(var(--${signer.color}))`,
                  background: `hsl(var(--${signer.color}) / 0.04)`,
                  transition: 'box-shadow 0.2s',
                }}
              >
                {/* Signer Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `hsl(var(--${signer.color}) / 0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={18} style={{ color: `hsl(var(--${signer.color}))` }} />
                    </div>
                    <div>
                      <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                        Signer {index + 1}
                        {type === 'sequential' && (
                          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 400, marginLeft: '8px' }}>
                            (Signs {index === 0 ? 'first' : `after Signer ${index}`})
                          </span>
                        )}
                      </h4>
                      {/* Order badge for sequential */}
                      {type === 'sequential' && (
                        <span style={{ display: 'inline-block', marginTop: '3px', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, background: t.badgeBg, color: t.badgeColor, border: `1px solid ${t.badgeBorder}` }}>
                          Step {index + 1}
                        </span>
                      )}
                    </div>
                  </div>

                  {signers.length > 2 && (
                    <button
                      onClick={() => removeSigner(signer.id!)}
                      onMouseEnter={() => setHoveredRemove(signer.id!)}
                      onMouseLeave={() => setHoveredRemove(null)}
                      style={{
                        width: '34px', height: '34px', borderRadius: '9px', border: '1px solid #fecdd3',
                        background: hoveredRemove === signer.id ? t.removeBtnHover : 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      <Trash2 size={15} color="#f43f5e" />
                    </button>
                  )}
                </div>

                {/* Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  {/* Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: t.labelColor, marginBottom: '6px', letterSpacing: '0.3px' }}>
                      Name / Role
                    </label>
                    <input
                      placeholder="e.g., HR Manager"
                      value={signer.name || ''}
                      onChange={(e) => updateSigner(signer.id!, 'name', e.target.value)}
                      style={{
                        width: '100%', padding: '9px 13px', borderRadius: '9px',
                        border: `1px solid ${t.inputBorder}`, background: '#f8fafc',
                        fontSize: '14px', color: '#0f172a', outline: 'none',
                        transition: 'border 0.2s', boxSizing: 'border-box',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = t.inputFocus)}
                      onBlur={e => (e.currentTarget.style.borderColor = t.inputBorder)}
                    />
                  </div>

                  {/* Public Key */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: t.labelColor, marginBottom: '6px', letterSpacing: '0.3px' }}>
                      Public Key (Address)
                    </label>
                    <input
                      placeholder="0x..."
                      value={signer.publicKey || ''}
                      onChange={(e) => updateSigner(signer.id!, 'publicKey', e.target.value)}
                      style={{
                        width: '100%', padding: '9px 13px', borderRadius: '9px',
                        border: `1px solid ${t.inputBorder}`, background: '#f8fafc',
                        fontSize: '13px', fontFamily: 'monospace', color: '#0f172a',
                        outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = t.inputFocus)}
                      onBlur={e => (e.currentTarget.style.borderColor = t.inputBorder)}
                    />
                  </div>

                  {/* Deadline (sequential only) */}
                  {type === 'sequential' && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: t.labelColor, marginBottom: '6px', letterSpacing: '0.3px' }}>
                        Signing Deadline
                      </label>
                      <input
                        type="date"
                        value={signer.deadline || ''}
                        onChange={(e) => updateSigner(signer.id!, 'deadline', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        style={{
                          width: '100%', padding: '9px 13px', borderRadius: '9px',
                          border: `1px solid ${t.inputBorder}`, background: '#f8fafc',
                          fontSize: '14px', color: '#0f172a', outline: 'none',
                          transition: 'border 0.2s', boxSizing: 'border-box',
                        }}
                        onFocus={e => (e.currentTarget.style.borderColor = t.inputFocus)}
                        onBlur={e => (e.currentTarget.style.borderColor = t.inputBorder)}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Signer Button */}
          {signers.length < 4 && (
            <button
              onClick={addSigner}
              onMouseEnter={() => setAddHovered(true)}
              onMouseLeave={() => setAddHovered(false)}
              style={{
                width: '100%', padding: '11px', borderRadius: '12px',
                border: `1.5px dashed ${t.addBtnBorder}`,
                background: addHovered ? t.addBtnHoverBg : 'transparent',
                color: t.addBtnColor, fontSize: '14px', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s', marginBottom: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              <Plus size={16} /> Add Another Signer
            </button>
          )}

          {/* Continue Button */}
          <button
            onClick={handleConfirm}
            onMouseEnter={() => setSubmitHovered(true)}
            onMouseLeave={() => setSubmitHovered(false)}
            style={{
              width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
              background: t.gradient, color: 'white',
              fontSize: '15px', fontWeight: 700, cursor: 'pointer',
              boxShadow: submitHovered ? t.btnShadowHover : t.btnShadow,
              transform: submitHovered ? 'translateY(-1px)' : 'translateY(0)',
              transition: 'all 0.2s',
            }}
          >
            Continue to Document Editor
          </button>
        </div>
      </div>
    </div>
  );
};