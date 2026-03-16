import React, { useState, useRef, useEffect } from "react";
import { Search, Upload, User, Users, GitBranch } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../../contexts/AuthContext";

/* ================= TYPES ================= */
export interface Certificate {
  id: string;
  name: string;
  issuer: string;
  issuerEmail: string;
  walletAddress: string;
  date: string;
  status: "pending" | "signed";
  type: string;
  signingType: "self" | "sequential" | "parallel";
}

type SigningType = "self" | "sequential" | "parallel";

/* ================= PROPS ================= */
interface VerificationListProps {
  onSign: (certificate: Certificate, signingType: SigningType) => void;
}

/* ================= THEME ================= */
const t = {
    pageBg: "#f5f3ff",
    gradient: "linear-gradient(135deg, #1e1a6b, #1e1a6b)",
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
            }),
          }
        );

        const data = await res.json();
        if (!data.success) {
          toast.error("Failed to fetch certificates");
          return;
        }

        const mapped: Certificate[] = data.data.map((c: any) => ({
          id: c.credentialId,
          name: c.title || "Untitled Certificate",
          issuer: "Institution",
          issuerEmail: "",
          walletAddress: c.studentPublicKey,
          date: new Date(c.issuedAt).toLocaleDateString(),
          status: c.status === "signed" ? "signed" : "pending",
          type: c.signingType || "self",
          signingType: c.signingType || "self",
        }));

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
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px 0" }}>
        
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
        <div className="grid md:grid-cols-3 gap-6" style={{ marginBottom: "32px" }}>
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
                  
                  return (
                    <div
                      key={cert.id}
                      onMouseEnter={() => setHoveredCert(cert.id)}
                      onMouseLeave={() => setHoveredCert(null)}
                      style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "16px 20px", borderRadius: "16px",
                        background: isHovered ? "#f8fafc" : "transparent",
                        border: `1px solid ${isHovered ? "#e2e8f0" : "transparent"}`,
                        transition: "all 0.2s",
                      }}
                    >
                      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                        <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <GitBranch size={20} color={t.accentColor} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>{cert.name}</h3>
                          <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                            <span>Issued: {cert.date}</span>
                            <span>•</span>
                            <span style={{ textTransform: "capitalize" }}>Type: {cert.signingType}</span>
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
                          onClick={() => handleStartSigning(cert)}
                          style={{
                            padding: "9px 20px", borderRadius: "10px", border: "none",
                            background: cert.status === "pending" ? t.gradient : "#f1f5f9",
                            color: cert.status === "pending" ? "white" : "#94a3b8",
                            fontSize: "13px", fontWeight: 600, cursor: cert.status === "pending" ? "pointer" : "default",
                            transition: "all 0.2s",
                          }}
                        >
                          {cert.status === "pending" ? "Sign Now" : "Review"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
    </div>
  );
};

export default VerificationList;
