import { useState, useEffect, useMemo } from "react";
import { CertificatePreview } from "@/components/signature/CertificatePreview";
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
  if (role === "institution") {
    return {
      gradient: "linear-gradient(135deg, #16a34a, #059669)",
      btnShadow: "0 4px 12px rgba(22,163,74,0.28)",
      btnShadowHover: "0 8px 20px rgba(22,163,74,0.40)",
      accentColor: "#16a34a",
      cardBorder: "#bbf7d0",
      cardBg: "#f0fdf4",
      pageBg: "#f0faf4",
      blob1: "radial-gradient(circle, #bbf7d0 0%, transparent 70%)",
      blob2: "radial-gradient(circle, #d1fae5 0%, transparent 70%)",
      waitingBg: "#f0fdf4",
      waitingBorder: "#86efac",
      waitingIcon: "#16a34a",
      noticeBg: "#f0fdf4",
      noticeBorder: "#86efac",
      noticeIcon: "#16a34a",
      outlineBorder: "#bbf7d0",
      outlineHover: "#16a34a",
      selfSignBg: "#fef3c7",
      selfSignBorder: "#f59e0b",
      selfSignIcon: "#f59e0b",
    };
  }
  // Student — Purple
  return {
    gradient: "linear-gradient(135deg, #7c3aed, #6366f1)",
    btnShadow: "0 4px 12px rgba(124,58,237,0.28)",
    btnShadowHover: "0 8px 20px rgba(124,58,237,0.40)",
    accentColor: "#7c3aed",
    cardBorder: "#ddd6fe",
    cardBg: "#f5f3ff",
    pageBg: "#f5f3ff",
    blob1: "radial-gradient(circle, #ddd6fe 0%, transparent 70%)",
    blob2: "radial-gradient(circle, #ede9fe 0%, transparent 70%)",
    waitingBg: "#f5f3ff",
    waitingBorder: "#c4b5fd",
    waitingIcon: "#7c3aed",
    noticeBg: "#f5f3ff",
    noticeBorder: "#c4b5fd",
    noticeIcon: "#7c3aed",
    outlineBorder: "#ddd6fe",
    outlineHover: "#7c3aed",
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
        justifyContent: "center", 
        background: t.pageBg 
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
          fontFamily: "Space Grotesk, sans-serif", 
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
        justifyContent: "center", 
        background: t.pageBg 
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
          fontFamily: "Space Grotesk, sans-serif", 
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
        justifyContent: "center", 
        background: t.pageBg 
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
          fontFamily: "Space Grotesk, sans-serif", 
          fontSize: "20px", 
          fontWeight: 700, 
          color: "#0f172a", 
          marginBottom: "16px" 
        }}>
          Certificate Not Found
        </h2>
        <button
          onClick={onBack}
          style={{ 
            padding: "10px 24px", 
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
          Go Back
        </button>
      </div>
    );
  }

  /* ================= MAIN UI ================= */
  return (
    <div style={{ 
      minHeight: "100vh", 
      background: t.pageBg, 
      position: "relative", 
      overflow: "hidden" 
    }}>

      {/* Background blobs */}
      <div style={{ 
        position: "fixed", 
        top: "-100px", 
        right: "-100px", 
        width: "500px", 
        height: "500px", 
        borderRadius: "50%", 
        background: t.blob1, 
        zIndex: 0, 
        pointerEvents: "none" 
      }} />
      <div style={{ 
        position: "fixed", 
        bottom: "-80px", 
        left: "-80px", 
        width: "420px", 
        height: "420px", 
        borderRadius: "50%", 
        background: t.blob2, 
        zIndex: 0, 
        pointerEvents: "none" 
      }} />

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
              fontFamily: "Space Grotesk, sans-serif", 
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
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={onBack}
            style={{ 
              flex: 1, 
              padding: "13px", 
              borderRadius: "10px", 
              border: `1px solid ${t.outlineBorder}`, 
              background: "white", 
              color: "#374151", 
              fontSize: "15px", 
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
          <button
            onClick={handleVerifyAndSign}
            disabled={!signature || isSubmitting || !isMyTurn}
            style={{
              flex: 1, 
              padding: "13px", 
              borderRadius: "10px", 
              border: "none",
              background: !signature || isSubmitting || !isMyTurn ? "#e2e8f0" : t.gradient,
              color: !signature || isSubmitting || !isMyTurn ? "#94a3b8" : "white",
              fontSize: "15px", 
              fontWeight: 600,
              cursor: !signature || isSubmitting || !isMyTurn ? "not-allowed" : "pointer",
              boxShadow: !signature || isSubmitting || !isMyTurn ? "none" : t.btnShadow,
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { 
              if (signature && !isSubmitting && isMyTurn) 
                (e.currentTarget.style.boxShadow = t.btnShadowHover); 
            }}
            onMouseLeave={e => { 
              if (signature && !isSubmitting && isMyTurn) 
                (e.currentTarget.style.boxShadow = t.btnShadow); 
            }}
          >
            {isSubmitting ? "Signing…" : 
             isSelfSign ? "Self-Sign & Verify" : "Verify & Submit Signature"}
          </button>
        </div>

        {/* Biometric Setup Dialog */}
        <Dialog open={showSetupPrompt} onOpenChange={setShowSetupPrompt}>
          <DialogContent style={{ borderRadius: "20px", border: `1px solid ${t.cardBorder}` }}>
            <DialogHeader>
              <DialogTitle style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "10px", 
                fontFamily: "Space Grotesk, sans-serif", 
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