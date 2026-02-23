import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Key, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/api/axios';

interface LoginFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onBack, onSuccess }) => {
  const { login } = useAuth();
  const [publicKey, setPublicKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey.trim()) {
      toast.error('Please enter your public key');
      return;
    }
    try {
      setLoading(true);
      console.log('🔑 Attempting login with publicKey:', publicKey);
      const res = await api.post(`${import.meta.env.VITE_API_URL}/login`, {
        publicKey: publicKey.trim(),
      });
      const data = res.data;
      console.log('📦 Login response:', data);
      if (data.user) {
        const success = await login(publicKey.trim());
        if (success) {
          toast.success('Login successful!');
          onSuccess();
        } else {
          toast.error('Failed to set user context');
        }
      } else {
        toast.error('Invalid public key. Please check and try again.');
      }
    } catch (err: any) {
      console.error('❌ Login error:', err);
      toast.error(err?.response?.data?.message || 'Server error during login');
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
              Enter your public key to access your dashboard (student or institution)
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="publicKey" className="text-slate-700 font-semibold">
                Public Key
              </Label>
              <Input
                id="publicKey"
                placeholder="0x..."
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
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