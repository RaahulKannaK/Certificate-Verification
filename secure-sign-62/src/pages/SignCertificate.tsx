import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { CertificatePreview } from "@/components/signature/CertificatePreview";
import { BiometricVerify } from "@/components/dashboard/BiometricVerify";
import {
  ArrowLeft,
  Shield,
  CheckCircle2,
  AlertCircle,
  Key,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";

/* ================= TYPES ================= */
type SigningStep = "signature" | "verification" | "complete";

export interface CertificateData {
  credentialId: string;
  name: string;
  issuer: string;
  studentName: string;
  date: string;
  type: string;
  description?: string;
  documentUrl?: string;
  filePath?: string;

  signingType: "self" | "sequential" | "parallel";
  institutionPublicKeys: string[];
  currentSignerOrder?: number;
  signatureFields?: any[];
}

/* ================= PROPS ================= */
interface SignCertificateProps {
  credentialId: string;
  onBack: () => void;
}

/* ================= COMPONENT ================= */
const SignCertificate: React.FC<SignCertificateProps> = ({
  credentialId,
  onBack,
}) => {
  const { user } = useAuth();

  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [signature, setSignature] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<SigningStep>("signature");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showSetupPrompt, setShowSetupPrompt] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  /* ================= FETCH CERTIFICATE ================= */
  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/issuedCredential/${credentialId}`
        );

        if (!res.ok) throw new Error("Failed to fetch certificate");

        const data = await res.json();

        if (!data.success) {
          toast.error(data.message || "Certificate not found");
          return;
        }

        if (!data.data.credentialId) data.data.credentialId = credentialId;

        setCertificate(data.data);
      } catch (err) {
        console.error("❌ Fetch error:", err);
        toast.error("Failed to load certificate");
      }
    };

    if (credentialId) fetchCertificate();
  }, [credentialId]);

  /* ================= BIOMETRIC STATUS ================= */
  useEffect(() => {
    const checkBiometricStatus = async () => {
      if (!user?.walletPublicKey) return;

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/biometric/status/${user.walletPublicKey}`
        );
        const data = await res.json();
        setIsSetupComplete(!!data.enrolled);
      } catch {
        setIsSetupComplete(false);
      }
    };

    checkBiometricStatus();
  }, [user]);

  /* ================= SIGNER TURN ================= */
  const currentSignerPublicKey = useMemo(() => {
    if (!certificate || certificate.signingType !== "sequential") return null;
    const index = (certificate.currentSignerOrder || 1) - 1;
    return certificate.institutionPublicKeys?.[index] || null;
  }, [certificate]);

  const isMyTurn = useMemo(() => {
    if (!certificate || !user?.walletPublicKey) return false;

    if (certificate.signingType === "self") return true;

    if (certificate.signingType === "parallel") {
      return certificate.institutionPublicKeys.includes(user.walletPublicKey);
    }

    return user.walletPublicKey === currentSignerPublicKey;
  }, [certificate, user, currentSignerPublicKey]);

  /* ================= ACTIVE BOX ================= */
  const activeBox = useMemo(() => {
    if (!certificate?.signatureFields || !user?.walletPublicKey) return null;

    return certificate.signatureFields.find(
      (f) => !f.signed && f.signerPublicKey === user.walletPublicKey
    );
  }, [certificate, user]);

  /* ================= VERIFY BUTTON ================= */
  const handleVerifyAndSign = () => {
    if (!isMyTurn) return toast.error("Not your signing turn");
    if (!signature) return toast.error("Please provide signature first");

    if (!isSetupComplete) {
      setShowSetupPrompt(true);
      return;
    }

    setCurrentStep("verification");
  };

  /* ================= FINAL SIGN ================= */
  const handleVerificationComplete = async (faceImage: string) => {
    try {
      setIsSubmitting(true);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/credential/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credentialId: certificate?.credentialId,
          signerPublicKey: user?.walletPublicKey,
          faceImage,
          signature,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      toast.success("Signed successfully");
      setCurrentStep("complete");
      setTimeout(onBack, 1800);
    } catch (err) {
      toast.error("Signing failed");
      setCurrentStep("signature");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerificationFailed = () => {
    toast.error("Face not matched");
    setCurrentStep("signature");
  };

  const handleVerificationCancel = () => {
    setCurrentStep("signature");
  };

  /* ================= VERIFICATION SCREEN ================= */
  if (currentStep === "verification" && certificate?.credentialId && user?.walletPublicKey) {
    return (
      <BiometricVerify
        credentialId={certificate.credentialId}
        signerPublicKey={user.walletPublicKey}
        onComplete={handleVerificationComplete}
        onFailed={handleVerificationFailed}
        onCancel={handleVerificationCancel}
      />
    );
  }

  /* ================= SUCCESS ================= */
  if (currentStep === "complete") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <CheckCircle2 className="w-20 h-20 text-success mb-4" />
        <h2 className="text-2xl font-bold">Signed Successfully</h2>
        <p className="text-muted-foreground">Returning to dashboard…</p>
      </div>
    );
  }

  /* ================= EMPTY ================= */
  if (!certificate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="w-16 h-16 mb-4" />
        <h2 className="text-xl font-bold mb-2">Certificate Not Found</h2>
        <Button variant="outline" onClick={onBack}>
          Go Back
        </Button>
      </div>
    );
  }

  /* ================= MAIN UI ================= */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Sign Certificate</h1>
          <p className="text-muted-foreground">
            Review and digitally sign your credential
          </p>
        </div>
      </div>

      {/* Waiting */}
      {certificate.signingType === "sequential" && !isMyTurn && (
        <div className="flex gap-3 p-4 rounded-xl border bg-muted/40">
          <Clock className="w-5 h-5 mt-1" />
          <div>
            <p className="font-medium text-sm">Waiting for previous signer</p>
            <p className="text-xs text-muted-foreground">
              This document is signed in sequence
            </p>
          </div>
        </div>
      )}

      {/* Preview */}
      <CertificatePreview
        certificate={certificate}
        myPublicKey={user?.walletPublicKey}
        onSignatureChange={setSignature}
      />

      {/* Blockchain notice */}
      <div className="flex gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
        <Shield className="w-5 h-5 text-primary mt-1" />
        <div>
          <p className="font-medium text-sm">Blockchain Secured</p>
          <p className="text-xs text-muted-foreground">
            Signature will be permanently stored on blockchain
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onBack}>
          Cancel
        </Button>
        <Button
          variant="gradient"
          className="flex-1"
          disabled={!signature || isSubmitting || !isMyTurn}
          onClick={handleVerifyAndSign}
        >
          {isSubmitting ? "Signing…" : "Verify & Submit Signature"}
        </Button>
      </div>

      {/* Setup dialog */}
      <Dialog open={showSetupPrompt} onOpenChange={setShowSetupPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Biometric Setup Required
            </DialogTitle>
            <DialogDescription>
              Complete biometric setup before signing certificates.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 mt-4">
            <Button variant="gradient" onClick={onBack}>
              Go to Setup
            </Button>
            <Button variant="outline" onClick={() => setShowSetupPrompt(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SignCertificate;

