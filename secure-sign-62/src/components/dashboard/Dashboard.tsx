import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { BiometricSetup } from "./BiometricSetup";
import { DocumentSigningFlow } from "../signing/DocumentSigningFlow";
import {
  Copy,
  Check,
  LogOut,
  FileSignature,
  Shield,
  Key,
  Settings,
  Fingerprint,
  ScanFace,
  CreditCard,
  Sparkles,
  Activity,
} from "lucide-react";
import { toast } from "sonner";

interface DashboardProps {
  onNavigate: (view: "digital-signature") => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();

  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [showSigning, setShowSigning] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  if (!user) return null;

  const copyPublicKey = async () => {
    await navigator.clipboard.writeText(user.publicKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
    toast.success("Public key copied!");
  };

  const handleStartSigning = () => {
    if (!user.biometricSetup) {
      toast.info("Please set up biometric authentication first");
      setShowBiometricSetup(true);
      return;
    }
    setShowSigning(true);
  };

  const handleViewCredentials = () => {
    onNavigate("digital-signature");
  };

  if (showSigning) {
    return <DocumentSigningFlow onBack={() => setShowSigning(false)} />;
  }

  if (showBiometricSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <BiometricSetup
          onComplete={() => setShowBiometricSetup(false)}
          onSkip={() => setShowBiometricSetup(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/40">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
              <FileSignature className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              SignChain
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowBiometricSetup(true)}
            >
              <Settings className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              onClick={logout}
              className="hover:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="container mx-auto px-6 py-10">

        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {user.name}
            </span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Securely manage your digital identity and document signatures.
          </p>
        </div>

        {/* STAT CARDS */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">

          {/* Public Key */}
          <div className="rounded-2xl p-6 bg-background border border-border/40 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <Key className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Public Key</h3>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-secondary/40 rounded-lg px-3 py-2 font-mono text-xs truncate">
                {user.publicKey}
              </div>

              <Button variant="ghost" size="icon" onClick={copyPublicKey}>
                {copiedKey ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Security */}
          <div className="rounded-2xl p-6 bg-background border border-border/40 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-accent" />
              <h3 className="font-semibold">Security</h3>
            </div>

            {user.biometricSetup ? (
              <div className="flex items-center gap-2 text-sm">
                {user.biometricType === "fingerprint" ? (
                  <Fingerprint className="w-5 h-5 text-primary" />
                ) : (
                  <ScanFace className="w-5 h-5 text-primary" />
                )}
                <span>
                  {user.biometricType === "fingerprint"
                    ? "Fingerprint Enabled"
                    : "Face Recognition Enabled"}
                </span>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Biometric authentication not configured.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBiometricSetup(true)}
                >
                  Enable Now
                </Button>
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="rounded-2xl p-6 bg-background border border-border/40 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Documents</h3>
            </div>

            <div className="flex justify-between text-sm">
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-muted-foreground">Pending</p>
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-muted-foreground">Signed</p>
              </div>
            </div>
          </div>
        </div>

        {/* ACTION PANEL */}
        <div className="rounded-3xl p-10 bg-gradient-to-br from-primary/10 to-accent/10 border border-border/40 text-center shadow-lg">
          
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/40">
            <Sparkles className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-3xl font-bold mb-3">
            Start Secure Signing
          </h2>

          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Upload documents and initiate secure signing workflows —
            self-signing, sequential approvals, or parallel signatures.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="px-8 py-6 text-base font-semibold shadow-lg hover:scale-105 transition"
              onClick={handleStartSigning}
            >
              Start Signing
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="px-8 py-6 text-base"
              onClick={handleViewCredentials}
            >
              <CreditCard className="w-5 h-5 mr-2" />
              View Credentials
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;