import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Wallet,
  Copy,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/api/axios';
import { Wallet as EthersWallet } from 'ethers';

interface CreateAccountFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

interface WalletKeys {
  publicKey: string;
  privateKey: string;
}

const createWallet = (): WalletKeys => {
  const wallet = EthersWallet.createRandom();
  return {
    publicKey: wallet.address,
    privateKey: wallet.privateKey
  };
};

/* ── shared page wrapper ── */
const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{ background: '#f0f4f8', position: 'relative', overflow: 'hidden' }}
    className="min-h-screen flex items-center justify-center p-6"
  >
    {/* blobs */}
    <div style={{
      position: 'absolute', top: '-100px', right: '-100px',
      width: '500px', height: '500px', borderRadius: '50%',
      background: 'radial-gradient(circle, #dbeafe 0%, transparent 70%)', zIndex: 0,
    }} />
    <div style={{
      position: 'absolute', bottom: '-80px', left: '-80px',
      width: '420px', height: '420px', borderRadius: '50%',
      background: 'radial-gradient(circle, #ede9fe 0%, transparent 70%)', zIndex: 0,
    }} />
    <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
      {children}
    </div>
  </div>
);

/* ── shared card ── */
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div
    style={{
      background: 'white',
      borderRadius: '24px',
      border: '1px solid #bfdbfe',
      boxShadow: '0 8px 32px rgba(99,102,241,0.08), 0 2px 8px rgba(0,0,0,0.06)',
    }}
    className={`p-8 ${className}`}
  >
    {children}
  </div>
);

/* ── shared icon header ── */
const IconHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
  <div className="text-center mb-8">
    <div
      style={{
        background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
        boxShadow: '0 8px 20px rgba(99,102,241,0.35)',
        borderRadius: '18px',
      }}
      className="w-16 h-16 flex items-center justify-center mx-auto mb-4"
    >
      {icon}
    </div>
    <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0f172a' }} className="text-2xl font-bold mb-2">
      {title}
    </h2>
    <p className="text-slate-500 text-sm">{subtitle}</p>
  </div>
);

/* ── shared submit button ── */
const GradientButton: React.FC<{
  type?: 'submit' | 'button';
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ type = 'button', onClick, disabled, children }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    style={{
      width: '100%', padding: '13px',
      borderRadius: '10px', border: 'none',
      background: disabled ? '#a5b4fc' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
      color: 'white', fontSize: '15px', fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: disabled ? 'none' : '0 6px 20px rgba(99,102,241,0.35)',
      transition: 'all 0.2s',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    }}
    onMouseEnter={e => {
      if (!disabled) {
        (e.currentTarget.style.transform = 'translateY(-2px)');
        (e.currentTarget.style.boxShadow = '0 10px 28px rgba(99,102,241,0.45)');
      }
    }}
    onMouseLeave={e => {
      (e.currentTarget.style.transform = 'translateY(0)');
      (e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.35)');
    }}
  >
    {children}
  </button>
);

