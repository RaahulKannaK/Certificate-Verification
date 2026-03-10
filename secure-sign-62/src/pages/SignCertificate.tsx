import React, { useState, useEffect, useMemo } from "react";
import { CertificatePreview } from "@/components/signature/CertificatePreview";
import Button from "@/components/context/Button";
import { BiometricVerify } from "@/components/dashboard/BiometricVerify";
import {
  ArrowLeft, Shield, CheckCircle2, AlertCircle, Key, Clock, User,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";

/* ================= TYPES ================= */
type SigningStep = "signature" | "verification" | "complete";

export interface CertificateData {
  credentialId: string;
  title: string;
  filePath?: string;
  purpose?: string;
  status: string;
  signingType: "self" | "sequential" | "parallel";
  studentPublicKey: string;
  institutionPublicKeys: string[];
  txHash?: string;
  issuedAt?: string;
  signatureFields?: any[];
  signers?: any[];
}

/* ================= PROPS ================= */
interface SignCertificateProps {
  credentialId: string;
  onBack: () => void;
}

/* ================= THEME ================= */
const getTheme = (role: string) => {
  return {
    gradient: "linear-gradient(135deg, #1e1a6b, #1e1a6b)",
    btnShadow: "none",
    btnShadowHover: "none",
    accentColor: "#1e1a6b",
    cardBorder: "#c4b5fd",
    cardBg: "#f5f3ff",
    blob1: "radial-gradient(circle, #ddd6fe 0%, transparent 70%)",
    blob2: "radial-gradient(circle, #ede9fe 0%, transparent 70%)",
    waitingBg: "#f5f3ff",
    waitingBorder: "#c4b5fd",
    waitingIcon: "#1e1a6b",
    noticeBg: "#f5f3ff",
    noticeBorder: "#c4b5fd",
    noticeIcon: "#1e1a6b",
    outlineBorder: "#c4b5fd",
    outlineHover: "#1e1a6b",
    selfSignBg: "#fef3c7",
    selfSignBorder: "#f59e0b",
    selfSignIcon: "#f59e0b",
  };
};

/* ================= COMPONENT ================= */
const SignCertificate: React.FC<SignCertificateProps> = ({ credentialId, onBack }) => {
  const { user } = useAuth();
  const t = getTheme(user?.role || "student");

  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [signature, setSignature] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<SigningStep>("signature");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSetupPrompt, setShowSetupPrompt] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /* ================= FETCH CERTIFICATE ================= */
  useEffect(() => {
    const fetchCertificate = async () => {
      if (!credentialId) return;

      setIsLoading(true);
      console.log("🔍 Fetching credential:", credentialId);

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/issuedCredential/${credentialId}`);
        console.log("🔍 Response status:", res.status);

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        console.log("🔍 Response data:", data);

        if (!data.success) {
          toast.error(data.message || "Certificate not found");
          setCertificate(null);
          return;
        }

        // Ensure data structure is correct
        const certData = data.data;
        if (!certData.credentialId) certData.credentialId = credentialId;

        // Ensure institutionPublicKeys is always an array
        if (!Array.isArray(certData.institutionPublicKeys)) {
          certData.institutionPublicKeys = [];
        }

        // Ensure signatureFields is always an array
        if (!Array.isArray(certData.signatureFields)) {
          certData.signatureFields = [];
        }

        // Ensure signers is always an array
        if (!Array.isArray(certData.signers)) {
          certData.signers = [];
        }

        setCertificate(certData);
      } catch (err) {
        console.error("❌ Fetch error:", err);
        toast.error("Failed to load certificate");
        setCertificate(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificate();
  }, [credentialId]);

  /* ================= BIOMETRIC STATUS ================= */
  useEffect(() => {
    const checkBiometricStatus = async () => {
      if (!user?.walletPublicKey) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/biometric/status/${user.walletPublicKey}`);
        const data = await res.json();
        setIsSetupComplete(!!data.enrolled);
      } catch {
        setIsSetupComplete(false);
      }
    };
    checkBiometricStatus();
  }, [user]);

  /* ================= SIGNER TURN ================= */
  const isSelfSign = useMemo(() => {
    return certificate?.signingType === "self";
  }, [certificate]);

  const currentSignerPublicKey = useMemo(() => {
    if (!certificate || certificate.signingType !== "sequential") return null;
    const index = (certificate.signers?.findIndex(s => !s.signed) ?? 0);
    return certificate.signers?.[index]?.signerPublicKey || null;
  }, [certificate]);

  const isMyTurn = useMemo(() => {
    if (!certificate || !user?.walletPublicKey) return false;

    // Self-sign: Only student public key exists, institutionPublicKeys is empty
    if (certificate.signingType === "self") {
      const hasInstitution = certificate.institutionPublicKeys.length > 0;
      const isStudent = certificate.studentPublicKey === user.walletPublicKey;
      // True self-sign: no institution, only student
      return !hasInstitution && isStudent;
    }

    // Parallel: Can sign if in institution list or in signers list
    if (certificate.signingType === "parallel") {
      return certificate.institutionPublicKeys.includes(user.walletPublicKey) ||
        certificate.signers?.some(s => s.signerPublicKey === user.walletPublicKey);
    }

    // Sequential: Must be current signer
    return user.walletPublicKey === currentSignerPublicKey;
  }, [certificate, user, currentSignerPublicKey]);

  /* ================= ACTIVE BOX ================= */
  const activeBox = useMemo(() => {
    if (!certificate?.signatureFields || !user?.walletPublicKey) return null;

    // For self-sign, find the box marked as isStudent
    if (certificate.signingType === "self") {
      return certificate.signatureFields.find((f) =>
        !f.signed && f.isStudent === true
      );
    }

    // For institution sign, find box matching user's key
    return certificate.signatureFields.find((f) =>
      !f.signed && f.signerPublicKey === user.walletPublicKey
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

      // Use single endpoint with isSelfSign flag
      const isSelfSign = certificate?.signingType === "self" ||
        activeBox?.isStudent === true;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/credential/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credentialId: certificate?.credentialId,
          signerPublicKey: user?.walletPublicKey,
          faceImage,
          signature,
          isSelfSign, // Server uses this to determine flow
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      toast.success(isSelfSign ? "Self-signed successfully" : "Signed successfully");
      setCurrentStep("complete");
      setTimeout(onBack, 1800);
    } catch (err: any) {
      toast.error(err.message || "Signing failed");
      setCurrentStep("signature");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerificationFailed = () => {
    toast.error("Face not matched");
    setCurrentStep("signature");
  };

  const handleVerificationCancel = () => setCurrentStep("signature");

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
      <div style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: "#f0fdf4",
          border: "2px solid #86efac",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "20px"
        }}>
          <CheckCircle2 size={44} color="#16a34a" />
        </div>
        <h2 style={{
          fontSize: "24px",
          fontWeight: 800,
          color: "#0f172a",
          marginBottom: "8px"
        }}>
          {isSelfSign ? "Self-Signed Successfully" : "Signed Successfully"}
        </h2>
        <p style={{ fontSize: "15px", color: "#64748b" }}>
          {isSelfSign
            ? "Your self-signed credential is secured on blockchain"
            : "Returning to dashboard…"}
        </p>
      </div>
    );
  }

  /* ================= LOADING ================= */
  if (isLoading) {
    return (
      <div style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{
          width: "64px",
          height: "64px",
          borderRadius: "16px",
          background: t.cardBg,
          border: `1px solid ${t.cardBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px"
        }}>
          <Clock size={30} color={t.accentColor} />
        </div>
        <h2 style={{
          fontSize: "20px",
          fontWeight: 700,
          color: "#0f172a",
          marginBottom: "16px"
        }}>
          Loading Certificate...
        </h2>
      </div>
    );
  }

  /* ================= EMPTY / NOT FOUND ================= */
  if (!certificate) {
    return (
      <div style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{
          width: "64px",
          height: "64px",
          borderRadius: "16px",
          background: t.cardBg,
          border: `1px solid ${t.cardBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px"
        }}>
          <AlertCircle size={30} color={t.accentColor} />
        </div>
        <h2 style={{
          fontSize: "20px",
          fontWeight: 700,
          color: "#0f172a",
          marginBottom: "16px"
        }}>
          Certificate Not Found
        </h2>
        <Button
          onClick={onBack}
          showIcon={false}
          className="!px-6 !py-2 border-none"
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  /* ================= MAIN UI ================= */
  return (
    <div style={{ position: "relative" }}>

      <div style={{
        position: "relative",
        zIndex: 1,
        maxWidth: "900px",
        margin: "0 auto",
        padding: "40px 24px 60px",
        display: "flex",
        flexDirection: "column",
        gap: "24px"
      }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={onBack}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              border: `1px solid ${t.cardBorder}`,
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s",
              flexShrink: 0
            }}
            onMouseEnter={e => {
              (e.currentTarget.style.borderColor = t.accentColor);
              (e.currentTarget.style.background = t.cardBg);
            }}
            onMouseLeave={e => {
              (e.currentTarget.style.borderColor = t.cardBorder);
              (e.currentTarget.style.background = "white");
            }}
          >
            <ArrowLeft size={18} color="#374151" />
          </button>
          <div>
            <h1 style={{
              fontSize: "clamp(1.4rem, 3vw, 2rem)",
              fontWeight: 800,
              color: "#0f172a",
              marginBottom: "4px"
            }}>
              {isSelfSign ? "Self-Sign Certificate" : "Sign Certificate"}
            </h1>
            <p style={{ fontSize: "14px", color: "#64748b" }}>
              {isSelfSign
                ? "Sign your own credential (no institution required)"
                : "Review and digitally sign your credential"}
            </p>
          </div>
        </div>

        {/* Self-Sign Notice */}
        {isSelfSign && (
          <div style={{
            display: "flex",
            gap: "12px",
            padding: "16px 20px",
            borderRadius: "14px",
            border: `1px solid ${t.selfSignBorder}`,
            background: t.selfSignBg
          }}>
            <User size={20} color={t.selfSignIcon} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <p style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#0f172a",
                marginBottom: "2px"
              }}>
                Self-Signing Mode
              </p>
              <p style={{ fontSize: "13px", color: "#64748b" }}>
                You are the only signer. No institution verification required.
                Institution list: {certificate.institutionPublicKeys.length === 0 ? "Empty" : certificate.institutionPublicKeys.join(", ")}
              </p>
            </div>
          </div>
        )}

        {/* Institution Sign Notice */}
        {!isSelfSign && certificate.institutionPublicKeys.length > 0 && (
          <div style={{
            display: "flex",
            gap: "12px",
            padding: "16px 20px",
            borderRadius: "14px",
            border: `1px solid ${t.noticeBorder}`,
            background: t.noticeBg
          }}>
            <Shield size={20} color={t.noticeIcon} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <p style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#0f172a",
                marginBottom: "2px"
              }}>
                {certificate.signingType === "sequential" ? "Sequential Signing" : "Parallel Signing"}
              </p>
              <p style={{ fontSize: "13px", color: "#64748b" }}>
                Institutions: {certificate.institutionPublicKeys.length} signer(s) required
              </p>
            </div>
          </div>
        )}

        {/* Waiting Notice (Sequential) */}
        {certificate.signingType === "sequential" && !isMyTurn && (
          <div style={{
            display: "flex",
            gap: "12px",
            padding: "16px 20px",
            borderRadius: "14px",
            border: `1px solid ${t.waitingBorder}`,
            background: t.waitingBg
          }}>
            <Clock size={20} color={t.waitingIcon} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <p style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#0f172a",
                marginBottom: "2px"
              }}>
                Waiting for previous signer
              </p>
              <p style={{ fontSize: "13px", color: "#64748b" }}>
                This document is signed in sequence. Please wait for your turn.
              </p>
            </div>
          </div>
        )}

        {/* Not My Turn - Self Sign Validation Failed */}
        {certificate.signingType === "self" && !isMyTurn && (
          <div style={{
            display: "flex",
            gap: "12px",
            padding: "16px 20px",
            borderRadius: "14px",
            border: `1px solid #fca5a5`,
            background: "#fef2f2"
          }}>
            <AlertCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <p style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#0f172a",
                marginBottom: "2px"
              }}>
                Not Authorized
              </p>
              <p style={{ fontSize: "13px", color: "#64748b" }}>
                You are not the student who created this self-signed credential.
              </p>
            </div>
          </div>
        )}

        {/* Certificate Preview */}
        <CertificatePreview
          certificate={certificate}
          myPublicKey={user?.walletPublicKey}
          onSignatureChange={setSignature}
        />

        {/* Blockchain Notice */}
        <div style={{
          display: "flex",
          gap: "12px",
          padding: "16px 20px",
          borderRadius: "14px",
          border: `1px solid ${t.noticeBorder}`,
          background: t.noticeBg
        }}>
          <Shield size={20} color={t.noticeIcon} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <p style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#0f172a",
              marginBottom: "2px"
            }}>
              Blockchain Secured
            </p>
            <p style={{ fontSize: "13px", color: "#64748b" }}>
              Signature will be permanently stored on blockchain
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "20px", marginTop: "24px" }}>
          <Button
            onClick={onBack}
            showIcon={false}
            className="flex-1 !py-3 border-none bg-slate-100 hover:bg-slate-200"
          >
            Cancel
          </Button>
          <Button
            onClick={handleVerifyAndSign}
            disabled={!signature || isSubmitting || !isMyTurn}
            className="flex-1 !py-3 border-none"
          >
            {isSubmitting ? "Signing..." :
              isSelfSign ? "Self-Sign & Verify" : "Verify & Submit"}
          </Button>
        </div>

        {/* Biometric Setup Dialog */}
        <Dialog open={showSetupPrompt} onOpenChange={setShowSetupPrompt}>
          <DialogContent style={{ borderRadius: "20px", border: `1px solid ${t.cardBorder}` }}>
            <DialogHeader>
              <DialogTitle style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "18px",
                fontWeight: 700
              }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: t.cardBg,
                  border: `1px solid ${t.cardBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Key size={18} color={t.accentColor} />
                </div>
                Biometric Setup Required
              </DialogTitle>
              <DialogDescription style={{
                fontSize: "14px",
                color: "#64748b",
                marginTop: "6px"
              }}>
                Complete biometric setup before signing certificates.
              </DialogDescription>
            </DialogHeader>

            <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
              <button
                onClick={onBack}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: "10px",
                  border: "none",
                  background: t.gradient,
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: t.btnShadow,
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = t.btnShadowHover)}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = t.btnShadow)}
              >
                Go to Setup
              </button>
              <button
                onClick={() => setShowSetupPrompt(false)}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: "10px",
                  border: `1px solid ${t.outlineBorder}`,
                  background: "white",
                  color: "#374151",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => {
                  (e.currentTarget.style.borderColor = t.outlineHover);
                  (e.currentTarget.style.color = t.accentColor);
                }}
                onMouseLeave={e => {
                  (e.currentTarget.style.borderColor = t.outlineBorder);
                  (e.currentTarget.style.color = "#374151");
                }}
              >
                Cancel
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SignCertificate;