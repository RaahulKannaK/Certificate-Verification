import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
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

interface DocumentSigningFlowProps {
  onBack: () => void;
}

export const DocumentSigningFlow: React.FC<DocumentSigningFlowProps> = ({ onBack }) => {
  const [step, setStep] = useState<'upload' | 'type' | 'signers' | 'editor'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [signingType, setSigningType] = useState<SigningType | null>(null);
  const [signers, setSigners] = useState<Signer[]>([]);

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

    // 🔑 IMPORTANT: assign order ONLY for sequential
    if (signingType === 'sequential') {
      updated = configuredSigners.map((s, index) => ({
        ...s,
        order: index + 1
      }));
    } else {
      // parallel → no order required
      updated = configuredSigners.map(s => ({
        ...s,
        order: undefined
      }));
    }

    setSigners(updated);
    setStep('editor');
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen">
      <div className="relative z-10 container mx-auto px-6 py-8">

        <Button
          variant="ghost"
          className="mb-6"
          onClick={step === 'upload' ? onBack : () => {
            if (step === 'type') setStep('upload');
            else if (step === 'signers') setStep('type');
            else if (step === 'editor') setStep(signingType === 'self' ? 'type' : 'signers');
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* ================= STEPS ================= */}

        {step === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <div className="glass rounded-3xl p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Upload PDF</h2>

              <div
                onClick={() =>
                  document.getElementById('pdf-upload-input')?.click()
                }
                className="border-2 border-dashed rounded-xl p-8 cursor-pointer"
              >
                Click to upload PDF
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

        {step === 'type' && (
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <SigningTypeCard
              icon={<User />}
              title="Self"
              description="Only you sign"
              onClick={() => handleTypeSelect('self')}
            />
            <SigningTypeCard
              icon={<Users />}
              title="Sequential"
              description="HOD → Principal → Student"
              onClick={() => handleTypeSelect('sequential')}
            />
            <SigningTypeCard
              icon={<ArrowRightLeft />}
              title="Parallel"
              description="All signers at once"
              onClick={() => handleTypeSelect('parallel')}
            />
          </div>
        )}

        {step === 'signers' && signingType && (
          <SignerConfiguration
            type={signingType}
            onConfirm={handleSignersConfirm}
          />
        )}

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

/* ================= SMALL COMPONENT ================= */

const SigningTypeCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}> = ({ icon, title, description, onClick }) => (
  <button
    onClick={onClick}
    className="glass rounded-xl p-6 text-left hover:bg-secondary/30"
  >
    <div className="mb-3">{icon}</div>
    <h3 className="font-semibold">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </button>
);
