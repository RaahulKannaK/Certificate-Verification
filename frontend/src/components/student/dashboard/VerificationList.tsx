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
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../../contexts/AuthContext";

/* ================= TYPES ================= */
export interface Signer {
  signerPublicKey: string;
  signerOrder: number;
  signed: boolean;
  isStudent: boolean;
  name?: string; // Optional: if we can resolve name from backend
}

export interface Certificate {
  id: string;
  name: string;
  issuer: string; // Student who issued (resolved from studentPublicKey)
  issuerEmail: string;
  walletAddress: string; // studentPublicKey
  date: string;
  status: "pending" | "signed" | "completed";
  type: string;
  signingType: "self" | "sequential" | "parallel";
  description?: string;
  txHash?: string;
  signers: Signer[];
  filePath?: string;
  institutionKeys: string[]; // Raw institution public keys
}

type SigningType = "self" | "sequential" | "parallel";

/* ================= PROPS ================= */
interface VerificationListProps {
  onSign: (certificate: Certificate, signingType: SigningType) => void;
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
};

/* ================= COMPONENT ================= */
const VerificationList: React.FC<VerificationListProps> = ({ onSign }) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "signed">("pending");
  const [filterType, setFilterType] = useState<"all" | "self" | "institution">("all");
  const [hoveredCert, setHoveredCert] = useState<string | null>(null);
  
  // Preview Modal State
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  /* ================= FETCH ISSUED CERTIFICATES ================= */
  useEffect(() => {
    if (!user?.walletPublicKey) return;

    const fetchCertificates = async () => {
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

        // Map backend data to frontend Certificate type
        const mapped: Certificate[] = data.data.map((c: any) => {
          // The issuer is the student who created this credential (studentPublicKey)
          // For self-sign, it's the same person. For sequential/parallel, student initiates
          const isSelfSign = c.signingType === "self";
          
          // Resolve issuer name - try to get from joined data or use shortened key
          let issuerName = "Unknown";
          if (c.studentName) {
            issuerName = c.studentName;
          } else if (c.studentPublicKey) {
            issuerName = `${c.studentPublicKey.slice(0, 6)}...${c.studentPublicKey.slice(-4)}`;
          }

          // Parse institution keys
          const instKeys = c.institutionPublicKeys ? JSON.parse(c.institutionPublicKeys) : [];

          // Map Signers from credential_signers table
          // For self-sign: only the student
          // For sequential/parallel: student + institutions
          const mappedSigners: Signer[] = (c.signers || []).map((s: any) => ({
            signerPublicKey: s.signerPublicKey,
            signerOrder: s.signerOrder,
            signed: s.signed === 1 || s.signed === true,
            isStudent: s.isStudent === 1 || s.isStudent === true,
            name: s.isStudent ? (c.studentName || "Student") : `Institution ${s.signerOrder || 1}`
          }));

          // Sort signers by order for sequential display
          mappedSigners.sort((a, b) => a.signerOrder - b.signerOrder);

          return {
            id: c.credentialId,
            name: c.title || "Untitled Certificate",
            issuer: issuerName, // Student who issued
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
  const handleStartSigning = (certificate: Certificate) => {
    if (!user?.biometricSetup) {
      toast.error("Please complete biometric setup first");
      return;
    }
    if (certificate.status !== "pending") {
      toast.info("Certificate already signed");
      return;
    }
    onSign(certificate, certificate.signingType);
    setIsPreviewOpen(false);
  };

  const openPreview = (cert: Certificate) => {
    setSelectedCert(cert);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setTimeout(() => setSelectedCert(null), 300);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  // Check if current user can sign this credential
  const canUserSign = (cert: Certificate): boolean => {
    if (cert.status !== "pending") return false;
    
    // Find if current user is in the signers list and hasn't signed yet
    const userSigner = cert.signers.find(s => 
      s.signerPublicKey.toLowerCase() === user?.walletPublicKey?.toLowerCase()
    );
    
    if (!userSigner) return false;
    if (userSigner.signed) return false;
    
    // For sequential, check if it's their turn (all previous must be signed)
    if (cert.signingType === "sequential") {
      const previousSigners = cert.signers.filter(s => s.signerOrder < userSigner.signerOrder);
      const allPreviousSigned = previousSigners.every(s => s.signed);
      if (!allPreviousSigned) return false;
    }
    
    return true;
  };

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
                        cursor: "pointer"
                      }}
                    >
                      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                        <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <FileText size={20} color={t.accentColor} />
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

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (userCanSign) {
                              handleStartSigning(cert);
                            } else {
                              openPreview(cert);
                            }
                          }}
                          style={{
                            padding: "9px 20px", borderRadius: "10px", border: "none",
                            background: userCanSign ? t.gradient : "#f1f5f9",
                            color: userCanSign ? "white" : "#64748b",
                            fontSize: "13px", fontWeight: 600, cursor: "pointer",
                            transition: "all 0.2s",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                        >
                          {userCanSign ? "Sign Now" : "Review"}
                          {!userCanSign && <ExternalLink size={14} />}
                        </button>
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
                {/* Document Info Card - REMOVED "Issued By" */}
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
                    {/* REMOVED Issued By Field */}
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

                {/* Signer Status Section - ENHANCED */}
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
                            {/* Order Badge for Sequential */}
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
                      <span style={{ fontWeight: 600 }}>Tx Hash: </span>
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
                    style={{
                      padding: "10px 24px",
                      borderRadius: "10px",
                      border: "none",
                      background: t.gradient,
                      color: "white",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                      boxShadow: t.btnShadow,
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    <CheckCircle2 size={18} />
                    Sign Document
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

        <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { 
              from { transform: translateY(20px); opacity: 0; } 
              to { transform: translateY(0); opacity: 1; } 
            }
        `}</style>
    </div>
  );
};

export default VerificationList;