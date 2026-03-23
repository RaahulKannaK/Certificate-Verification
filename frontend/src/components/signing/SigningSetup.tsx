import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import ThemeButton from '../ui/ThemeButton';
import {
  ArrowLeft,
  Upload,
  FileText,
  Users,
  User,
  ArrowRightLeft,
  Plus,
  Trash2
} from 'lucide-react';
import { SigningType, Signer } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { SigningEditor } from './SigningEditor';

interface SigningSetupProps {
  onBack: () => void;
}

const signerColors: Array<'signer-1' | 'signer-2' | 'signer-3' | 'signer-4'> = [
  'signer-1', 'signer-2', 'signer-3', 'signer-4',
];

const getTheme = (role: string) => {
  return {
    blob1: 'radial-gradient(circle, #ddd6fe 0%, transparent 70%)',
    blob2: 'radial-gradient(circle, #ede9fe 0%, transparent 70%)',
    gradient: 'linear-gradient(135deg, #1e1a6b, #1e1a6b)',
    shadow: 'none',
    cardBorder: '#c4b5fd',
    cardHoverBorder: '#1e1a6b',
    cardIconBg: '#f5f3ff',
    iconColor: '#1e1a6b',
    badgeBg: '#f5f3ff',
    badgeBorder: '#c4b5fd',
    badgeColor: '#1e1a6b',
    uploadBorder: '#c4b5fd',
    uploadBg: '#f5f3ff',
    uploadHoverBg: '#eeedf9',
    backHover: '#f5f3ff',
    inputBorder: '#c4b5fd',
    inputFocus: '#1e1a6b',
    labelColor: '#374151',
    addBtnBorder: '#c4b5fd',
    addBtnColor: '#1e1a6b',
    addBtnHoverBg: '#f5f3ff',
    removeBtnHover: '#fff1f2',
  };
};

