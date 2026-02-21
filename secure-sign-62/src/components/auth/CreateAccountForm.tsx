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

/* =========================
   ✅ REAL ETH WALLET CREATION
   ========================= */
const createWallet = (): WalletKeys => {
  const wallet = EthersWallet.createRandom();

  return {
    publicKey: wallet.address,      // ✅ Valid Ethereum address
    privateKey: wallet.privateKey   // ✅ Valid private key
  };
};

export const CreateAccountForm: React.FC<CreateAccountFormProps> = ({
  onBack,
  onSuccess
}) => {
  const [step, setStep] = useState<'form' | 'wallet'>('form');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    role: 'student'
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
      // 🔐 Generate Ethereum wallet
      const keys = createWallet();

      // 📡 Send to backend
      const response = await api.post('/signup', {
        ...formData,
        walletPublicKey: keys.publicKey,
        walletPrivateKeyEncrypted: keys.privateKey // (encrypt later)
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

  /* =========================
     🔑 WALLET DISPLAY STEP
     ========================= */
  if (step === 'wallet' && walletKeys) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <div className="glass rounded-3xl p-8 animate-scale-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="font-display text-2xl font-bold mb-2">Wallet Created!</h2>
              <p className="text-muted-foreground text-sm">
                Save these keys securely. You will NOT be able to recover them later.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Public Key (Wallet Address)
                </Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-secondary/50 rounded-lg p-3 font-mono text-xs break-all">
                    {walletKeys.publicKey}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(walletKeys.publicKey, 'public')}>
                    {copiedPublic ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Example: <code>0xAbC123...789</code>
                </p>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Private Key (Keep Secret!)
                </Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-secondary/50 rounded-lg p-3 font-mono text-xs break-all">
                    {showPrivateKey ? walletKeys.privateKey : '•'.repeat(66)}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowPrivateKey(!showPrivateKey)}>
                    {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(walletKeys.privateKey, 'private')}>
                    {copiedPrivate ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-destructive mt-2">
                  ⚠️ Never share your private key. Anyone with it can sign documents as you.
                </p>
              </div>
            </div>

            <Button variant="hero" size="lg" className="w-full mt-8" onClick={onSuccess}>
              Continue to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* =========================
     📝 FORM STEP
     ========================= */
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Button variant="ghost" className="mb-6" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="glass rounded-3xl p-8 animate-scale-in">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-2">Create Your Wallet</h2>
            <p className="text-muted-foreground text-sm">
              Fill in your details to generate a blockchain wallet
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input placeholder="Eg: Rahul Kanna" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>

            <div>
              <Label>Email</Label>
              <Input type="email" placeholder="Eg: rahul@gmail.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>

            <div>
              <Label>Phone</Label>
              <Input placeholder="Eg: 9876543210" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </div>

            <div>
              <Label>Age</Label>
              <Input type="number" placeholder="Eg: 21" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} />
            </div>

            <div>
              <Label>Role</Label>
              <select
                className="mt-1.5 w-full rounded-lg border p-3 text-sm"
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="student">Student</option>
                <option value="institution">Institution</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full mt-6">
              Generate Wallet
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
