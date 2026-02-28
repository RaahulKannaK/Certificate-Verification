import { useState, useEffect, useMemo, useRef } from "react";
import { Type, MousePointer, RotateCcw } from "lucide-react";
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
const getTheme = (role: string) => {
  if (role === "institution") {
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
    };
  }
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
  };
};

export const CertificatePreview = ({
  certificate,
  myPublicKey,
  onSignatureChange,
}: CertificatePreviewProps) => {
  const { user } = useAuth();
  const t = getTheme(user?.role || "student");

  const [pdfCanvasRef, setPdfCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [signCanvasRef, setSignCanvasRef] = useState<HTMLCanvasElement | null>(null);

  const [pdfSize, setPdfSize] = useState({ width: DOC_WIDTH, height: 0 });
  const [activeTab, setActiveTab] = useState<"type" | "draw">("type");
  const [typedName, setTypedName] = useState("");
  const [selectedFont, setSelectedFont] = useState(0);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);

  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);

  /* 🔐 SECURITY STATES */
  const [isPreVerified, setIsPreVerified] = useState(false);
  const [isPostVerified, setIsPostVerified] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);
  const [verifyMode, setVerifyMode] = useState<"pre" | "post">("pre");

  const documentUrl = certificate.filePath;

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

      // ONLY for self-sign: also match noSignerKey fallback
      const isSelfSign = certificate.signingType === "self";
      const noSignerKey = !b.signerPublicKey || b.signerPublicKey === "";

      if (isSelfSign) {
        return notSigned && (
          matchesByKey ||
          (isStudentBox && isCredentialStudent) ||
          (noSignerKey && isCredentialStudent)
        );
      }

      // Sequential / Parallel — original logic, no change
      return notSigned && (matchesByKey || (isStudentBox && isCredentialStudent));
    });
  }, [myPublicKey, certificate.signatureFields, certificate.studentPublicKey, certificate.signingType]);

  const signatureBox = useMemo(() => {
    if (!myBox) return null;
    return {
      x: myBox.xRatio * pdfSize.width,
      y: myBox.yRatio * pdfSize.height,
      width: myBox.wRatio * pdfSize.width || 200,
      height: myBox.hRatio * pdfSize.height || 64,
      color: myBox.color,
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

  /* ================= DRAW SIGNATURE - FIXED ================= */
  const getCoords = (e: React.MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent) => {
    if (!signCanvasRef || !signatureBox) return;
    const pos = getCoords(e, signCanvasRef);
    isDrawingRef.current = true;
    lastPosRef.current = pos;
    setIsDrawing(true);
    setIsPostVerified(false);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawingRef.current || !signCanvasRef) return;
    const ctx = signCanvasRef.getContext("2d")!;
    const pos = getCoords(e, signCanvasRef);

    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    lastPosRef.current = pos;
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current || !signCanvasRef || !signatureBox) return;
    isDrawingRef.current = false;
    setIsDrawing(false);
    const image = signCanvasRef.toDataURL("image/png");
    setSignatureImage(image);
    onSignatureChange({ image, ...signatureBox });
  };

  useEffect(() => {
    if (activeTab === "draw" && signCanvasRef) {
      const ctx = signCanvasRef.getContext("2d")!;
      ctx.clearRect(0, 0, signCanvasRef.width, signCanvasRef.height);
      setSignatureImage(null);
      onSignatureChange(null);
    }
  }, [activeTab, signCanvasRef]);

  /* ================= RENDER ================= */
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

      {/* 🔐 PRE VERIFY BUTTON */}
      {!isPreVerified && (
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
          🔐 Verify Identity Before Signing
        </button>
      )}

      {/* AFTER PRE VERIFY */}
      {isPreVerified && (
        <>
          {/* PDF Preview */}
          <div style={{ border: `1px solid ${t.cardBorder}`, borderRadius: "16px", background: t.cardBg, overflow: "auto", position: "relative" }}>
            <div style={{ position: "relative", margin: "0 auto", background: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", width: pdfSize.width, height: pdfSize.height }}>
              <canvas ref={setPdfCanvasRef} />

              {certificate.signatureFields?.map((field: SignatureField) => {
                const matchesByKey = field.signerPublicKey?.toLowerCase() === myPublicKey?.toLowerCase();
                const isStudentBox = field.isStudent === true || field.isStudent === 1;
                const isCredentialStudent = certificate.studentPublicKey?.toLowerCase() === myPublicKey?.toLowerCase();
                const isSelfSign = certificate.signingType === "self";
                const noSignerKey = !field.signerPublicKey || field.signerPublicKey === "";

                // Self-sign: green box with noSignerKey fallback
                // Sequential/Parallel: original logic unchanged
                const isMine = !field.signed && (
                  isSelfSign
                    ? (matchesByKey || (isStudentBox && isCredentialStudent) || (noSignerKey && isCredentialStudent))
                    : (matchesByKey || (isStudentBox && isCredentialStudent))
                );

                return (
                  <div
                    key={field.id}
                    style={{
                      position: "absolute",
                      left: field.xRatio * pdfSize.width,
                      top: field.yRatio * pdfSize.height,
                      width: field.wRatio * pdfSize.width,
                      height: field.hRatio * pdfSize.height,
                      // Self-sign isMine = green, Sequential/Parallel isMine = original hsl color
                      border: isMine
                        ? (isSelfSign ? "2px solid #16a34a" : `2px dashed hsl(var(--${field.color}))`)
                        : "2px dashed #cbd5e1",
                      background: isMine
                        ? (isSelfSign ? "rgba(22,163,74,0.08)" : "transparent")
                        : "transparent",
                      borderRadius: "8px",
                      zIndex: isMine ? 10 : 1,
                    }}
                  >
                    {isMine && !signatureImage && (
                      <div style={{
                        position: "absolute", top: "-24px", left: "50%", transform: "translateX(-50%)",
                        padding: "2px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700,
                        color: "white",
                        // Self-sign = green label, Sequential/Parallel = original hsl color label
                        background: isSelfSign ? "#16a34a" : `hsl(var(--${field.color}))`,
                        whiteSpace: "nowrap",
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
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                    ✏️ Draw your signature below
                  </p>
                  <canvas
                    ref={setSignCanvasRef}
                    width={Math.max(signatureBox.width,700)}
                    height={Math.max(signatureBox.height,150)}
                    style={{
                      border: `2px solid ${isDrawing ? t.accentColor : t.cardBorder}`,
                      borderRadius: "10px",
                      cursor: "crosshair",
                      background: "#fafafa",
                      touchAction: "none",
                      transition: "border-color 0.2s",
                      display: "block",
                      width: "100%",
                      maxWidth: signatureBox.width,
                    }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                </div>
              )}

              {/* Post Verify Button */}
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
                  background: "#f0fdf4", border: "1px solid #86efac",
                  color: "#16a34a", fontSize: "15px", fontWeight: 600,
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