import { useState, useEffect, useMemo } from "react";
import { Type, MousePointer, RotateCcw, Shield, Users, Lock } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";
import { BiometricVerify } from "../dashboard/BiometricVerify";
import { useAuth } from "@/contexts/AuthContext";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/* ================= TYPES ================= */
interface SignatureField {
  id: number;
  signerPublicKey: string;
  xRatio: number;
  yRatio: number;
  wRatio: number;
  hRatio: number;
  color: string;
  signed?: boolean;
  isStudent?: boolean;
}

interface CertificatePreviewProps {
  certificate: any;
  myPublicKey?: string;
  onSignatureChange: (payload: any) => void;
}

/* ================= CONSTANTS ================= */
const DOC_WIDTH = 720;

const fontOptions = [
  { name: "Elegant", font: "italic 32px Georgia, serif" },
  { name: "Classic", font: "32px 'Times New Roman', serif" },
  { name: "Modern", font: "300 28px Helvetica, sans-serif" },
  { name: "Script", font: "italic 36px 'Brush Script MT', cursive" },
];

/* ================= THEME ================= */
const getTheme = (role: string, isSelfSign: boolean) => {
  // Self-sign uses purple (student theme), institution uses green
  if (role === "institution" && !isSelfSign) {
    return {
      gradient: "linear-gradient(135deg, #16a34a, #059669)",
      btnShadow: "0 4px 12px rgba(22,163,74,0.28)",
      btnShadowHover: "0 8px 20px rgba(22,163,74,0.40)",
      accentColor: "#16a34a",
      cardBorder: "#bbf7d0",
      cardBg: "#f0fdf4",
      tabActiveBg: "linear-gradient(135deg, #16a34a, #059669)",
      tabActiveColor: "white",
      inputBorder: "#bbf7d0",
      inputFocusBorder: "#16a34a",
      fontBtnActiveBg: "linear-gradient(135deg, #16a34a, #059669)",
      clearBtnHover: "#f0fdf4",
      verifyBg: "#f0fdf4",
      verifyBorder: "#86efac",
      headerIcon: "#16a34a",
    };
  }
  // Self-sign or student — Purple
  return {
    gradient: "linear-gradient(135deg, #7c3aed, #6366f1)",
    btnShadow: "0 4px 12px rgba(124,58,237,0.28)",
    btnShadowHover: "0 8px 20px rgba(124,58,237,0.40)",
    accentColor: "#7c3aed",
    cardBorder: "#ddd6fe",
    cardBg: "#f5f3ff",
    tabActiveBg: "linear-gradient(135deg, #7c3aed, #6366f1)",
    tabActiveColor: "white",
    inputBorder: "#ddd6fe",
    inputFocusBorder: "#7c3aed",
    fontBtnActiveBg: "linear-gradient(135deg, #7c3aed, #6366f1)",
    clearBtnHover: "#f5f3ff",
    verifyBg: "#f5f3ff",
    verifyBorder: "#c4b5fd",
    headerIcon: "#7c3aed",
  };
};

// Helper to format color
const formatColor = (color: string): string => {
  if (!color) return "#7c3aed";
  if (color.startsWith("#")) return color;
  if (color.includes("%")) return `hsl(${color})`;
  if (color.startsWith("hsl")) return color;
  return color;
};