export const CreateAccountForm: React.FC<CreateAccountFormProps> = ({ onBack, onSuccess }) => {
  const [step, setStep] = useState<'form' | 'wallet'>('form');
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', age: '', role: 'student'
  });
  const [walletKeys, setWalletKeys] = useState<WalletKeys | null>(null);
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedPrivate, setCopiedPrivate] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.age) {
      toast.error('Please fill all fields');
      return;
    }
    try {
      const keys = createWallet();
      const response = await api.post('/signup', {
        ...formData,
        walletPublicKey: keys.publicKey,
        walletPrivateKeyEncrypted: keys.privateKey
      });
      setWalletKeys(keys);
      setStep('wallet');
      toast.success(response.data.message || 'Account created successfully');
    } catch (err: any) {
      console.error('Signup Error:', err);
      toast.error(err.response?.data?.message || 'Signup failed');
    }
  };

  const copyToClipboard = async (text: string, type: 'public' | 'private') => {
    await navigator.clipboard.writeText(text);
    if (type === 'public') {
      setCopiedPublic(true);
      setTimeout(() => setCopiedPublic(false), 2000);
    } else {
      setCopiedPrivate(true);
      setTimeout(() => setCopiedPrivate(false), 2000);
    }
    toast.success(`${type === 'public' ? 'Public' : 'Private'} key copied`);
  };

  /* ── WALLET DISPLAY STEP ── */
  if (step === 'wallet' && walletKeys) {
    return (
      <PageWrapper>
        <div className="w-full max-w-lg mx-auto">
          <Card>
            <IconHeader
              icon={<Wallet className="w-8 h-8 text-white" />}
              title="Wallet Created!"
              subtitle="Save these keys securely. You will NOT be able to recover them later."
            />

            <div className="space-y-6">
              {/* Public Key */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>
                  Public Key (Wallet Address)
                </label>
                <div className="flex items-center gap-2">
                  <div style={{ background: '#f0f4f8', border: '1px solid #e2e8f0', borderRadius: '10px' }}
                    className="flex-1 p-3 font-mono text-xs break-all text-slate-700">
                    {walletKeys.publicKey}
                  </div>
                  <button
                    onClick={() => copyToClipboard(walletKeys.publicKey, 'public')}
                    style={{ background: '#f0f4f8', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}
                  >
                    {copiedPublic ? <Check className="w-4 h-4 text-indigo-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">Example: <code>0xAbC123...789</code></p>
              </div>

              {/* Private Key */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>
                  Private Key (Keep Secret!)
                </label>
                <div className="flex items-center gap-2">
                  <div style={{ background: '#f0f4f8', border: '1px solid #e2e8f0', borderRadius: '10px' }}
                    className="flex-1 p-3 font-mono text-xs break-all text-slate-700">
                    {showPrivateKey ? walletKeys.privateKey : '•'.repeat(66)}
                  </div>
                  <button
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    style={{ background: '#f0f4f8', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}
                  >
                    {showPrivateKey ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(walletKeys.privateKey, 'private')}
                    style={{ background: '#f0f4f8', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}
                  >
                    {copiedPrivate ? <Check className="w-4 h-4 text-indigo-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
                  </button>
                </div>
                <p style={{ color: '#ef4444' }} className="text-xs mt-2">
                  ⚠️ Never share your private key. Anyone with it can sign documents as you.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <GradientButton onClick={onSuccess}>
                Continue to Login
              </GradientButton>
            </div>
          </Card>
        </div>
      </PageWrapper>
    );
  }

  /* ── FORM STEP ── */
  return (
    <PageWrapper>
      <div className="w-full max-w-md mx-auto">
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            marginBottom: '24px', background: 'none', border: 'none',
            cursor: 'pointer', color: '#64748b', fontSize: '14px', fontWeight: 500,
            transition: 'color 0.2s', padding: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#1e293b')}
          onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <Card>
          <IconHeader
            icon={<Wallet className="w-8 h-8 text-white" />}
            title="Create Your Wallet"
            subtitle="Fill in your details to generate a blockchain wallet"
          />

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Full Name', placeholder: 'Eg: Alice', key: 'name', type: 'text' },
              { label: 'Email', placeholder: 'Eg: abc@gmail.com', key: 'email', type: 'email' },
              { label: 'Phone', placeholder: 'Eg: 98674xxxxx ', key: 'phone', type: 'text' },
              { label: 'Age', placeholder: 'Eg: 19', key: 'age', type: 'number' },
            ].map(field => (
              <div key={field.key}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={formData[field.key as keyof typeof formData]}
                  onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                  style={{
                    width: '100%', padding: '11px 14px',
                    borderRadius: '10px', border: '1.5px solid #e2e8f0',
                    fontSize: '14px', color: '#1e293b', background: '#f8fafc',
                    outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#6366f1')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
                />
              </div>
            ))}

            {/* Role */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                Role
              </label>
              <select
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
                style={{
                  width: '100%', padding: '11px 14px',
                  borderRadius: '10px', border: '1.5px solid #e2e8f0',
                  fontSize: '14px', color: '#1e293b', background: '#f8fafc',
                  outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
                  cursor: 'pointer',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#6366f1')}
                onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
              >
                <option value="student">Student</option>
                <option value="institution">Institution</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="pt-2">
              <GradientButton type="submit">
                Generate Wallet
              </GradientButton>
            </div>
          </form>
        </Card>
      </div>
    </PageWrapper>
  );
};