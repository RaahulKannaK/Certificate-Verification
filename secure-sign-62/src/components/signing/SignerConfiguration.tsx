import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SigningType, Signer } from '@/types';
import { Plus, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';

interface SignerConfigurationProps {
  type: SigningType;
  onConfirm: (signers: Signer[]) => void;
}

const signerColors: Array<'signer-1' | 'signer-2' | 'signer-3' | 'signer-4'> = [
  'signer-1',
  'signer-2',
  'signer-3',
  'signer-4',
];

export const SignerConfiguration: React.FC<SignerConfigurationProps> = ({ type, onConfirm }) => {
  const [signers, setSigners] = useState<Partial<Signer>[]>([
    { id: crypto.randomUUID(), name: '', publicKey: '', deadline: '', color: signerColors[0] },
    { id: crypto.randomUUID(), name: '', publicKey: '', deadline: '', color: signerColors[1] },
  ]);

  const addSigner = () => {
    if (signers.length >= 4) {
      toast.error('Maximum 4 signers allowed');
      return;
    }
    setSigners([
      ...signers,
      {
        id: crypto.randomUUID(),
        name: '',
        publicKey: '',
        deadline: '',
        color: signerColors[signers.length],
      },
    ]);
  };

  const removeSigner = (id: string) => {
    if (signers.length <= 2) {
      toast.error('Minimum 2 signers required');
      return;
    }
    setSigners(signers.filter((s) => s.id !== id));
  };

  const updateSigner = (id: string, field: keyof Signer, value: string) => {
    setSigners(
      signers.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleConfirm = () => {
    for (const signer of signers) {
      if (!signer.name || !signer.publicKey) {
        toast.error('Please fill in all signer details');
        return;
      }
      if (type === 'sequential' && !signer.deadline) {
        toast.error('Please set deadlines for all signers');
        return;
      }
    }

    const completedSigners: Signer[] = signers.map((s, index) => ({
      id: s.id!,
      name: s.name!,
      publicKey: s.publicKey!,
      deadline: s.deadline,
      status: 'pending',
      order: type === 'sequential' ? index + 1 : undefined,
      color: s.color!,
    }));

    onConfirm(completedSigners);
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="glass rounded-3xl p-8">
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl font-bold mb-2">
            Configure {type === 'sequential' ? 'Sequential' : 'Parallel'} Signers
          </h2>
          <p className="text-muted-foreground text-sm">
            {type === 'sequential'
              ? 'Signers will sign in the order listed below'
              : 'All signers can sign simultaneously'}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {signers.map((signer, index) => (
            <div
              key={signer.id}
              className="p-6 rounded-2xl border-2 transition-all"
              style={{
                borderColor: `hsl(var(--${signer.color}))`,
                backgroundColor: `hsl(var(--${signer.color}) / 0.05)`,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `hsl(var(--${signer.color}) / 0.2)` }}
                  >
                    <User className="w-5 h-5" style={{ color: `hsl(var(--${signer.color}))` }} />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold">
                      Signer {index + 1}
                      {type === 'sequential' && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (Signs {index === 0 ? 'first' : `after Signer ${index}`})
                        </span>
                      )}
                    </h4>
                  </div>
                </div>
                {signers.length > 2 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSigner(signer.id!)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Name / Role</Label>
                  <Input
                    placeholder="e.g., HR Manager"
                    value={signer.name || ''}
                    onChange={(e) => updateSigner(signer.id!, 'name', e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Public Key (Address)</Label>
                  <Input
                    placeholder="0x..."
                    value={signer.publicKey || ''}
                    onChange={(e) => updateSigner(signer.id!, 'publicKey', e.target.value)}
                    className="mt-1.5 font-mono text-sm"
                  />
                </div>
                {type === 'sequential' && (
                  <div className="md:col-span-2">
                    <Label>Signing Deadline</Label>
                    <Input
                      type="date"
                      value={signer.deadline || ''}
                      onChange={(e) => updateSigner(signer.id!, 'deadline', e.target.value)}
                      className="mt-1.5"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {signers.length < 4 && (
          <Button variant="outline" className="w-full mb-6" onClick={addSigner}>
            <Plus className="w-4 h-4 mr-2" />
            Add Another Signer
          </Button>
        )}

        <Button variant="hero" size="lg" className="w-full" onClick={handleConfirm}>
          Continue to Document Editor
        </Button>
      </div>
    </div>
  );
};
