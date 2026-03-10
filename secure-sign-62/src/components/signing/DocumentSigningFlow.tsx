import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import ThemeButton from '../context/Button';
import {
  ArrowLeft,
  Upload,
  FileText,
  Users,
  User,
  ArrowRightLeft
} from 'lucide-react';
import { SigningType, Signer } from '@/types';
import { SignerConfiguration } from './SignerConfiguration';
import { DocumentEditor } from './DocumentEditor';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface DocumentSigningFlowProps {
  onBack: () => void;
}

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
  };
};

export const DocumentSigningFlow: React.FC<DocumentSigningFlowProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'upload' | 'type' | 'signers' | 'editor'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [signingType, setSigningType] = useState<SigningType | null>(null);
  const [signers, setSigners] = useState<Signer[]>([]);

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

  /* ================= SIGNERS ================= */
  const handleSignersConfirm = (configuredSigners: Signer[]) => {
    let updated = configuredSigners;
    if (signingType === 'sequential') {
      updated = configuredSigners.map((s, index) => ({ ...s, order: index + 1 }));
    } else {
      updated = configuredSigners.map(s => ({ ...s, order: undefined }));
    }
    setSigners(updated);
    setStep('editor');
  };

  /* ================= UI ================= */
  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>

      {/* Background blobs */}
      <div style={{ position: 'fixed', top: '-100px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: t.blob1, zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-80px', left: '-80px', width: '420px', height: '420px', borderRadius: '50%', background: t.blob2, zIndex: 0, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1 }} className="container mx-auto px-6 py-8">

        {/* Back Button */}
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

        {/* ================= UPLOAD STEP ================= */}
        {step === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <div style={{
              background: 'rgba(255, 255, 255, 0.45)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderRadius: '24px',
              border: `1px solid ${t.cardBorder}`,
              boxShadow: `0 8px 32px ${t.shadow}`,
              padding: '48px 40px', textAlign: 'center',
            }}>
              {/* Icon */}
              <div style={{
                width: '72px', height: '72px', borderRadius: '20px',
                background: t.gradient, boxShadow: `0 6px 20px ${t.shadow}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
              }}>
                <Upload size={32} color="white" />
              </div>

              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Upload Document
              </h2>
              <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '28px', lineHeight: 1.6 }}>
                Upload a PDF file to begin the signing process
              </p>

              {/* Drop zone */}
              <div
                onClick={() => document.getElementById('pdf-upload-input')?.click()}
                style={{
                  border: `2px dashed ${t.uploadBorder}`,
                  borderRadius: '16px', padding: '40px 24px',
                  cursor: 'pointer', background: t.uploadBg,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget.style.background = t.uploadHoverBg); (e.currentTarget.style.borderColor = t.iconColor); }}
                onMouseLeave={e => { (e.currentTarget.style.background = t.uploadBg); (e.currentTarget.style.borderColor = t.uploadBorder); }}
              >
                <FileText size={36} color={t.iconColor} style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: '15px', fontWeight: 600, color: t.iconColor, marginBottom: '4px' }}>Click to upload PDF</p>
                <p style={{ fontSize: '13px', color: '#94a3b8' }}>Only PDF files are supported</p>
              </div>

              <input
                id="pdf-upload-input"
                type="file"
                accept="application/pdf"
                hidden
                onChange={handleFileUpload}
              />
            </div>
          </div>
        )}

        {/* ================= TYPE STEP ================= */}
        {step === 'type' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '26px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Choose Signing Type
              </h2>
              <p style={{ fontSize: '15px', color: '#64748b' }}>Select how you want the document to be signed</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <SigningTypeCard
                icon={<User size={28} color={t.iconColor} />}
                title="Self"
                description="Only you sign the document"
                onClick={() => handleTypeSelect('self')}
                theme={t}
              />
              <SigningTypeCard
                icon={<Users size={28} color={t.iconColor} />}
                title="Sequential"
                description="HOD → Principal → Student, in order"
                onClick={() => handleTypeSelect('sequential')}
                theme={t}
              />
              <SigningTypeCard
                icon={<ArrowRightLeft size={28} color={t.iconColor} />}
                title="Parallel"
                description="All signers sign at the same time"
                onClick={() => handleTypeSelect('parallel')}
                theme={t}
              />
            </div>
          </div>
        )}

        {/* ================= SIGNERS STEP ================= */}
        {step === 'signers' && signingType && (
          <SignerConfiguration
            type={signingType}
            onConfirm={handleSignersConfirm}
          />
        )}

        {/* ================= EDITOR STEP ================= */}
        {step === 'editor' && file && signingType && (
          <DocumentEditor
            file={file}
            signingType={signingType}
            signers={signers}
            onComplete={onBack}
          />
        )}

      </div>
    </div>
  );
};

/* ================= SIGNING TYPE CARD ================= */
const SigningTypeCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  theme: ReturnType<typeof getTheme>;
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
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '18px',
        border: `1px solid ${hovered ? t.cardHoverBorder : t.cardBorder}`,
        padding: '32px 24px',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.2s',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 12px 32px ${t.shadow}`
          : '0 4px 16px rgba(0,0,0,0.05)',
        width: '100%',
      }}
    >
      <div style={{
        width: '52px', height: '52px', borderRadius: '14px',
        background: t.cardIconBg,
        border: `1px solid ${t.cardBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '18px',
      }}>
        {icon}
      </div>
      <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
        {title}
      </h3>
      <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
        {description}
      </p>
    </button>
  );
};