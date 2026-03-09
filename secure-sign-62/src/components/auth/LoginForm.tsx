import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Key, LogIn, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/api/axios';

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
    <div
      style={{ background: '#f0f4f8', position: 'relative', overflow: 'hidden' }}
      className="min-h-screen flex items-center justify-center p-6"
    >
      {/* Background blobs — same as HeroSection */}
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

      <div className="w-full max-w-md" style={{ position: 'relative', zIndex: 1 }}>

        {/* Back Button */}
        <Button variant="ghost" className="mb-6 text-slate-500 hover:text-slate-900" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Card */}
        <div
          style={{
            background: 'white',
            borderRadius: '24px',
            border: '1px solid #bfdbfe',
            boxShadow: '0 8px 32px rgba(99,102,241,0.08), 0 2px 8px rgba(0,0,0,0.06)',
          }}
          className="p-8"
        >
          {/* Icon + Heading */}
          <div className="text-center mb-8">
            <div
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                boxShadow: '0 8px 20px rgba(99,102,241,0.35)',
                borderRadius: '18px',
              }}
              className="w-16 h-16 flex items-center justify-center mx-auto mb-4"
            >
              <Key className="w-8 h-8 text-white" />
            </div>
            <h2
              style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0f172a' }}
              className="text-2xl font-bold mb-2"
            >
              Welcome Back
            </h2>
            <p className="text-slate-500 text-sm">
              Enter your credentials to access your dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <Label htmlFor="email" className="text-slate-700 font-semibold flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className="mt-1.5 bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400"
                disabled={loading}
                autoComplete="email"
              />
            </div>

            {/* Password Field */}
            <div>
              <Label htmlFor="password" className="text-slate-700 font-semibold flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="mt-1.5 bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            {/* Public Key Field */}
            <div>
              <Label htmlFor="publicKey" className="text-slate-700 font-semibold flex items-center gap-2">
                <Key className="w-4 h-4" />
                Public Key
              </Label>
              <Input
                id="publicKey"
                name="publicKey"
                placeholder="0x..."
                value={formData.publicKey}
                onChange={handleChange}
                className="mt-1.5 font-mono text-sm bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400"
                disabled={loading}
              />
              <p className="text-xs text-slate-400 mt-2">
                Your public key was provided when you created your wallet
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px',
                borderRadius: '10px', border: 'none',
                background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                color: 'white', fontSize: '15px', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 6px 20px rgba(99,102,241,0.35)',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                marginTop: '24px',
              }}
              onMouseEnter={e => {
                if (!loading) {
                  (e.currentTarget.style.transform = 'translateY(-2px)');
                  (e.currentTarget.style.boxShadow = '0 10px 28px rgba(99,102,241,0.45)');
                }
              }}
              onMouseLeave={e => {
                (e.currentTarget.style.transform = 'translateY(0)');
                (e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.35)');
              }}
            >
              <LogIn size={16} />
              {loading ? 'Logging in...' : 'Access Dashboard'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};