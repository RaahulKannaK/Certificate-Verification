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

      // Call backend login API
      // Call backend login API
      const res = await api.post(`${import.meta.env.VITE_API_URL}/login`, {
        publicKey: publicKey.trim(),
      });

      const data = res.data;
      console.log('📦 Login response:', data);

      if (data.user) {
        // Use AuthContext login to set user
        const success = await login(publicKey.trim());
        if (success) {
          toast.success('Login successful!');
          onSuccess(); // proceed to dashboard
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md">
        <Button variant="ghost" className="mb-6" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="glass rounded-3xl p-8 animate-scale-in shadow-lg">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-2">Welcome Back</h2>
            <p className="text-muted-foreground text-sm">
              Enter your public key to access your dashboard (student or institution)
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="publicKey">Public Key</Label>
              <Input
                id="publicKey"
                placeholder="0x..."
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                className="mt-1.5 font-mono text-sm"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Your public key was provided when you created your wallet
              </p>
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full flex items-center justify-center"
              disabled={loading}
            >
              <LogIn className="w-4 h-4 mr-2" />
              {loading ? 'Logging in...' : 'Access Dashboard'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
