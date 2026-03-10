import React, { useState } from 'react';
import { theme } from '../../theme/theme';
import ThemeButton from '../context/Button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, LogIn, Mail, Lock, Key } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/api/axios';

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

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div
    style={{
      background: '#ffffff',
      borderRadius: '20px',
      border: '1px solid #c4b5fd',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
    }}
    className={`w-full ${className}`}
  >
    {children}
  </div>
);

const GradientButton: React.FC<{
  children: React.ReactNode;
  type?: 'submit' | 'button';
  onClick?: () => void;
  disabled?: boolean;
}> = ({ children, type = 'button', onClick, disabled }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className="w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-white font-bold transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
    style={{
      background: `linear-gradient(135deg, ${theme.colors.brand}, ${theme.colors.brandDark})`,
      fontSize: '14px'
    }}
  >
    {children}
  </button>
);

interface LoginFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onBack, onSuccess }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    publicKey: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.email.trim()) {
      toast.error('Please enter your email');
      return;
    }
    if (!formData.password.trim()) {
      toast.error('Please enter your password');
      return;
    }
    if (!formData.publicKey.trim()) {
      toast.error('Please enter your public key');
      return;
    }

    try {
      setLoading(true);
      console.log('🔑 Attempting login with:', {
        email: formData.email,
        publicKey: formData.publicKey
      });

      // DEBUG: Log the exact URL being called
      const loginUrl = `${import.meta.env.VITE_API_URL}/login`;
      console.log('🌐 API URL:', loginUrl);

      const res = await api.post(loginUrl, {
        email: formData.email.trim(),
        password: formData.password,
        publicKey: formData.publicKey.trim(),
      });

      console.log('📦 Full login response:', res);
      console.log('📦 Response data:', res.data);
      console.log('📦 Response status:', res.status);

      const data = res.data;

      if (data.user) {
        console.log('👤 User found in response, calling AuthContext login...');

        // Pass all credentials to login context
        const success = await login({
          email: formData.email.trim(),
          password: formData.password,
          publicKey: formData.publicKey.trim(),
          userData: data.user // Pass the user data from server
        });

        console.log('✅ AuthContext login success:', success);

        if (success) {
          toast.success('Login successful!');
          onSuccess();
        } else {
          toast.error('Failed to set user context');
        }
      } else {
        console.log('❌ No user in response data');
        toast.error('Invalid credentials. Please check and try again.');
      }
    } catch (err: any) {
      console.error('❌ Full error object:', err);
      console.error('❌ Error response:', err?.response);
      console.error('❌ Error response data:', err?.response?.data);
      console.error('❌ Error message:', err?.message);
      console.error('❌ Error status:', err?.response?.status);

      // More specific error messages
      if (err?.response?.status === 401) {
        toast.error('Invalid password');
      } else if (err?.response?.status === 404) {
        toast.error('User not found. Check your email and public key.');
      } else if (err?.response?.status === 500) {
        toast.error(`Server error: ${err?.response?.data?.error || 'Unknown error'}`);
      } else {
        toast.error(err?.response?.data?.message || 'Server error during login');
      }
    } finally {
      setLoading(false);
    }
  };

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
              Login
            </h1>
            <p style={{
              fontFamily: 'WeSignFont',
              fontSize: '18px',
              color: '#1d1d1e',
              maxWidth: '450px',
              lineHeight: 1.6,
              opacity: 0.9
            }}>
              Enter your public key to access your dashboard (student or institution)
            </p>
          </div>
        </div>

        {/* Right Side: Form Area -> Fixed & Centered */}
        <div className="w-full lg:w-1/2 lg:ml-[50%] flex justify-center items-center h-full p-4 sm:p-10">
          <div className="w-full max-w-lg">
            <Card className="!p-7">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-slate-700 font-semibold flex items-center gap-2" style={{ fontSize: '12px' }}>
                    <Mail className="w-4 h-4" />
                    Email <span style={{ color: '#ef4444' }}>*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400"
                    style={{ height: '40px', fontSize: '13px' }}
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-slate-700 font-semibold flex items-center gap-2" style={{ fontSize: '12px' }}>
                    <Lock className="w-4 h-4" />
                    Password <span style={{ color: '#ef4444' }}>*</span>
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400"
                    style={{ height: '40px', fontSize: '13px' }}
                    disabled={loading}
                    autoComplete="current-password"
                  />
                </div>

                {/* Public Key Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="publicKey" className="text-slate-700 font-semibold flex items-center gap-2" style={{ fontSize: '12px' }}>
                    <Key className="w-4 h-4" />
                    Public Key <span style={{ color: '#ef4444' }}>*</span>
                  </Label>
                  <Input
                    id="publicKey"
                    name="publicKey"
                    placeholder="0x..."
                    value={formData.publicKey}
                    onChange={handleChange}
                    className="font-mono text-sm bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400"
                    style={{ height: '40px', fontSize: '13px' }}
                    disabled={loading}
                  />
                  <p style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                    Your public key was provided when you created your wallet
                  </p>
                </div>

                <div className="pt-2">
                  <GradientButton type="submit" disabled={loading}>
                    <LogIn size={16} className="mr-1" />
                    {loading ? 'Logging in...' : 'Login'}
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