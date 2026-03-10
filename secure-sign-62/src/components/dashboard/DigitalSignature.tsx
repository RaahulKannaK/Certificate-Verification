import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Upload, User, Users, GitBranch } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

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
  signingType: "self" | "sequential" | "parallel"; // Added from backend
}

type SigningType = "self" | "sequential" | "parallel";

/* ================= PROPS ================= */
interface DigitalSignatureProps {
  onBack: () => void;
  onSign: (certificate: Certificate, signingType: SigningType) => void;
}

/* ================= THEME ================= */
const getTheme = (role: string) => {
  return {
    pageBg: "#f5f3ff",
    blob1: "radial-gradient(circle at 30% 20%, rgba(30,26,107,0.08), transparent 50%)",
    blob2: "radial-gradient(circle at 70% 80%, rgba(44,37,142,0.05), transparent 50%)",
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
};

/* ================= COMPONENT ================= */
const DigitalSignature: React.FC<DigitalSignatureProps> = ({
  onBack,
  onSign,
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] =
    useState<"all" | "pending" | "signed">("pending");
  const [filterType, setFilterType] = useState<"all" | "self" | "institution">("all");
  const [hoveredCert, setHoveredCert] = useState<string | null>(null);

  const t = getTheme(user?.role || "student");

  /* ================= FETCH ISSUED CERTIFICATES ================= */
  useEffect(() => {
    if (!user?.walletPublicKey) return;

    const fetchCertificates = async () => {
      setLoading(true);
      try {
        console.log("🔹 Fetching credentials for:", user.walletPublicKey);

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
        console.log("🔹 API response:", data);

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
          signingType: c.signingType || "self", // From backend: "self", "sequential", or "parallel"
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
    
    // Filter by signing type: self vs institution (sequential/parallel)
    const matchType = 
      filterType === "all" || 
      (filterType === "self" && c.signingType === "self") ||
      (filterType === "institution" && (c.signingType === "sequential" || c.signingType === "parallel"));

    return matchSearch && matchTab && matchType;
  });

  /* ================= ACTIONS ================= */
  const handleFileSelect = () => fileInputRef.current?.click();

  const handleStartSigning = (certificate: Certificate) => {
    if (!user?.biometricSetup) {
      toast.error("Please complete biometric setup first");
      return;
    }

    if (certificate.status !== "pending") {
      toast.info("Certificate already signed");
      return;
    }

    onSign(certificate, certificate.signingType); // Use the certificate's actual signing type from backend
  };

  /* ================= UI ================= */
  return (
    <div style={{ position: "relative" }}>


      <div style={{ position: "relative", zIndex: 1, maxWidth: "1100px", margin: "0 auto", padding: "40px 24px 60px" }}>

        {/* Back Button */}
        <button
          onClick={onBack}
          style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            marginBottom: "28px", padding: "8px 18px", borderRadius: "10px",
            border: `1px solid ${t.outlineBorder}`, background: "white",
            color: "#374151", fontSize: "14px", fontWeight: 500,
            cursor: "pointer", transition: "all 0.2s",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}
          onMouseEnter={e => { (e.currentTarget.style.borderColor = t.outlineHover); (e.currentTarget.style.color = t.accentColor); }}
          onMouseLeave={e => { (e.currentTarget.style.borderColor = t.outlineBorder); (e.currentTarget.style.color = "#374151"); }}
        >
          ← Back to Dashboard
        </button>

        {/* Header */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "36px" }}>
          <div>
            <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 800, color: "#0f172a", marginBottom: "6px" }}>
              Digital Signature
            </h1>
            <p style={{ fontSize: "15px", color: "#64748b" }}>Blockchain-based certificate signing</p>
          </div>

          <div>
            <input ref={fileInputRef} type="file" hidden />
            <button
              onClick={handleFileSelect}
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "11px 24px", borderRadius: "10px", border: "none",
                background: t.gradient, color: "white",
                fontSize: "14px", fontWeight: 600, cursor: "pointer",
                boxShadow: t.btnShadow, transition: "all 0.2s",
              }}
              onMouseEnter={e => { (e.currentTarget.style.transform = "translateY(-2px)"); (e.currentTarget.style.boxShadow = t.btnShadowHover); }}
              onMouseLeave={e => { (e.currentTarget.style.transform = "translateY(0)"); (e.currentTarget.style.boxShadow = t.btnShadow); }}
            >
              <Upload size={16} /> Upload Certificate
            </button>
          </div>
        </div>

        {/* Signing Mode Filter Buttons - Based on Backend Data */}
        <div className="grid md:grid-cols-3 gap-4" style={{ marginBottom: "28px" }}>
          {[
            { 
              type: "all", 
              icon: Users, 
              label: "All Certificates",
              description: "View all signing types",
              count: certificates.length 
            },
            { 
              type: "self", 
              icon: User, 
              label: "Self Signing",
              description: "Personal blockchain signing",
              count: certificates.filter(c => c.signingType === "self").length 
            },
            { 
              type: "institution", 
              icon: GitBranch, 
              label: "Issued to Institution",
              description: "Sequential & parallel signing",
              count: certificates.filter(c => c.signingType === "sequential" || c.signingType === "parallel").length 
            },
          ].map(({ type, icon: Icon, label, description, count }) => (
            <div
              key={type}
              onClick={() => setFilterType(type as "all" | "self" | "institution")}
              style={{
                background: "white", borderRadius: "16px", padding: "16px",
                border: `${filterType === type ? "2px" : "1px"} solid ${filterType === type ? t.accentColor : t.cardBorder}`,
                cursor: "pointer", display: "flex", alignItems: "center", gap: "16px",
                boxShadow: filterType === type ? t.btnShadow : "0 2px 8px rgba(0,0,0,0.04)", 
                transition: "all 0.2s",
                transform: filterType === type ? "translateY(-2px)" : "translateY(0)",
              }}
            >
              <div style={{ 
                width: "48px", height: "48px", borderRadius: "12px", 
                background: filterType === type ? t.gradient : t.iconBg, 
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s"
              }}>
                <Icon size={22} color={filterType === type ? "white" : t.iconColor} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{label}</h3>
                  <span style={{
                    padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 600,
                    background: filterType === type ? t.iconBg : "#f1f5f9", 
                    color: filterType === type ? t.accentColor : "#64748b",
                  }}>
                    {count}
                  </span>
                </div>
                <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>{description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Certificates Card */}
        <div style={{
          background: "rgba(255, 255, 255, 0.45)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: "20px",
          border: `1px solid ${t.cardBorder}`,
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)", overflow: "hidden",
        }}>
          {/* Card Header */}
          <div style={{ padding: "24px 28px 0", borderBottom: `1px solid ${t.cardBorder}` }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
                  Your Certificates
                </h2>
                <p style={{ fontSize: "13px", color: "#64748b" }}>
                  {filterType === "all" && "All issued credentials"}
                  {filterType === "self" && "Self-signed certificates"}
                  {filterType === "institution" && "Multi-signature institutional certificates"}
                </p>
              </div>

              {/* Search */}
              <div style={{ position: "relative" }}>
                <Search size={15} color={t.iconColor} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  style={{
                    width: "100%", padding: "9px 12px 9px 36px",
                    borderRadius: "9px", border: `1px solid ${t.inputBorder}`,
                    background: "#f8fafc", fontSize: "13px", color: "#334155",
                    outline: "none", transition: "border 0.2s", boxSizing: "border-box",
                  }}
                  placeholder="Search certificates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={e => (e.currentTarget.style.borderColor = t.inputFocus)}
                  onBlur={e => (e.currentTarget.style.borderColor = t.inputBorder)}
                />
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "4px" }}>
              {(["all", "pending", "signed"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "8px 20px", borderRadius: "8px 8px 0 0",
                    border: "none", cursor: "pointer",
                    fontSize: "13px", fontWeight: 600,
                    transition: "all 0.2s", textTransform: "capitalize",
                    background: activeTab === tab ? t.gradient : "transparent",
                    color: activeTab === tab ? "white" : "#64748b",
                    boxShadow: activeTab === tab ? t.btnShadow : "none",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Certificate List */}
          <div style={{ padding: "20px 28px" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "50%",
                  border: `3px solid ${t.cardBorder}`, borderTopColor: t.accentColor,
                  animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
                }} />
                Loading certificates...
              </div>
            ) : filteredCertificates.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: t.iconBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <Search size={22} color={t.iconColor} />
                </div>
                <p style={{ fontSize: "15px", fontWeight: 600, color: "#475569" }}>
                  {filterType === "self" ? "No self-signed certificates" : 
                   filterType === "institution" ? "No institutional certificates" : 
                   "No certificates found"}
                </p>
                <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>
                  {filterType !== "all" ? "Try selecting a different filter" : "Try adjusting your search or tab filter"}
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {filteredCertificates.map((cert) => {
                  const isHovered = hoveredCert === cert.id;
                  const badge = cert.status === "pending" ? t.badgePending : t.badgeSigned;
                  
                  // Determine display label for signing type
                  const signingTypeLabel = cert.signingType === "self" ? "Self" : 
                                          cert.signingType === "sequential" ? "Sequential" : 
                                          cert.signingType === "parallel" ? "Parallel" : "Unknown";
                  
                  return (
                    <div
                      key={cert.id}
                      onMouseEnter={() => setHoveredCert(cert.id)}
                      onMouseLeave={() => setHoveredCert(null)}
                      style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "16px 20px", borderRadius: "14px",
                        border: `1px solid ${isHovered ? t.accentColor : t.cardBorder}`,
                        background: isHovered ? t.cardHoverBg : "rgba(255, 255, 255, 0.3)",
                        transition: "all 0.2s",
                        boxShadow: isHovered ? `0 4px 16px rgba(0,0,0,0.06)` : "none",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>{cert.name}</h3>
                          <span style={{
                            padding: "2px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 600,
                            background: cert.signingType === "self" ? "#e0e7ff" : "#fef3c7",
                            color: cert.signingType === "self" ? "#4f46e5" : "#d97706",
                            border: `1px solid ${cert.signingType === "self" ? "#c7d2fe" : "#fde68a"}`,
                          }}>
                            {signingTypeLabel}
                          </span>
                        </div>
                        <p style={{ fontSize: "12px", color: "#64748b" }}>Issued on {cert.date}</p>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{
                          padding: "3px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 600,
                          background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
                          textTransform: "capitalize",
                        }}>
                          {cert.status}
                        </span>

                        <button
                          onClick={() =>
                            cert.status === "pending"
                              ? handleStartSigning(cert)
                              : toast.info("Verification coming soon")
                          }
                          style={{
                            padding: "7px 18px", borderRadius: "8px", border: "none",
                            background: cert.status === "pending" ? t.gradient : "#f1f5f9",
                            color: cert.status === "pending" ? "white" : "#64748b",
                            fontSize: "13px", fontWeight: 600, cursor: "pointer",
                            boxShadow: cert.status === "pending" ? t.btnShadow : "none",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={e => { if (cert.status === "pending") (e.currentTarget.style.boxShadow = t.btnShadowHover); }}
                          onMouseLeave={e => { if (cert.status === "pending") (e.currentTarget.style.boxShadow = t.btnShadow); }}
                        >
                          {cert.status === "pending" ? "Sign" : "Signed ✓"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default DigitalSignature;