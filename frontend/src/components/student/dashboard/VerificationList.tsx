import React, { useState, useRef, useEffect } from "react";
import { 
  Search, 
  Upload, 
  User, 
  Users, 
  GitBranch, 
  X, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Copy,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Fingerprint,
  Key,
  ChevronRight,
  Lock
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../../contexts/AuthContext";
import { ethers } from "ethers";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ImportToMetamask from "./ImportToMetamask";

/* ================= TYPES ================= */
export interface Signer {
  signerPublicKey: string;
  signerOrder: number;
  signed: boolean;
  isStudent: boolean;
  name?: string;
}

export interface Certificate {
  id: string;
  name: string;
  issuer: string;
  issuerEmail: string;
  walletAddress: string;
  date: string;
  status: "pending" | "signed" | "completed";
  type: string;
  signingType: "self" | "sequential" | "parallel";
  description?: string;
  txHash?: string;
  signers: Signer[];
  filePath?: string;
  institutionKeys: string[];
}

type SigningType = "self" | "sequential" | "parallel";
type SigningStage = "idle" | "ecdsa" | "face" | "complete" | "error";

interface VerificationListProps {
  onSign?: (certificate: Certificate, signingType: SigningType) => void;
  onNavigateToSigningView?: (credentialId: string) => void; // NEW: Navigate to SigningView
}

/* ================= THEME ================= */
const t = {
  pageBg: "#f5f3ff",
  gradient: "linear-gradient(135deg, #1e1a6b, #2d2870)",
  btnShadow: "0 4px 12px rgba(30,26,107,0.20)",
  btnShadowHover: "0 8px 20px rgba(30,26,107,0.32)",
  cardBorder: "#c4b5fd",
  cardHoverBg: "#f5f3ff",
  iconColor: "#1e1a6b",
  iconBg: "#f5f3ff",
  badgePending: { bg: "#fef9c3", color: "#a16207", border: "#fde68a" },
  badgeSigned: { bg: "#f0fdf4", color: "#16a34a", border: "#86efac" },
  tabActiveBg: "#1e1a6b",
  inputBorder: "#c4b5fd",
  inputFocus: "#1e1a6b",
  accentColor: "#1e1a6b",
  outlineBorder: "#c4b5fd",
  outlineHover: "#1e1a6b",
  stageColors: {
    pending: "#94a3b8",
    active: "#1e1a6b",
    complete: "#16a34a",
    error: "#dc2626"
  }
};

/* ================= STAGE ROADMAP COMPONENT ================= */
const SigningStageRoadmap: React.FC<{
  currentStage: SigningStage;
  stageError?: string;
}> = ({ currentStage, stageError }) => {
  const stages = [
    { id: "ecdsa", label: "Wallet Signature", icon: Key, description: "Sign with MetaMask" },
    { id: "face", label: "Biometric Verify", icon: Fingerprint, description: "Face verification" },
    { id: "complete", label: "Complete", icon: CheckCircle2, description: "Document signed" }
  ];

  const getStageStatus = (stageId: string) => {
    const stageOrder = ["ecdsa", "face", "complete"];
    const currentIndex = stageOrder.indexOf(currentStage === "idle" ? "ecdsa" : currentStage);
    const stageIndex = stageOrder.indexOf(stageId);
    
    if (currentStage === "error") return "error";
    if (stageIndex < currentIndex) return "complete";
    if (stageIndex === currentIndex) return "active";
    return "pending";
  };

  return (
    <div style={{ 
      background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
      borderRadius: "16px",
      padding: "24px",
      border: "1px solid #e2e8f0",
      marginBottom: "20px"
    }}>
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        position: "relative"
      }}>
        {/* Connecting Line */}
        <div style={{
          position: "absolute",
          top: "24px",
          left: "10%",
          right: "10%",
          height: "3px",
          background: "#e2e8f0",
          zIndex: 0
        }} />
        
        {/* Active Progress Line */}
        <div style={{
          position: "absolute",
          top: "24px",
          left: "10%",
          width: currentStage === "ecdsa" ? "0%" : currentStage === "face" ? "50%" : "80%",
          height: "3px",
          background: "linear-gradient(90deg, #1e1a6b, #16a34a)",
          zIndex: 0,
          transition: "width 0.5s ease"
        }} />

        {stages.map((stage, index) => {
          const status = getStageStatus(stage.id);
          const Icon = stage.icon;
          
          return (
            <div key={stage.id} style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              zIndex: 1,
              flex: 1
            }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: status === "complete" ? "#16a34a" : 
                           status === "active" ? "#1e1a6b" : 
                           status === "error" ? "#dc2626" : "#fff",
                border: `3px solid ${status === "complete" ? "#16a34a" : 
                                      status === "active" ? "#1e1a6b" : 
                                      status === "error" ? "#dc2626" : "#cbd5e1"}`,
                boxShadow: status === "active" ? "0 0 0 4px rgba(30,26,107,0.1)" : "none",
                transition: "all 0.3s ease"
              }}>
                {status === "complete" ? (
                  <CheckCircle2 size={24} color="white" />
                ) : status === "error" ? (
                  <AlertCircle size={24} color="white" />
                ) : (
                  <Icon size={24} color={status === "active" ? "white" : "#94a3b8"} />
                )}
              </div>
              
              <div style={{ textAlign: "center" }}>
                <p style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: status === "active" ? "#1e1a6b" : 
                         status === "complete" ? "#16a34a" :
                         status === "error" ? "#dc2626" : "#64748b",
                  marginBottom: "2px"
                }}>
                  {stage.label}
                </p>
                <p style={{
                  fontSize: "11px",
                  color: "#94a3b8",
                  maxWidth: "100px"
                }}>
                  {status === "active" && currentStage === "ecdsa" ? "Confirm in MetaMask..." :
                   status === "active" && currentStage === "face" ? "Preparing..." :
                   stage.description}
                </p>
              </div>

              {status === "active" && currentStage !== "complete" && (
                <div style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#1e1a6b",
                  animation: "pulse 1.5s infinite",
                  marginTop: "4px"
                }} />
              )}
            </div>
          );
        })}
      </div>

      {stageError && (
        <div style={{
          marginTop: "16px",
          padding: "12px 16px",
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "#dc2626",
          fontSize: "13px"
        }}>
          <AlertCircle size={16} />
          {stageError}
        </div>
      )}
    </div>
  );
};

