import React from 'react';
import { Button } from '@/components/ui/button';
import { Shield, FileSignature, Link2 } from 'lucide-react';

interface HeroSectionProps {
  onCreateAccount: () => void;
  onLogin: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onCreateAccount, onLogin }) => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(173_80%_40%/0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(262_83%_58%/0.1),transparent_50%)]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border)/0.5)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.5)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_20%,transparent_100%)]" />

      <div className="relative z-10 container mx-auto px-6 py-20">
        {/* Navigation */}
        <nav className="flex items-center justify-between mb-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <FileSignature className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">SignChain</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onLogin}>Login</Button>
            <Button variant="hero" onClick={onCreateAccount}>Create Account</Button>
          </div>
        </nav>

        {/* Hero content */}
        <div className="max-w-4xl mx-auto text-center mt-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-in">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Secured by Blockchain Technology</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 leading-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Digital Signatures
            <br />
            <span className="gradient-text">Powered by Trust</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Secure, verifiable, and tamper-proof document signing between students and institutions. 
            Your keys, your identity, your signature.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button variant="hero" size="xl" onClick={onCreateAccount}>
              Create Your Wallet
            </Button>
            <Button variant="hero-outline" size="xl" onClick={onLogin}>
              Access Dashboard
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-32 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <FeatureCard
            icon={<Shield className="w-6 h-6" />}
            title="Biometric Security"
            description="Access your private key securely using fingerprint or face recognition"
          />
          <FeatureCard
            icon={<FileSignature className="w-6 h-6" />}
            title="Multi-Party Signing"
            description="Sequential or parallel signing workflows with deadline tracking"
          />
          <FeatureCard
            icon={<Link2 className="w-6 h-6" />}
            title="Blockchain Verified"
            description="Every signature is cryptographically verified and immutable"
          />
        </div>
      </div>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({
  icon,
  title,
  description,
}) => (
  <div className="glass rounded-2xl p-6 hover:bg-secondary/30 transition-all duration-300 group">
    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="font-display text-lg font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm">{description}</p>
  </div>
);
