import React, { useState } from 'react';
import { theme } from '../../theme/theme';
import ThemeButton from '../context/Button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Wallet,
  Copy,
  Check,
  Eye,
  EyeOff,
  Lock
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

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      background: theme.colors.background,
      position: 'relative',
      overflow: 'visible',
      touchAction: 'pan-y'
    }}
    className="min-h-screen flex items-start justify-center"
  >
    <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
      {children}
    </div>
  </div>
);

/* ── shared card ── */
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div
    style={{
      background: '#ffffff',
      borderRadius: '20px',
      border: '1px solid #c4b5fd',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
    }}
    className={`p-6 ${className}`}
  >
    {children}
  </div>
);

/* ── shared icon header (Updated for Hero Style) ── */
const HeroHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="text-left mb-4 pt-4 w-full">
    <h1
      style={{
        fontFamily: 'WeSignFont',
        fontSize: 'clamp(1rem, 3vw, 2.8rem)',
        fontWeight: 900,
        lineHeight: 1.1,
        background: `linear-gradient(135deg, ${theme.colors.brand}, ${theme.colors.brandDark})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        marginBottom: '16px'
      }}
    >
      {title}
    </h1>
    <p style={{ fontFamily: 'WeSignFont', fontSize: '14px', color: '#1d1d1e', maxWidth: '600px' }}>
      {subtitle}
    </p>
  </div>
);

/* ── shared submit button ── */
const GradientButton: React.FC<{
  type?: 'submit' | 'button';
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ type = 'button', onClick, disabled, children }) => (
  <ThemeButton
    type={type}
    onClick={onClick}
    disabled={disabled}
    className="!w-full !border-[#1e1a6b]/30"
  >
    {children}
  </ThemeButton>
);

export const CreateAccountForm: React.FC<CreateAccountFormProps> = ({ onBack, onSuccess }) => {
  const [step, setStep] = useState<'form' | 'wallet'>('form');
  const [formData, setFormData] = useState({
    rollNo: '', empId: '', name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'student'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [walletKeys, setWalletKeys] = useState<WalletKeys | null>(null);
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedPrivate, setCopiedPrivate] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address (e.g., abc@gmail.com)');
      return;
    }

    if (formData.phone.length < 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    const isStudent = formData.role === 'student';
    const isInstitution = formData.role === 'institution';

    if (isStudent && (!formData.rollNo || !formData.name || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword)) {
      toast.error('Please fill all mandatory fields for Student');
      return;
    }

    if (isInstitution && (!formData.empId || !formData.name || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword)) {
      toast.error('Please fill all mandatory fields for Institution');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const keys = createWallet();
      const response = await api.post('/signup', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        age: parseInt(formData.age),
        role: formData.role,
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
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
          <HeroHeader
            title="Wallet Created!"
            subtitle="Save these keys securely. You will NOT be able to recover them later."
          />

          <Card className="w-full">

            <div className="space-y-6">
              {/* Public Key */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>
                  Public Key (Wallet Address)
                </label>
                <div className="flex items-center gap-2">
                  <div style={{ background: theme.colors.background, border: '1px solid #e2e8f0', borderRadius: '10px' }}
                    className="flex-1 p-3 font-mono text-xs break-all text-slate-700">
                    {walletKeys.publicKey}
                  </div>
                  <button
                    onClick={() => copyToClipboard(walletKeys.publicKey, 'public')}
                    style={{ background: theme.colors.background, border: '1px solid #c4b5fd', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}
                  >
                    {copiedPublic ? <Check className="w-4 h-4 text-[#1e1a6b]" /> : <Copy className="w-4 h-4 text-slate-500" />}
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
                  <div style={{ background: theme.colors.background, border: '1px solid #e2e8f0', borderRadius: '10px' }}
                    className="flex-1 p-3 font-mono text-xs break-all text-slate-700">
                    {showPrivateKey ? walletKeys.privateKey : '•'.repeat(66)}
                  </div>
                  <button
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    style={{ background: theme.colors.background, border: '1px solid #c4b5fd', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}
                  >
                    {showPrivateKey ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(walletKeys.privateKey, 'private')}
                    style={{ background: theme.colors.background, border: '1px solid #c4b5fd', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}
                  >
                    {copiedPrivate ? <Check className="w-4 h-4 text-[#1e1a6b]" /> : <Copy className="w-4 h-4 text-slate-500" />}
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

  return (
    <PageWrapper>
      <div className="w-full h-screen flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Branding & Info */}
        <div className="w-full lg:w-1/2 flex flex-col p-8 sm:p-12 lg:p-20 lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:justify-start">
          {/* Logo & Project Name & Back Button Area - Strictly Top-Left */}
          <div className="flex flex-col items-start gap-6 mb-8 lg:mb-16">
            <ThemeButton
              onClick={onBack}
              showIcon={false}
              className="!px-4 !py-1.5 !text-xs !border-[#1e1a6b]/20"
            >
              <ArrowLeft size={14} className="mr-1" /> Back to Home
            </ThemeButton>

            <div className="flex items-center gap-4">
              <img
                src="/images/logo.png"
                alt="SigNemic Logo"
                className="h-10 sm:h-12 w-auto object-contain"
              />
              <span style={{ fontSize: '25px', fontWeight: 700, color: theme.colors.brand, fontFamily: 'WeSignFont' }}>
                SigNemic
              </span>
            </div>
          </div>

          {/* Title & Description - "Too Big" Font - Moved Upward & Rightward */}
          <div className="flex flex-col items-start mt-auto mb-auto lg:mt-0 lg:mb-0 lg:flex-grow lg:justify-start lg:pt-12 lg:pl-12">
            <h1
              style={{
                fontFamily: 'WeSignFont',
                fontSize: 'clamp(3.5rem, 8vw, 6rem)',
                fontWeight: 900,
                lineHeight: 1.1,
                background: `linear-gradient(135deg, ${theme.colors.brand}, ${theme.colors.brandDark})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '20px',
                letterSpacing: '-0.02em',
                paddingBottom: '8px'
              }}
            >
              Register
            </h1>
            <p style={{
              fontFamily: 'WeSignFont',
              fontSize: '18px',
              color: '#1d1d1e',
              maxWidth: '450px',
              lineHeight: 1.6,
              opacity: 0.9
            }}>
              Fill in your details to register the account.
            </p>
          </div>
        </div>

        {/* Right Side: Form Area -> Fixed & Centered */}
        <div className="w-full lg:w-1/2 lg:ml-[50%] flex justify-center items-center h-full p-4 sm:p-10">
          <div className="w-full max-w-lg">
            <Card className="!p-7">
              {/* Role Switcher */}
              <div className="flex items-center justify-end gap-6 mb-8 border-b border-slate-200 pb-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'institution' })}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                    background: formData.role === 'institution' ? theme.colors.brand : 'transparent',
                    color: formData.role === 'institution' ? '#fff' : '#64748b',
                  }}
                >
                  Institution
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'student' })}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                    background: formData.role === 'student' ? theme.colors.brand : 'transparent',
                    color: formData.role === 'student' ? '#fff' : '#64748b',
                  }}
                >
                  Student
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {(formData.role === 'student'
                  ? [
                    { label: 'Roll No', placeholder: 'Eg: 21CSR001', key: 'rollNo', type: 'text' },
                    { label: 'Full Name', placeholder: 'Eg: Alice', key: 'name', type: 'text' },
                    { label: 'Email', placeholder: 'Eg: abc@gmail.com', key: 'email', type: 'email' },
                    { label: 'Phone No', placeholder: 'Eg: 98674xxxxx ', key: 'phone', type: 'text' },
                    { label: 'Password', placeholder: 'Enter password', key: 'password', type: 'password' },
                    { label: 'Confirm Password', placeholder: 'Confirm password', key: 'confirmPassword', type: 'password' },
                  ]
                  : [
                    { label: 'EmpID', placeholder: 'Eg: FAC123', key: 'empId', type: 'text' },
                    { label: 'Full Name', placeholder: 'Eg: Dr. Smith', key: 'name', type: 'text' },
                    { label: 'Email', placeholder: 'Eg: smith@institution.com', key: 'email', type: 'email' },
                    { label: 'Phone No', placeholder: 'Eg: 98674xxxxx ', key: 'phone', type: 'text' },
                    { label: 'Password', placeholder: 'Enter password', key: 'password', type: 'password' },
                    { label: 'Confirm Password', placeholder: 'Confirm password', key: 'confirmPassword', type: 'password' },
                  ]
                ).map(field => {
                  const isPasswordField = field.key === 'password' || field.key === 'confirmPassword';
                  const showCurrent = field.key === 'password' ? showPassword : showConfirmPassword;
                  const toggleVisibility = field.key === 'password' ? setShowPassword : setShowConfirmPassword;

                  return (
                    <div key={field.key} className="space-y-1.5">
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block' }}>
                        {field.label} <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={isPasswordField ? (showCurrent ? 'text' : 'password') : field.type}
                          placeholder={field.placeholder}
                          value={formData[field.key as keyof typeof formData]}
                          onChange={e => {
                            let val = e.target.value;
                            if (field.key === 'name') val = val.replace(/[^a-zA-Z\s]/g, '');
                            if (field.key === 'phone') val = val.replace(/[^0-9]/g, '');
                            setFormData({ ...formData, [field.key]: val });
                          }}
                          style={{
                            width: '100%', padding: '9px 13px',
                            paddingRight: isPasswordField ? '40px' : '13px',
                            borderRadius: '8px', border: '1.5px solid #c4b5fd',
                            fontSize: '13px', color: '#1e293b', background: '#f8fafc',
                            outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
                          }}
                          onFocus={e => (e.currentTarget.style.borderColor = '#1e1a6b')}
                          onBlur={e => (e.currentTarget.style.borderColor = '#c4b5fd')}
                        />
                        {isPasswordField && (
                          <button
                            type="button"
                            onClick={() => toggleVisibility(!showCurrent)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                          >
                            {showCurrent ? (
                              <EyeOff size={18} style={{ color: '#1e1a6b' }} />
                            ) : (
                              <Eye size={18} style={{ color: '#1e1a6b' }} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div className="pt-2">
                  <GradientButton type="submit">
                    Create Account
                  </GradientButton>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};