export const CertificatePreview = ({
  certificate,
  myPublicKey,
  onSignatureChange,
}: CertificatePreviewProps) => {
  const { user } = useAuth();

  // Determine if this is self-sign mode (student signing their own credential without institution)
  const isSelfSign = useMemo(() => {
    if (!certificate || !myPublicKey) return false;
    const isStudentCredential = certificate.studentPublicKey?.toLowerCase() === myPublicKey?.toLowerCase();
    const hasNoInstitution = !certificate.institutionPublicKey || 
      certificate.institutionPublicKey === "0x0000000000000000000000000000000000000000" ||
      certificate.institutionPublicKey === "";
    // Also check if signatureFields only contains student box
    const onlyStudentFields = certificate.signatureFields?.every((f: SignatureField) => f.isStudent);
    return (isStudentCredential && hasNoInstitution) || onlyStudentFields;
  }, [certificate, myPublicKey]);

  const t = getTheme(user?.role || "student", isSelfSign);

  const [pdfCanvasRef, setPdfCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [signCanvasRef, setSignCanvasRef] = useState<HTMLCanvasElement | null>(null);

  const [pdfSize, setPdfSize] = useState({ width: DOC_WIDTH, height: 0 });
  const [activeTab, setActiveTab] = useState<"type" | "draw">("type");
  const [typedName, setTypedName] = useState("");
  const [selectedFont, setSelectedFont] = useState(0);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  /* 🔐 SECURITY STATES */
  const [isPreVerified, setIsPreVerified] = useState(false);
  const [isPostVerified, setIsPostVerified] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);
  const [verifyMode, setVerifyMode] = useState<"pre" | "post">("pre");

  const documentUrl = certificate.filePath;

  // Get all signers for display
  const signers = useMemo(() => {
    if (!certificate?.signatureFields) return [];
    
    return certificate.signatureFields.map((field: SignatureField, idx: number) => {
      const isStudentBox = field.isStudent === true || field.isStudent === 1;
      const isMine = !field.signed && (
        field.signerPublicKey?.toLowerCase() === myPublicKey?.toLowerCase() ||
        (isStudentBox && certificate.studentPublicKey?.toLowerCase() === myPublicKey?.toLowerCase())
      );
      
      return {
        ...field,
        isMine,
        name: isStudentBox ? "Student (You)" : `Institution ${idx + 1}`,
        status: field.signed ? "Signed" : isMine ? "Waiting for you" : "Pending",
      };
    });
  }, [certificate, myPublicKey]);

  const unsignedSigners = signers.filter(s => !s.signed);
  const myUnsignedIndex = signers.findIndex(s => s.isMine && !s.signed);
  const isMyTurn = myUnsignedIndex === 0; // First unsigned signer

  /* ================= LOAD PDF ================= */
  useEffect(() => {
    if (!documentUrl || !pdfCanvasRef) return;

    const renderPdf = async () => {
      const pdf = await pdfjsLib.getDocument(documentUrl).promise;
      const page = await pdf.getPage(1);

      const baseViewport = page.getViewport({ scale: 1 });
      const scale = DOC_WIDTH / baseViewport.width;
      const viewport = page.getViewport({ scale });

      const ctx = pdfCanvasRef.getContext("2d")!;
      pdfCanvasRef.width = viewport.width;
      pdfCanvasRef.height = viewport.height;

      setPdfSize({ width: viewport.width, height: viewport.height });

      ctx.clearRect(0, 0, viewport.width, viewport.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
    };

    renderPdf().catch(console.error);
  }, [documentUrl, pdfCanvasRef]);

  /* ================= SIGNATURE BOX ================= */
  const myBox = useMemo(() => {
    if (!myPublicKey || !certificate.signatureFields) return null;
    
    return certificate.signatureFields.find((b: SignatureField) => {
      const matchesByKey = b.signerPublicKey?.toLowerCase() === myPublicKey?.toLowerCase();
      const isStudentBox = b.isStudent === true || b.isStudent === 1;
      const isCredentialStudent = certificate.studentPublicKey?.toLowerCase() === myPublicKey?.toLowerCase();
      const notSigned = !b.signed;
      
      return notSigned && (matchesByKey || (isStudentBox && isCredentialStudent));
    });
  }, [myPublicKey, certificate]);

  const signatureBox = useMemo(() => {
    if (!myBox) return null;
    return {
      x: myBox.xRatio * pdfSize.width,
      y: myBox.yRatio * pdfSize.height,
      width: myBox.wRatio * pdfSize.width || 200,
      height: myBox.hRatio * pdfSize.height || 64,
      color: myBox.color,
      formattedColor: formatColor(myBox.color),
      isStudent: myBox.isStudent === true || myBox.isStudent === 1,
    };
  }, [myBox, pdfSize]);

  /* ================= CLEAR ================= */
  const clearSignature = () => {
    if (signCanvasRef) {
      const ctx = signCanvasRef.getContext("2d")!;
      ctx.clearRect(0, 0, signCanvasRef.width, signCanvasRef.height);
    }
    setTypedName("");
    setSignatureImage(null);
    setIsPostVerified(false);
    onSignatureChange(null);
  };

  /* ================= TYPED SIGNATURE ================= */
  useEffect(() => {
    if (!signatureBox || activeTab !== "type") return;
    if (!typedName.trim()) return;

    setIsPostVerified(false);

    const canvas = document.createElement("canvas");
    canvas.width = signatureBox.width;
    canvas.height = signatureBox.height;

    const ctx = canvas.getContext("2d")!;
    ctx.font = fontOptions[selectedFont].font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#0f172a";
    ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);

    const image = canvas.toDataURL("image/png");
    setSignatureImage(image);
    onSignatureChange({ image, ...signatureBox });
  }, [typedName, selectedFont, activeTab, signatureBox]);

  /* ================= DRAW SIGNATURE ================= */
  const getCoords = (e: React.MouseEvent) => {
    const rect = signCanvasRef!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent) => {
    if (!signatureBox) return;
    const ctx = signCanvasRef!.getContext("2d")!;
    ctx.clearRect(0, 0, signCanvasRef!.width, signCanvasRef!.height);
    setSignatureImage(null);
    setIsPostVerified(false);
    setIsDrawing(true);
    setLastPos(getCoords(e));
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const ctx = signCanvasRef!.getContext("2d")!;
    const pos = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
    setLastPos(pos);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const image = signCanvasRef!.toDataURL("image/png");
    setSignatureImage(image);
    onSignatureChange({ image, ...signatureBox });
  };

  /* ================= RENDER - UNIFIED UI ================= */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* 🔐 Biometric Popup */}
      {showBiometric && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "420px", maxWidth: "100%" }}>
            <BiometricVerify
              credentialId={certificate.credentialId}
              onComplete={() => {
                if (verifyMode === "pre") setIsPreVerified(true);
                else setIsPostVerified(true);
                setShowBiometric(false);
              }}
              onCancel={() => setShowBiometric(false)}
            />
          </div>
        </div>
      )}

      {/* UNIFIED HEADER - Same layout for both self-sign and institution */}
      <div style={{ 
        background: "white", 
        border: `1px solid ${t.cardBorder}`, 
        borderRadius: "16px", 
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: t.cardBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: t.headerIcon,
          }}>
            <Shield size={24} />
          </div>
          <div>
            <h2 style={{ 
              fontFamily: "Space Grotesk, sans-serif", 
              fontSize: "20px", 
              fontWeight: 700, 
              color: "#0f172a",
              margin: 0 
            }}>
              Sign Certificate
            </h2>
            <p style={{ 
              fontSize: "14px", 
              color: "#64748b", 
              margin: "4px 0 0 0" 
            }}>
              Review and digitally sign your credential
            </p>
          </div>
        </div>

        {/* Sequential Signing Info - Unified for both modes */}
        <div style={{
          background: t.cardBg,
          border: `1px solid ${t.cardBorder}`,
          borderRadius: "12px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: t.accentColor, fontWeight: 600, fontSize: "14px" }}>
            <Users size={16} />
            Sequential Signing
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ fontSize: "13px", color: "#64748b" }}>
              {isSelfSign ? "Signers" : "Institutions"}: <span style={{ color: "#0f172a", fontWeight: 600 }}>{signers.length} signer(s) required</span>
            </div>
            
            {/* Signer List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {signers.map((signer, idx) => (
                <div key={signer.id} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  background: signer.isMine ? "white" : "transparent",
                  border: signer.isMine ? `1px solid ${t.cardBorder}` : "none",
                  borderRadius: "8px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                    <div style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: signer.signed ? "#16a34a" : signer.isMine ? t.accentColor : "#cbd5e1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}>
                      {signer.signed ? "✓" : idx + 1}
                    </div>
                    <span style={{ 
                      color: signer.isMine ? "#0f172a" : "#64748b",
                      fontWeight: signer.isMine ? 600 : 400,
                    }}>
                      {signer.name}
                    </span>
                  </div>
                  <span style={{
                    fontSize: "12px",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: signer.signed ? "#dcfce7" : signer.isMine ? t.cardBg : "#f1f5f9",
                    color: signer.signed ? "#16a34a" : signer.isMine ? t.accentColor : "#64748b",
                    fontWeight: 600,
                  }}>
                    {signer.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Status Message */}
            <div style={{ 
              marginTop: "8px",
              padding: "10px 12px",
              background: isMyTurn ? "#fef3c7" : "#f0fdf4",
              border: `1px solid ${isMyTurn ? "#fcd34d" : "#86efac"}`,
              borderRadius: "8px",
              fontSize: "13px",
              color: isMyTurn ? "#92400e" : "#16a34a",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              {isMyTurn ? (
                <>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b", animation: "pulse 2s infinite" }} />
                  {isSelfSign ? "Your turn to sign" : `Waiting for previous signer: You are signer #${myUnsignedIndex + 1}`}
                </>
              ) : (
                <>Waiting for your turn...</>
              )}
            </div>
          </div>
        </div>

        {/* Blockchain Security Badge */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 16px",
          background: "#f8fafc",
          borderRadius: "8px",
          fontSize: "13px",
          color: "#64748b",
        }}>
          <Lock size={14} color={t.accentColor} />
          <span>Blockchain Secured — Signature will be permanently stored on blockchain</span>
        </div>
      </div>

      {/* 🔐 PRE VERIFY BUTTON */}
      {!isPreVerified && isMyTurn && (
        <button
          onClick={() => { setVerifyMode("pre"); setShowBiometric(true); }}
          style={{
            width: "100%", padding: "13px", borderRadius: "12px",
            border: "none", background: t.gradient, color: "white",
            fontSize: "15px", fontWeight: 600, cursor: "pointer",
            boxShadow: t.btnShadow, transition: "all 0.2s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          }}
          onMouseEnter={e => { (e.currentTarget.style.transform = "translateY(-2px)"); (e.currentTarget.style.boxShadow = t.btnShadowHover); }}
          onMouseLeave={e => { (e.currentTarget.style.transform = "translateY(0)"); (e.currentTarget.style.boxShadow = t.btnShadow); }}
        >
          <Lock size={18} /> 🔐 Verify Identity Before Signing
        </button>
      )}

      {/* Waiting message if not your turn */}
      {!isPreVerified && !isMyTurn && (
        <div style={{
          padding: "16px",
          background: "#fef3c7",
          border: "1px solid #fcd34d",
          borderRadius: "12px",
          textAlign: "center",
          color: "#92400e",
          fontSize: "14px",
        }}>
          Please wait for previous signers to complete their signatures.
        </div>
      )}

      {/* AFTER PRE VERIFY */}
      {isPreVerified && isMyTurn && (
        <>
          {/* PDF Preview */}
          <div style={{ border: `1px solid ${t.cardBorder}`, borderRadius: "16px", background: t.cardBg, overflow: "auto", position: "relative" }}>
            <div style={{ position: "relative", margin: "0 auto", background: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", width: pdfSize.width, height: pdfSize.height }}>
              <canvas ref={setPdfCanvasRef} />

              {certificate.signatureFields?.map((field: SignatureField) => {
                const matchesByKey = field.signerPublicKey?.toLowerCase() === myPublicKey?.toLowerCase();
                const isStudentBox = field.isStudent === true || field.isStudent === 1;
                const isCredentialStudent = certificate.studentPublicKey?.toLowerCase() === myPublicKey?.toLowerCase();
                const isMine = !field.signed && (matchesByKey || (isStudentBox && isCredentialStudent));
                
                const fieldColor = formatColor(field.color);
                
                return (
                  <div
                    key={field.id}
                    style={{
                      position: "absolute",
                      left: field.xRatio * pdfSize.width,
                      top: field.yRatio * pdfSize.height,
                      width: field.wRatio * pdfSize.width,
                      height: field.hRatio * pdfSize.height,
                      border: `2px dashed ${fieldColor}`,
                      borderRadius: "8px",
                      zIndex: isMine ? 10 : 1,
                    }}
                  >
                    {/* Your Signature Label - Shows for both modes */}
                    {isMine && !signatureImage && (
                      <div style={{
                        position: "absolute", 
                        top: "-28px", 
                        left: "50%", 
                        transform: "translateX(-50%)",
                        padding: "4px 12px", 
                        borderRadius: "6px", 
                        fontSize: "12px", 
                        fontWeight: 700,
                        color: "white", 
                        background: fieldColor, 
                        whiteSpace: "nowrap",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      }}>
                        Your Signature
                      </div>
                    )}
                  </div>
                );
              })}

              {signatureImage && signatureBox && (
                <img
                  src={signatureImage}
                  style={{
                    position: "absolute",
                    left: signatureBox.x, top: signatureBox.y,
                    width: signatureBox.width, height: signatureBox.height,
                    zIndex: 11,
                  }}
                />
              )}
            </div>
          </div>

          {/* SIGN TOOLS */}
          {signatureBox && (
            <div style={{ background: "white", border: `1px solid ${t.cardBorder}`, borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>Add Signature</h3>
                <button
                  onClick={clearSignature}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "7px 14px", borderRadius: "8px",
                    border: `1px solid ${t.cardBorder}`, background: "white",
                    color: "#64748b", fontSize: "13px", fontWeight: 500,
                    cursor: "pointer", transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { (e.currentTarget.style.background = t.clearBtnHover); (e.currentTarget.style.color = t.accentColor); }}
                  onMouseLeave={e => { (e.currentTarget.style.background = "white"); (e.currentTarget.style.color = "#64748b"); }}
                >
                  <RotateCcw size={14} /> Clear
                </button>
              </div>

              {/* Tab Toggle */}
              <div style={{ display: "flex", gap: "8px" }}>
                {(["type", "draw"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      padding: "8px 18px", borderRadius: "9px", border: "none",
                      background: activeTab === tab ? t.gradient : "#f1f5f9",
                      color: activeTab === tab ? "white" : "#64748b",
                      fontSize: "13px", fontWeight: 600, cursor: "pointer",
                      boxShadow: activeTab === tab ? t.btnShadow : "none",
                      transition: "all 0.2s",
                    }}
                  >
                    {tab === "type" ? <><Type size={14} /> Type</> : <><MousePointer size={14} /> Draw</>}
                  </button>
                ))}
              </div>

              {/* Type Tab */}
              {activeTab === "type" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <input
                    style={{
                      width: "100%", padding: "11px 14px", borderRadius: "10px",
                      border: `1px solid ${t.inputBorder}`, background: "#f8fafc",
                      fontSize: "14px", color: "#0f172a", outline: "none",
                      transition: "border 0.2s", boxSizing: "border-box",
                    }}
                    placeholder="Type your name / institution name"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    onFocus={e => (e.currentTarget.style.borderColor = t.inputFocusBorder)}
                    onBlur={e => (e.currentTarget.style.borderColor = t.inputBorder)}
                  />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {fontOptions.map((f, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedFont(i)}
                        style={{
                          padding: "7px 16px", borderRadius: "8px", border: "none",
                          background: selectedFont === i ? t.gradient : "#f1f5f9",
                          color: selectedFont === i ? "white" : "#64748b",
                          fontSize: "13px", fontWeight: 600, cursor: "pointer",
                          boxShadow: selectedFont === i ? t.btnShadow : "none",
                          transition: "all 0.2s",
                        }}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Draw Tab */}
              {activeTab === "draw" && signatureBox && (
                <canvas
                  ref={setSignCanvasRef}
                  width={signatureBox.width}
                  height={signatureBox.height}
                  style={{
                    border: `1px solid ${t.cardBorder}`, borderRadius: "10px",
                    cursor: "crosshair", background: "#fafafa",
                  }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
              )}

              {/* Post Verify Button - UNIFIED: "Verify & Confirm Signature" for both modes */}
              {signatureImage && !isPostVerified && (
                <button
                  onClick={() => { setVerifyMode("post"); setShowBiometric(true); }}
                  style={{
                    width: "100%", padding: "13px", borderRadius: "12px",
                    border: "none", background: t.gradient, color: "white",
                    fontSize: "15px", fontWeight: 600, cursor: "pointer",
                    boxShadow: t.btnShadow, transition: "all 0.2s", marginTop: "8px",
                  }}
                  onMouseEnter={e => { (e.currentTarget.style.transform = "translateY(-2px)"); (e.currentTarget.style.boxShadow = t.btnShadowHover); }}
                  onMouseLeave={e => { (e.currentTarget.style.transform = "translateY(0)"); (e.currentTarget.style.boxShadow = t.btnShadow); }}
                >
                  Verify & Confirm Signature
                </button>
              )}

              {/* Success */}
              {isPostVerified && (
                <div style={{
                  textAlign: "center", padding: "12px 20px", borderRadius: "10px",
                  background: t.verifyBg, border: `1px solid ${t.verifyBorder}`,
                  color: t.accentColor, fontSize: "15px", fontWeight: 600,
                }}>
                  ✔ Signature Verified Successfully
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};