export const SigningSetup: React.FC<SigningSetupProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'upload' | 'type' | 'signers' | 'editor'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [signingType, setSigningType] = useState<SigningType | null>(null);
  const [signers, setSigners] = useState<Partial<Signer>[]>([
    { id: crypto.randomUUID(), name: '', publicKey: '', deadline: '', color: signerColors[0] },
    { id: crypto.randomUUID(), name: '', publicKey: '', deadline: '', color: signerColors[1] },
  ]);

  const t = getTheme(user?.role || 'student');

  /* ================= FILE ================= */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (selectedFile.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }
    setFile(selectedFile);
    setStep('type');
    toast.success('Document uploaded successfully');
  };

  /* ================= SIGN TYPE ================= */
  const handleTypeSelect = (type: SigningType) => {
    setSigningType(type);
    if (type === 'self') {
      setStep('editor');
    } else {
      setStep('signers');
    }
  };

  /* ================= SIGNERS CONFIG ================= */
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

  const handleSignersConfirm = () => {
    for (const signer of signers) {
      if (!signer.name || !signer.publicKey) { toast.error('Please fill in all signer details'); return; }
      if (signingType === 'sequential' && !signer.deadline) { toast.error('Please set deadlines for all signers'); return; }
    }
    setStep('editor');
  };

  /* ================= UI ================= */
  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>

      <div style={{ position: 'relative', zIndex: 1 }} className="container mx-auto px-6 py-8">
        <ThemeButton
          onClick={step === 'upload' ? onBack : () => {
            if (step === 'type') setStep('upload');
            else if (step === 'signers') setStep('type');
            else if (step === 'editor') setStep(signingType === 'self' ? 'type' : 'signers');
          }}
          showIcon={false}
          className="!px-6 !py-2 border-none mb-6"
        >
          <ArrowLeft size={16} className="mr-2" /> Back
        </ThemeButton>

        {/* UPLOAD STEP */}
        {step === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <div style={{ background: 'rgba(255, 255, 255, 0.45)', backdropFilter: 'blur(16px)', borderRadius: '24px', border: `1px solid ${t.cardBorder}`, padding: '48px 40px', textAlign: 'center' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: t.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Upload size={32} color="white" />
              </div>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Upload Document</h2>
              <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '28px' }}>Upload a PDF file to begin the signing process</p>
              <div
                onClick={() => document.getElementById('pdf-upload-input')?.click()}
                style={{ border: `2px dashed ${t.uploadBorder}`, borderRadius: '16px', padding: '40px 24px', cursor: 'pointer', background: t.uploadBg, transition: 'all 0.2s' }}
                onMouseEnter={e => { (e.currentTarget.style.background = t.uploadHoverBg); (e.currentTarget.style.borderColor = t.iconColor); }}
                onMouseLeave={e => { (e.currentTarget.style.background = t.uploadBg); (e.currentTarget.style.borderColor = t.uploadBorder); }}
              >
                <FileText size={36} color={t.iconColor} style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: '15px', fontWeight: 600, color: t.iconColor, marginBottom: '4px' }}>Click to upload PDF</p>
                <p style={{ fontSize: '13px', color: '#94a3b8' }}>Only PDF files are supported</p>
              </div>
              <input id="pdf-upload-input" type="file" accept="application/pdf" hidden onChange={handleFileUpload} />
            </div>
          </div>
        )}

        {/* TYPE STEP */}
        {step === 'type' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '26px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Choose Signing Type</h2>
              <p style={{ fontSize: '15px', color: '#64748b' }}>Select how you want the document to be signed</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <SigningTypeCard icon={<User size={28} color={t.iconColor} />} title="Self" description="Only you sign the document" onClick={() => handleTypeSelect('self')} theme={t} />
              <SigningTypeCard icon={<Users size={28} color={t.iconColor} />} title="Sequential" description="HOD → Principal → Student, in order" onClick={() => handleTypeSelect('sequential')} theme={t} />
              <SigningTypeCard icon={<ArrowRightLeft size={28} color={t.iconColor} />} title="Parallel" description="All signers sign at the same time" onClick={() => handleTypeSelect('parallel')} theme={t} />
            </div>
          </div>
        )}

        {/* SIGNERS STEP */}
        {step === 'signers' && signingType && (
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            <div style={{ background: 'white', borderRadius: '24px', border: `1px solid ${t.cardBorder}`, padding: '40px' }}>
              <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: t.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <User size={26} color="white" />
                </div>
                <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Configure {signingType === 'sequential' ? 'Sequential' : 'Parallel'} Signers</h2>
                <p style={{ fontSize: '14px', color: '#64748b' }}>{signingType === 'sequential' ? 'Signers will sign in the order listed' : 'All signers can sign simultaneously'}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                {signers.map((signer, index) => (
                  <div key={signer.id} style={{ padding: '24px', borderRadius: '16px', border: `1.5px solid hsl(var(--${signer.color}))`, background: `hsl(var(--${signer.color}) / 0.04)` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `hsl(var(--${signer.color}) / 0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={18} style={{ color: `hsl(var(--${signer.color}))` }} />
                        </div>
                        <div>
                          <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Signer {index + 1}</h4>
                        </div>
                      </div>
                      {signers.length > 2 && (
                        <button onClick={() => removeSigner(signer.id!)} style={{ width: '34px', height: '34px', borderRadius: '9px', border: '1px solid #fecdd3', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <Trash2 size={15} color="#f43f5e" />
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                      <input placeholder="Name / Role" value={signer.name || ''} onChange={(e) => updateSigner(signer.id!, 'name', e.target.value)} style={{ width: '100%', padding: '9px 13px', borderRadius: '9px', border: `1px solid ${t.inputBorder}`, fontSize: '14px' }} />
                      <input placeholder="Public Key (0x...)" value={signer.publicKey || ''} onChange={(e) => updateSigner(signer.id!, 'publicKey', e.target.value)} style={{ width: '100%', padding: '9px 13px', borderRadius: '9px', border: `1px solid ${t.inputBorder}`, fontSize: '13px', fontFamily: 'monospace' }} />
                      {signingType === 'sequential' && <input type="date" value={signer.deadline || ''} onChange={(e) => updateSigner(signer.id!, 'deadline', e.target.value)} style={{ gridColumn: '1 / -1', width: '100%', padding: '9px 13px', borderRadius: '9px', border: `1px solid ${t.inputBorder}`, fontSize: '14px' }} />}
                    </div>
                  </div>
                ))}
              </div>
              {signers.length < 4 && (
                <button onClick={addSigner} style={{ width: '100%', padding: '11px', borderRadius: '12px', border: `1.5px dashed ${t.addBtnBorder}`, background: 'transparent', color: t.addBtnColor, fontSize: '14px', fontWeight: 600, cursor: 'pointer', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Plus size={16} /> Add Another Signer
                </button>
              )}
              <ThemeButton onClick={handleSignersConfirm} className="!w-full !py-4 border-none">Continue to Document Editor</ThemeButton>
            </div>
          </div>
        )}

        {/* EDITOR STEP */}
        {step === 'editor' && file && signingType && (
          <SigningEditor
            file={file}
            signingType={signingType}
            signers={signers as Signer[]}
            onComplete={onBack}
          />
        )}
      </div>
    </div>
  );
};

const SigningTypeCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  theme: any;
}> = ({ icon, title, description, onClick, theme: t }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? t.uploadHoverBg : 'rgba(255, 255, 255, 0.45)',
        backdropFilter: 'blur(16px)',
        borderRadius: '18px',
        border: `1px solid ${hovered ? t.cardHoverBorder : t.cardBorder}`,
        padding: '32px 24px',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.2s',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        width: '100%',
      }}
    >
      <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: t.cardIconBg, border: `1px solid ${t.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>{icon}</div>
      <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>{title}</h3>
      <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>{description}</p>
    </button>
  );
};