/* ================= COMPONENT ================= */
const VerificationList: React.FC<VerificationListProps> = ({ 
  onSign, 
  onNavigateToSigningView 
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "signed">("pending");
  const [filterType, setFilterType] = useState<"all" | "self" | "institution">("all");
  const [hoveredCert, setHoveredCert] = useState<string | null>(null);
  
  // Preview Modal State
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Signing Stage State - NEW
  const [signingStage, setSigningStage] = useState<SigningStage>("idle");
  const [stageError, setStageError] = useState<string>("");
  const [signingCertId, setSigningCertId] = useState<string | null>(null);

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTarget, setImportTarget] = useState<{
    portalPublicKey: string;
    role: 'student' | 'institution';
  } | null>(null);
  const [pendingSignData, setPendingSignData] = useState<{
    certificate: Certificate;
    signerData?: Signer;
  } | null>(null);

  /* ================= FETCH ISSUED CERTIFICATES ================= */
  const fetchCertificates = async () => {
    if (!user?.walletPublicKey) return;
    
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/getIssuedCredentials`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletPublicKey: user.walletPublicKey,
            role: user.role
          }),
        }
      );

      const data = await res.json();
      if (!data.success) {
        toast.error("Failed to fetch certificates");
        return;
      }

      const mapped: Certificate[] = data.data.map((c: any) => {
        const isSelfSign = c.signingType === "self";
        
        let issuerName = "Unknown";
        if (c.studentName) {
          issuerName = c.studentName;
        } else if (c.studentPublicKey) {
          issuerName = `${c.studentPublicKey.slice(0, 6)}...${c.studentPublicKey.slice(-4)}`;
        }

        const instKeys = c.institutionPublicKeys ? JSON.parse(c.institutionPublicKeys) : [];

        const mappedSigners: Signer[] = (c.signers || []).map((s: any) => ({
          signerPublicKey: s.signerPublicKey,
          signerOrder: s.signerOrder,
          signed: s.signed === 1 || s.signed === true,
          isStudent: s.isStudent === 1 || s.isStudent === true,
          name: s.isStudent ? (c.studentName || "Student") : `Institution ${s.signerOrder || 1}`
        }));

        mappedSigners.sort((a, b) => a.signerOrder - b.signerOrder);

        return {
          id: c.credentialId,
          name: c.title || "Untitled Certificate",
          issuer: issuerName,
          issuerEmail: c.studentEmail || "",
          walletAddress: c.studentPublicKey,
          date: new Date(c.issuedAt).toLocaleDateString(),
          status: c.status === "completed" ? "signed" : (c.status || "pending"),
          type: c.signingType || "self",
          signingType: c.signingType || "self",
          description: c.purpose || "No description available for this credential.",
          txHash: c.txHash || null,
          signers: mappedSigners,
          filePath: c.filePath,
          institutionKeys: instKeys
        };
      });

      setCertificates(mapped);
    } catch (err) {
      console.error("❌ Error fetching certificates:", err);
      toast.error("Error fetching certificates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [user]);

  /* ================= FILTER ================= */
  const filteredCertificates = certificates.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.issuer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchTab = activeTab === "all" || c.status === activeTab;
    const matchType = 
      filterType === "all" || 
      (filterType === "self" && c.signingType === "self") ||
      (filterType === "institution" && (c.signingType === "sequential" || c.signingType === "parallel"));

    return matchSearch && matchTab && matchType;
  });

  /* ================= HANDLERS ================= */
  const handleSignDocument = async (certificate: Certificate, signerData?: Signer) => {
    console.log("========================================");
    console.log("🔥 handleSignDocument STARTED");
    console.log("========================================");
    console.log("📋 Certificate ID:", certificate?.id);
    console.log("👤 Signer Data:", signerData);
    console.log("🔗 User Wallet:", user?.walletPublicKey);
    
    // Reset states
    setStageError("");
    setSigningStage("ecdsa");
    setSigningCertId(certificate.id);
    
    try {
      setProcessing(true);
      console.log("⏳ Processing set to true");

      if (!window.ethereum) {
        console.error("❌ MetaMask not found");
        toast.error("MetaMask not installed");
        setSigningStage("error");
        setStageError("MetaMask not found");
        return;
      }
      console.log("✅ MetaMask found");
      
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
        });

      console.log("👤 Selected Account:", accounts[0]);
      /* 🔐 Connect wallet */
      console.log("🔐 Connecting to MetaMask...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      console.log("   Provider created");
      
      const signer = await provider.getSigner();
      console.log("   Signer obtained");
      
      const walletAddress = await signer.getAddress();
      console.log("   Wallet Address:", walletAddress);

      /* 🧾 Create message */
      const message = `WSIGN_PROTOCOL_V1\nCredential:${certificate.id}\nSigner:${walletAddress}`;
      console.log("📝 Message to sign:", message);

      /* ✍️ Sign with MetaMask */
      console.log("⏳ Calling signer.signMessage() - MetaMask popup should appear...");
      let signature: string;
      try {
        signature = await signer.signMessage(message);
        console.log("✅ SIGNATURE SUCCESS:", signature.substring(0, 40) + "...");
        console.log("   Full length:", signature.length, "chars");
      } catch (signErr: any) {
        console.error("❌ SIGNING FAILED:", signErr.message);
        setSigningStage("error");
        if (signErr.code === 4001) {
          setStageError("User rejected signature in MetaMask");
          toast.error("User rejected signature in MetaMask");
        } else {
          setStageError("MetaMask signing failed: " + signErr.message);
          toast.error("MetaMask signing failed: " + signErr.message);
        }
        return;
      }

      /* 🚀 Prepare payload for STAGE 1: ECDSA */
      const payload = {
        credentialId: certificate.id,
        signerPublicKey: walletAddress,
        signature: signature,
        message: message,
        stage: "ecdsa", // STAGE 1
        isSelfSign: signerData?.isStudent || false,
      };
      console.log("📦 PAYLOAD TO BACKEND (Stage 1 - ECDSA):", JSON.stringify(payload, null, 2));

      /* 🚀 Send to backend - STAGE 1 */
      const apiUrl = `${import.meta.env.VITE_API_URL}/credential/sign`;
      console.log("🌐 API URL:", apiUrl);
      
      console.log("⏳ Sending Stage 1 to backend...");
      const res = await axios.post(apiUrl, payload);
      console.log("✅ BACKEND RESPONSE (Stage 1):", res.data);

      if (res.data.success && res.data.stage === "ecdsa_complete") {
        // STAGE 1 COMPLETE - Move to Face Verification
        console.log("✅ Stage 1 Complete! Moving to Face Verification...");
        setSigningStage("face");
        
        toast.success("Wallet verified! Redirecting to biometric verification...");
        
        // Close modal if open
        setIsPreviewOpen(false);
        
        // Navigate to SigningView for Stage 2 (Face Verification)
        setTimeout(() => {
          if (onNavigateToSigningView) {
            onNavigateToSigningView(certificate.id);
          } else {
            // Fallback: navigate directly
            navigate(`/sign/${certificate.id}`, { 
              state: { 
                ecdsaToken: res.data.ecdsaToken,
                stage: "face",
                certificate: certificate 
              } 
            });
          }
        }, 1500);
        
      } else {
        console.error("❌ Backend rejected Stage 1:", res.data.message);
        setSigningStage("error");
        setStageError(res.data.message || "Stage 1 verification failed");
        toast.error("❌ Sign failed: " + res.data.message);
      }
    } catch (err: any) {
      console.error("========================================");
      console.error("❌ ERROR in handleSignDocument:");
      console.error("   Error:", err);
      console.error("   Response:", err.response);
      console.error("   Status:", err.response?.status);
      console.error("   Data:", err.response?.data);
      console.error("========================================");
      
      setSigningStage("error");
      
      // Check if it's an axios error with response
      if (err.response) {
        const status = err.response.status;
        const errorData = err.response.data;
        
        console.log(`📛 HTTP ${status} Error:`, errorData);
        
        // 403 - Unauthorized/Not Linked
        if (status === 403) {
          const { 
            yourMetamask, 
            linkedPortalKey, 
            matchType, 
            expectedSigners, 
            hint,
            needsLinking 
          } = errorData;

          // Show toast notification
          toast.error(
            <div>
              <p>Your MetaMask ({yourMetamask?.slice(0, 6)}...) is not linked.</p>
              <p style={{ fontSize: "12px", marginTop: "8px" }}>
                Import your portal key to MetaMask to sign.
              </p>
            </div>,
            { duration: 8000 }
          );

          // CRITICAL: Check if we have expectedSigners
          if (expectedSigners && expectedSigners.length > 0) {
            console.log("🎯 expectedSigners found:", expectedSigners);
            
            // Find the best slot to import
            const userRoleLower = user?.role?.toLowerCase();
            let targetSlot = expectedSigners.find((s: any) => 
              !s.linkedMetamask && s.type?.toLowerCase() === userRoleLower
            );
            
            // Fallback to any unlinked slot
            if (!targetSlot) {
              targetSlot = expectedSigners.find((s: any) => !s.linkedMetamask);
            }
            
            // Fallback to first slot if all linked
            if (!targetSlot) {
              targetSlot = expectedSigners[0];
            }

            if (targetSlot) {
              console.log("✅ Opening import modal for:", targetSlot);
              
              const role = targetSlot.type?.toLowerCase() === 'student' ? 'student' : 'institution';
              
              // Save pending data for retry
              setPendingSignData({ certificate, signerData });
              
              // SET STATE TO SHOW MODAL
              setImportTarget({
                portalPublicKey: targetSlot.portalKey,
                role: role
              });
              setShowImportModal(true);
              
              console.log("🔓 showImportModal set to TRUE");
              return; // Exit early
            }
          } else {
            console.error("❌ No expectedSigners in 403 response!");
            setStageError("Configuration error: No signers found");
            toast.error("Configuration error: No signers found for this credential");
          }
          
          return;
        }
        
        // 400 - Bad Request (validation, already signed, etc.)
        if (status === 400) {
          const { message, pendingOrder, signedAt } = errorData;
          
          if (pendingOrder) {
            setStageError(`Wait for signer order ${pendingOrder} to complete first`);
            toast.error(
              <div>
                <p>Sequential signing order violation</p>
                <p style={{ fontSize: "12px", marginTop: "8px", color: "#64748b" }}>
                  Wait for signer order {pendingOrder} to complete first.
                </p>
              </div>,
              { duration: 8000 }
            );
          } else if (signedAt) {
            setStageError("You have already signed this credential");
            toast.error("You have already signed this credential");
          } else {
            setStageError(message || "Invalid request");
            toast.error(message || "Invalid request");
          }
          return;
        }
      }
      
      // Generic error
      setStageError(err.message || "Error signing document");
      toast.error(err.message || "Error signing document");
      
    } finally {
      if (signingStage !== "face") {
        setProcessing(false);
      }
      console.log("🏁 handleSignDocument FINISHED");
      console.log("========================================");
    }
  };

  const handleStartSigning = async (certificate: Certificate) => {
    console.log("========================================");
    console.log("🚀 handleStartSigning CALLED");
    console.log("   Certificate:", certificate.id);
    console.log("   User biometricSetup:", user?.biometricSetup);
    console.log("   Certificate status:", certificate.status);
    console.log("========================================");

    if (!user?.biometricSetup) {
      console.log("❌ Biometric not setup");
      toast.error("Please complete biometric setup first");
      return;
    }
    if (certificate.status !== "pending") {
      console.log("❌ Certificate not pending");
      toast.info("Certificate already signed");
      return;
    }

    // Find current user's signer data
    const currentSigner = certificate.signers.find(s => {
      const match = s.signerPublicKey.toLowerCase() === user?.walletPublicKey?.toLowerCase();
      console.log("   Checking signer:", s.signerPublicKey, "Match:", match);
      return match;
    });
    
    console.log("👤 Current Signer found:", currentSigner);

    // Call sign with ECDSA (Stage 1)
    console.log("⏳ Calling handleSignDocument...");
    await handleSignDocument(certificate, currentSigner);
    console.log("✅ handleSignDocument completed");
  };

  const openPreview = (cert: Certificate) => {
    setSelectedCert(cert);
    setIsPreviewOpen(true);
    // Reset signing stage when opening preview
    setSigningStage("idle");
    setStageError("");
    setSigningCertId(null);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setTimeout(() => {
      setSelectedCert(null);
      setSigningStage("idle");
      setStageError("");
      setSigningCertId(null);
      setProcessing(false);
    }, 300);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  // Check if current user can sign this credential
  const canUserSign = (cert: Certificate): boolean => {
    if (cert.status !== "pending") return false;
    
    const userSigner = cert.signers.find(s => 
      s.signerPublicKey.toLowerCase() === user?.walletPublicKey?.toLowerCase()
    );
    
    if (!userSigner) return false;
    if (userSigner.signed) return false;
    
    if (cert.signingType === "sequential") {
      const previousSigners = cert.signers.filter(s => s.signerOrder < userSigner.signerOrder);
      const allPreviousSigned = previousSigners.every(s => s.signed);
      if (!allPreviousSigned) return false;
    }
    
    return true;
  };

  // Check if currently signing
  const isCurrentlySigning = signingStage !== "idle" && signingStage !== "error" && signingCertId === selectedCert?.id;

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px 0", position: "relative" }}>
        
        {/* Header Section */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
              My Credentials
            </h1>
            <p style={{ fontSize: "16px", color: "#64748b" }}>View and sign your issued digital credentials.</p>
          </div>
          <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "12px 24px", borderRadius: "12px", border: "none",
                background: t.gradient, color: "white",
                fontSize: "14px", fontWeight: 600, cursor: "pointer",
                boxShadow: t.btnShadow, transition: "all 0.2s",
              }}
            >
              <Upload size={18} /> Upload New
            </button>
            <input ref={fileInputRef} type="file" hidden />
        </div>

        {/* Stats / Filtering Controls */}
        <div style={{ marginBottom: "32px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
          {[
            { type: "all", icon: Users, label: "All Items", count: certificates.length },
            { type: "self", icon: User, label: "Self Signing", count: certificates.filter(c => c.signingType === "self").length },
            { type: "institution", icon: GitBranch, label: "Institution Issued", count: certificates.filter(c => c.signingType !== "self").length },
          ].map(({ type, icon: Icon, label, count }) => (
            <div
              key={type}
              onClick={() => setFilterType(type as any)}
              style={{
                background: "white", borderRadius: "18px", padding: "20px",
                border: `2px solid ${filterType === type ? t.accentColor : '#f1f5f9'}`,
                cursor: "pointer", display: "flex", alignItems: "center", gap: "16px",
                transition: "all 0.2s",
                boxShadow: filterType === type ? '0 10px 20px -5px rgba(30,26,107,0.1)' : 'none'
              }}
            >
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: filterType === type ? t.gradient : t.iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={22} color={filterType === type ? "white" : t.iconColor} />
              </div>
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>{label}</h3>
                <p style={{ fontSize: "13px", color: "#64748b" }}>{count} items</p>
              </div>
            </div>
          ))}
        </div>

        {/* List Container */}
        <div style={{ background: "white", borderRadius: "24px", border: `1px solid #e2e8f0`, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", overflow: "hidden" }}>
          
          {/* List Toolbar */}
          <div style={{ padding: "24px", borderBottom: `1px solid #f1f5f9`, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "20px" }}>
            <div style={{ display: "flex", gap: "8px", background: "#f8fafc", padding: "4px", borderRadius: "10px" }}>
              {(["all", "pending", "signed"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer",
                    fontSize: "13px", fontWeight: 600, transition: "all 0.2s", textTransform: "capitalize",
                    background: activeTab === tab ? "white" : "transparent",
                    color: activeTab === tab ? t.accentColor : "#64748b",
                    boxShadow: activeTab === tab ? "0 2px 4px rgba(0,0,0,0.05)" : "none"
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div style={{ position: "relative", minWidth: "260px" }}>
              <Search size={16} color="#94a3b8" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                style={{ width: "100%", padding: "10px 14px 10px 40px", borderRadius: "12px", border: "1.5px solid #e2e8f0", fontSize: "14px", outline: "none" }}
                placeholder="Search by title or issuer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Actual List */}
          <div style={{ padding: "12px" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>Loading credentials...</div>
            ) : filteredCertificates.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>No credentials found matching your criteria.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {filteredCertificates.map((cert) => {
                  const isHovered = hoveredCert === cert.id;
                  const badge = cert.status === "pending" ? t.badgePending : t.badgeSigned;
                  const userCanSign = canUserSign(cert);
                  const isSigningThisCert = signingCertId === cert.id && signingStage !== "idle";
                  
                  return (
                    <div
                      key={cert.id}
                      onMouseEnter={() => setHoveredCert(cert.id)}
                      onMouseLeave={() => setHoveredCert(null)}
                      onClick={() => openPreview(cert)}
                      style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "16px 20px", borderRadius: "16px",
                        background: isHovered ? "#f8fafc" : "transparent",
                        border: `1px solid ${isHovered ? "#e2e8f0" : "transparent"}`,
                        transition: "all 0.2s",
                        cursor: "pointer",
                        opacity: isSigningThisCert ? 0.7 : 1
                      }}
                    >
                      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                        <div style={{ 
                          width: "44px", 
                          height: "44px", 
                          borderRadius: "12px", 
                          background: isSigningThisCert ? "#dbeafe" : "#f1f5f9", 
                          display: "flex", alignItems: "center", justifyContent: "center",
                          position: "relative"
                        }}>
                          {isSigningThisCert ? (
                            <Loader2 size={20} color="#2563eb" style={{ animation: "spin 1s linear infinite" }} />
                          ) : (
                            <FileText size={20} color={t.accentColor} />
                          )}
                        </div>
                        <div>
                          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>{cert.name}</h3>
                          <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                            <span>Issued: {cert.date}</span>
                            <span>•</span>
                            <span style={{ textTransform: "capitalize" }}>Type: {cert.signingType}</span>
                            {cert.signers.length > 0 && (
                              <>
                                <span>•</span>
                                <span>{cert.signers.filter(s => s.signed).length}/{cert.signers.length} Signed</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <span style={{
                          padding: "4px 12px", borderRadius: "99px", fontSize: "12px", fontWeight: 600,
                          background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
                          textTransform: "capitalize",
                        }}>{cert.status}</span>

                        {isSigningThisCert ? (
                          <div style={{
                            padding: "9px 20px",
                            borderRadius: "10px",
                            background: "#dbeafe",
                            color: "#2563eb",
                            fontSize: "13px",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                          }}>
                            <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                            {signingStage === "ecdsa" ? "Signing..." : "Redirecting..."}
                          </div>
                        ) : userCanSign ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log("🖱️ Sign Now clicked for:", cert.id);
                              handleStartSigning(cert);
                            }}
                            disabled={processing}
                            style={{
                              padding: "9px 20px", borderRadius: "10px", border: "none",
                              background: t.gradient,
                              color: "white",
                              fontSize: "13px", fontWeight: 600, cursor: processing ? "not-allowed" : "pointer",
                              transition: "all 0.2s",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              opacity: processing ? 0.7 : 1
                            }}
                          >
                            {processing ? (
                              <>
                                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                                Signing...
                              </>
                            ) : (
                              "Sign Now"
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/verify/${cert.id}`);
                            }}
                            style={{
                              padding: "8px 14px",
                              borderRadius: "8px",
                              border: "1px solid #cbd5f5",
                              background: "white",
                              color: "#1e1a6b",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer"
                            }}
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ================= PREVIEW MODAL ================= */}
        {isPreviewOpen && selectedCert && (
          <div style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            animation: "fadeIn 0.2s ease-out"
          }}>
            <div style={{
              background: "white",
              borderRadius: "24px",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              animation: "slideUp 0.3s ease-out"
            }}>
              {/* Modal Header */}
              <div style={{
                padding: "24px 24px 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start"
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                    <div style={{
                      padding: "8px",
                      background: t.iconBg,
                      borderRadius: "12px",
                      color: t.accentColor
                    }}>
                      <FileText size={24} />
                    </div>
                    <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a" }}>
                      Document Preview
                    </h2>
                  </div>
                  <p style={{ color: "#64748b", fontSize: "14px", marginLeft: "4px" }}>
                    Review signer status and document details.
                  </p>
                </div>
                <button 
                  onClick={closePreview}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "8px",
                    borderRadius: "8px",
                    color: "#64748b",
                    transition: "all 0.2s"
                  }}
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div style={{ 
                padding: "24px", 
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "24px"
              }}>
                
                {/* SIGNING STAGE ROADMAP - SHOW WHEN SIGNING IS ACTIVE */}
                {isCurrentlySigning && (
                  <SigningStageRoadmap 
                    currentStage={signingStage} 
                    stageError={stageError}
                  />
                )}

                {/* Document Info Card */}
                <div style={{
                  background: "#f8fafc",
                  borderRadius: "16px",
                  padding: "20px",
                  border: "1px solid #e2e8f0"
                }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#0f172a", marginBottom: "12px" }}>
                    {selectedCert.name}
                  </h3>
                  <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.5, marginBottom: "16px" }}>
                    {selectedCert.description}
                  </p>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Issue Date</p>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{selectedCert.date}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Signing Type</p>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", textTransform: "capitalize" }}>
                        {selectedCert.signingType}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Credential ID</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <p style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", fontFamily: "monospace" }}>
                          {selectedCert.id.substring(0, 8)}...
                        </p>
                        <button 
                          onClick={() => copyToClipboard(selectedCert.id, "Credential ID")}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: t.accentColor }}
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Signers Required</p>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
                        {selectedCert.signers.length}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Signer Status Section */}
                {selectedCert.signers && selectedCert.signers.length > 0 && (
                  <div style={{
                    background: "white",
                    borderRadius: "16px",
                    padding: "20px",
                    border: "1px solid #e2e8f0"
                  }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Users size={18} color={t.accentColor} />
                      Signer Status
                      {selectedCert.signingType === 'sequential' && (
                        <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 400 }}>(Sequential Order)</span>
                      )}
                    </h3>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {selectedCert.signers.map((signer, index) => {
                        const isCurrentUser = signer.signerPublicKey.toLowerCase() === user?.walletPublicKey?.toLowerCase();
                        const showOrder = selectedCert.signingType === 'sequential';
                        
                        return (
                          <div key={signer.signerPublicKey} style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "14px 16px",
                            background: signer.signed ? "#f0fdf4" : (isCurrentUser ? "#eff6ff" : "#f8fafc"),
                            borderRadius: "12px",
                            border: `2px solid ${signer.signed ? "#86efac" : (isCurrentUser ? "#bfdbfe" : "#e2e8f0")}`,
                            position: "relative"
                          }}>
                            {showOrder && (
                              <div style={{
                                position: "absolute",
                                left: "-8px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                background: signer.signed ? "#16a34a" : (isCurrentUser ? "#2563eb" : "#94a3b8"),
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "11px",
                                fontWeight: 700,
                                border: "2px solid white"
                              }}>
                                {signer.signerOrder}
                              </div>
                            )}
                            
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: showOrder ? "12px" : "0" }}>
                              <div style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "10px",
                                background: signer.isStudent ? "#dbeafe" : "#f3e8ff",
                                color: signer.isStudent ? "#2563eb" : "#9333ea",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}>
                                {signer.isStudent ? <User size={18} /> : <GitBranch size={18} />}
                              </div>
                              <div>
                                <p style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
                                  {signer.isStudent ? "Student" : `Institution ${index + 1}`}
                                  {isCurrentUser && <span style={{ marginLeft: "6px", fontSize: "11px", color: "#2563eb", background: "#dbeafe", padding: "2px 6px", borderRadius: "4px" }}>You</span>}
                                </p>
                                <p style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>
                                  {signer.signerPublicKey.slice(0, 10)}...{signer.signerPublicKey.slice(-4)}
                                </p>
                              </div>
                            </div>
                            
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              {signer.signed ? (
                                <>
                                  <CheckCircle2 size={18} color="#16a34a" />
                                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#16a34a" }}>Signed</span>
                                </>
                              ) : (
                                <>
                                  <Clock size={18} color={isCurrentUser ? "#2563eb" : "#94a3b8"} />
                                  <span style={{ fontSize: "13px", fontWeight: 600, color: isCurrentUser ? "#2563eb" : "#64748b" }}>
                                    {isCurrentUser ? "Your Turn" : "Pending"}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Progress Bar */}
                    <div style={{ marginTop: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>Progress</span>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a" }}>
                          {selectedCert.signers.filter(s => s.signed).length} of {selectedCert.signers.length}
                        </span>
                      </div>
                      <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          width: `${(selectedCert.signers.filter(s => s.signed).length / selectedCert.signers.length) * 100}%`,
                          background: t.gradient,
                          borderRadius: "3px",
                          transition: "width 0.3s ease"
                        }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Document Status Section */}
                <div style={{
                  background: selectedCert.status === "signed" ? "#f0fdf4" : "#fffbeb",
                  borderRadius: "16px",
                  padding: "20px",
                  border: `1px solid ${selectedCert.status === "signed" ? "#86efac" : "#fde68a"}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                    {selectedCert.status === "signed" ? (
                      <CheckCircle2 size={24} color="#16a34a" />
                    ) : (
                      <AlertCircle size={24} color="#d97706" />
                    )}
                    <h3 style={{ 
                      fontSize: "16px", 
                      fontWeight: 700, 
                      color: selectedCert.status === "signed" ? "#15803d" : "#b45309" 
                    }}>
                      Document Status: {selectedCert.status === "signed" ? "Completed" : "Pending Signatures"}
                    </h3>
                  </div>
                  
                  <p style={{ 
                    fontSize: "14px", 
                    color: selectedCert.status === "signed" ? "#166534" : "#92400e",
                    lineHeight: 1.5 
                  }}>
                    {selectedCert.status === "signed" 
                      ? "All required signatures have been collected and verified on the blockchain."
                      : "This document is awaiting signatures from the authorized parties listed above."}
                  </p>

                  {selectedCert.status === "signed" && selectedCert.txHash && (
                    <div style={{ 
                      marginTop: "12px", 
                      padding: "12px", 
                      background: "rgba(255,255,255,0.5)", 
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#166534",
                      fontFamily: "monospace",
                      wordBreak: "break-all"
                    }}>
                      <span style={{ fontWeight: "600" }}>Tx Hash: </span>
                      {selectedCert.txHash}
                    </div>
                  )}
                </div>

                {/* Security Note */}
                <div style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "12px 16px",
                  background: "#eff6ff",
                  borderRadius: "12px",
                  border: "1px solid #bfdbfe"
                }}>
                  <ShieldCheck size={20} color="#2563eb" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#1e40af", marginBottom: "2px" }}>
                      Blockchain Secured
                    </p>
                    <p style={{ fontSize: "12px", color: "#3b82f6" }}>
                      All signatures are recorded on the blockchain ensuring tamper-proof verification.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: "20px 24px 24px",
                borderTop: "1px solid #f1f5f9",
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px"
              }}>
                <button
                  onClick={() => navigate(`/verify/${selectedCert.id}`)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    background: "white",
                    color: "#1e1a6b",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <ExternalLink size={16} />
                  Verify
                </button>

                <button
                  onClick={closePreview}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    background: "white",
                    color: "#64748b",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  Close
                </button>
                
                {canUserSign(selectedCert) ? (
                  <button
                    onClick={() => handleStartSigning(selectedCert)}
                    disabled={processing || isCurrentlySigning}
                    style={{
                      padding: "10px 24px",
                      borderRadius: "10px",
                      border: "none",
                      background: isCurrentlySigning ? "#cbd5e1" : t.gradient,
                      color: "white",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: (processing || isCurrentlySigning) ? "not-allowed" : "pointer",
                      boxShadow: t.btnShadow,
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      opacity: (processing || isCurrentlySigning) ? 0.7 : 1
                    }}
                  >
                    {isCurrentlySigning ? (
                      <>
                        <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                        {signingStage === "ecdsa" ? "Confirm in MetaMask..." : "Processing..."}
                      </>
                    ) : processing ? (
                      <>
                        <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                        Signing...
                      </>
                    ) : (
                      <>
                        <Lock size={18} />
                        Sign Document
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    style={{
                      padding: "10px 24px",
                      borderRadius: "10px",
                      border: "none",
                      background: "#f1f5f9",
                      color: "#94a3b8",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                    disabled
                  >
                    {selectedCert.status === "signed" ? (
                      <>
                        <CheckCircle2 size={18} />
                        Fully Signed
                      </>
                    ) : (
                      <>
                        <Clock size={18} />
                        Awaiting Others
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= IMPORT TO METAMASK MODAL ================= */}
        {showImportModal && importTarget && (
          <ImportToMetamask
            portalPublicKey={importTarget.portalPublicKey}
            role={importTarget.role}
            onImported={() => {
              console.log("✅ Key imported, closing modal and retrying sign");
              setShowImportModal(false);
              setImportTarget(null);
              
              // Retry signing with pending data
              if (pendingSignData) {
                toast.success("Account imported! Retrying sign...");
                setTimeout(() => {
                  handleSignDocument(
                    pendingSignData.certificate, 
                    pendingSignData.signerData
                  );
                  setPendingSignData(null);
                }, 2000); // Give user time to switch accounts
              }
            }}
            onClose={() => {
              console.log("❌ Import modal closed");
              setShowImportModal(false);
              setImportTarget(null);
              setPendingSignData(null);
              setSigningStage("idle");
              setProcessing(false);
            }}
          />
        )}

        <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { 
              from { transform: translateY(20px); opacity: 0; } 
              to { transform: translateY(0); opacity: 1; } 
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.5; transform: scale(1.2); }
            }
        `}</style>
    </div>
  );
};

export default VerificationList;