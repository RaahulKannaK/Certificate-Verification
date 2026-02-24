import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { SigningType, Signer } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import {
  Square, Type, Eraser, Move, CheckCircle, Clock, User,
} from "lucide-react";
import { toast } from "sonner";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/* ================= CONSTANTS ================= */
const DOC_WIDTH = 800;
const DOC_HEIGHT = 1120;

/* ================= TYPES ================= */
interface DocumentEditorProps {
  file: File;
  signingType: SigningType;
  signers: Signer[];
  credentialId?: string;
  mode?: "issue" | "sign";
  onComplete: () => void;
}

interface SignatureBox {
  id: string;
  signerPublicKey: string;
  color: Signer["color"];
  xRatio: number;
  yRatio: number;
  widthRatio: number;
  heightRatio: number;
  page?: number;
  signed?: boolean;
}

/* ================= HELPERS ================= */
const clamp = (v: number) => Math.min(1, Math.max(0, v));

/* ================= THEME ================= */
const getTheme = (role: string) => {
  if (role === "institution") {
    return {
      pageBg: "#f0faf4",
      blob1: "radial-gradient(circle, #bbf7d0 0%, transparent 70%)",
      blob2: "radial-gradient(circle, #d1fae5 0%, transparent 70%)",
      gradient: "linear-gradient(135deg, #16a34a, #059669)",
      btnShadow: "0 4px 12px rgba(22,163,74,0.28)",
      btnShadowHover: "0 8px 20px rgba(22,163,74,0.40)",
      accentColor: "#16a34a",
      toolbarBg: "rgba(255,255,255,0.92)",
      toolbarBorder: "#bbf7d0",
      toolActiveBg: "linear-gradient(135deg, #16a34a, #059669)",
      toolActiveColor: "white",
      toolHoverBg: "#f0fdf4",
      cardBg: "white",
      cardBorder: "#bbf7d0",
      sidebarBg: "rgba(255,255,255,0.92)",
      sidebarBorder: "#bbf7d0",
      signerCardBg: "#f0fdf4",
      signedBg: "#f0fdf4",
      signedColor: "#16a34a",
      pendingColor: "#64748b",
      docBorder: "#bbf7d0",
    };
  }
  // Student — Purple
  return {
    pageBg: "#f5f3ff",
    blob1: "radial-gradient(circle, #ddd6fe 0%, transparent 70%)",
    blob2: "radial-gradient(circle, #ede9fe 0%, transparent 70%)",
    gradient: "linear-gradient(135deg, #7c3aed, #6366f1)",
    btnShadow: "0 4px 12px rgba(124,58,237,0.28)",
    btnShadowHover: "0 8px 20px rgba(124,58,237,0.40)",
    accentColor: "#7c3aed",
    toolbarBg: "rgba(255,255,255,0.92)",
    toolbarBorder: "#ddd6fe",
    toolActiveBg: "linear-gradient(135deg, #7c3aed, #6366f1)",
    toolActiveColor: "white",
    toolHoverBg: "#f5f3ff",
    cardBg: "white",
    cardBorder: "#ddd6fe",
    sidebarBg: "rgba(255,255,255,0.92)",
    sidebarBorder: "#ddd6fe",
    signerCardBg: "#f5f3ff",
    signedBg: "#f0fdf4",
    signedColor: "#16a34a",
    pendingColor: "#64748b",
    docBorder: "#ddd6fe",
  };
};

/* ================= COMPONENT ================= */
export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  file, signingType, signers, credentialId, mode = "issue", onComplete,
}) => {
  const { user } = useAuth();
  const t = getTheme(user?.role || "student");

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfSize, setPdfSize] = useState({ width: DOC_WIDTH, height: DOC_HEIGHT });
  const [signatureBoxes, setSignatureBoxes] = useState<SignatureBox[]>([]);
  const [selectedTool, setSelectedTool] = useState<"move" | "box" | "text" | "eraser">("move");
  const [draggingBox, setDraggingBox] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);

  /* ================= PDF LOAD ================= */
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPdfUrl(url);

    const loadPdf = async () => {
      const pdf = await pdfjsLib.getDocument(url).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: DOC_WIDTH / page.getViewport({ scale: 1 }).width });
      setPdfSize({ width: viewport.width, height: viewport.height });
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;
    };

    loadPdf();
    return () => URL.revokeObjectURL(url);
  }, [file]);

  /* ================= INIT SIGNATURE BOXES ================= */
  useEffect(() => {
    if (!signers?.length) return;
    const boxes: SignatureBox[] = signers.map((signer, index) => ({
      id: crypto.randomUUID(),
      signerPublicKey: signer.publicKey,
      color: signer.color,
      xRatio: clamp(0.1 + index * 0.25),
      yRatio: 0.55,
      widthRatio: clamp(220 / DOC_WIDTH),
      heightRatio: clamp(64 / DOC_HEIGHT),
      page: 1,
      signed: false,
    }));
    setSignatureBoxes(boxes);
  }, [signers]);

  /* ================= DRAG LOGIC ================= */
  const handleMouseDown = (e: React.MouseEvent, boxId: string) => {
    if (selectedTool !== "move" || mode === "sign") return;
    const rect = containerRef.current?.getBoundingClientRect();
    const box = signatureBoxes.find((b) => b.id === boxId);
    if (!rect || !box) return;
    setDraggingBox(boxId);
    setDragOffset({
      x: e.clientX - rect.left - box.xRatio * pdfSize.width,
      y: e.clientY - rect.top - box.yRatio * pdfSize.height,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingBox) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSignatureBoxes((prev) =>
      prev.map((box) =>
        box.id === draggingBox
          ? {
              ...box,
              xRatio: clamp((e.clientX - rect.left - dragOffset.x) / pdfSize.width),
              yRatio: clamp((e.clientY - rect.top - dragOffset.y) / pdfSize.height),
            }
          : box
      )
    );
  };

  const handleMouseUp = () => setDraggingBox(null);

  /* ================= ISSUE CREDENTIAL ================= */
  const handleIssueCredential = async () => {
    if (!user?.walletPublicKey) { toast.error("Student wallet missing"); return; }
    try {
      setProcessing(true);
      const formData = new FormData();
      formData.append("certificate", file);
      const uploadRes = await axios.post(
        `${import.meta.env.VITE_API_URL}/institution/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const payload = {
        studentPublicKey: user.walletPublicKey,
        institutionPublicKey: signers.map((s) => s.publicKey),
        credentialId: `CRD-${Date.now()}`,
        filePath: uploadRes.data.filePath,
        title: file.name,
        purpose: "Digital document signing",
        signingType, signers,
        signatureFields: signatureBoxes.map((b) => ({
          signerPublicKey: b.signerPublicKey,
          xRatio: Number(b.xRatio), yRatio: Number(b.yRatio),
          widthRatio: Number(b.widthRatio), heightRatio: Number(b.heightRatio),
          page: b.page || 1, color: b.color,
        })),
      };
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/institution/issueCredential`, payload);
      if (res.data.success) { toast.success("Credential issued successfully"); onComplete(); }
      else toast.error(res.data.message);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Server error");
    } finally {
      setProcessing(false);
    }
  };

  /* ================= SIGN DOCUMENT ================= */
  const handleSignDocument = async (box: SignatureBox) => {
    if (!user?.walletPublicKey || !credentialId) return;
    try {
      setProcessing(true);
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/credential/sign`, {
        credentialId, signerPublicKey: user.walletPublicKey,
      });
      if (res.data.success) {
        toast.success("Signed successfully");
        setSignatureBoxes((prev) => prev.map((b) => b.id === box.id ? { ...b, signed: true } : b));
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Sign failed");
    } finally {
      setProcessing(false);
    }
  };

  /* ================= TOOLS ================= */
  const tools = [
    { id: "move", icon: <Move size={15} />, label: "Move" },
    { id: "box",  icon: <Square size={15} />, label: "Box" },
    { id: "text", icon: <Type size={15} />, label: "Text" },
    { id: "eraser", icon: <Eraser size={15} />, label: "Eraser" },
  ];

  /* ================= UI ================= */
  return (
    <div style={{ minHeight: "100vh", background: t.pageBg, position: "relative", overflow: "hidden" }}>

      {/* Background blobs */}
      <div style={{ position: "fixed", top: "-100px", right: "-100px", width: "500px", height: "500px", borderRadius: "50%", background: t.blob1, zIndex: 0, pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-80px", left: "-80px", width: "420px", height: "420px", borderRadius: "50%", background: t.blob2, zIndex: 0, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, padding: "24px" }}>
        <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>

          {/* ── DOCUMENT AREA ── */}
          <div style={{ flex: 1 }}>

            {/* Toolbar */}
            <div style={{
              display: "flex", gap: "8px", padding: "12px 16px",
              background: t.toolbarBg, backdropFilter: "blur(16px)",
              borderRadius: "14px", border: `1px solid ${t.toolbarBorder}`,
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: "16px",
            }}>
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id as any)}
                  onMouseEnter={() => setHoveredTool(tool.id)}
                  onMouseLeave={() => setHoveredTool(null)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "7px 14px", borderRadius: "9px", border: "none",
                    background: selectedTool === tool.id
                      ? t.toolActiveBg
                      : hoveredTool === tool.id ? t.toolHoverBg : "transparent",
                    color: selectedTool === tool.id ? t.toolActiveColor : "#64748b",
                    fontSize: "13px", fontWeight: 600, cursor: "pointer",
                    boxShadow: selectedTool === tool.id ? t.btnShadow : "none",
                    transition: "all 0.2s",
                  }}
                >
                  {tool.icon} {tool.label}
                </button>
              ))}
            </div>

            {/* Document Canvas */}
            <div style={{
              background: "white", borderRadius: "16px",
              border: `1px solid ${t.docBorder}`,
              boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
              overflow: "auto", position: "relative",
            }}>
              <div
                ref={containerRef}
                style={{ position: "relative", width: DOC_WIDTH, height: "75vh", margin: "0 auto" }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <canvas ref={canvasRef} width={pdfSize.width} height={pdfSize.height} style={{ width: "100%", height: "100%" }} />

                {signatureBoxes.map((box) => {
                  const signer = signers.find((s) => s.publicKey === box.signerPublicKey);
                  return (
                    <div
                      key={box.id}
                      onMouseDown={(e) => handleMouseDown(e, box.id)}
                      className="group"
                      style={{
                        position: "absolute",
                        left: box.xRatio * pdfSize.width,
                        top: box.yRatio * pdfSize.height,
                        width: box.widthRatio * pdfSize.width,
                        height: box.heightRatio * pdfSize.height,
                        border: `2px dashed hsl(var(--${box.color}))`,
                        borderRadius: "10px",
                        cursor: selectedTool === "move" && mode !== "sign" ? "move" : "default",
                      }}
                    >
                      <div
                        className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100"
                        style={{ background: `hsl(var(--${box.color}))`, color: "#fff", whiteSpace: "nowrap", fontWeight: 600 }}
                      >
                        {signer?.name}
                      </div>

                      {mode === "sign" && !box.signed && (
                        <button
                          onClick={() => handleSignDocument(box)}
                          disabled={processing}
                          style={{
                            position: "absolute", bottom: "4px", right: "4px",
                            padding: "4px 12px", borderRadius: "6px", border: "none",
                            background: t.gradient, color: "white",
                            fontSize: "11px", fontWeight: 600,
                            cursor: processing ? "not-allowed" : "pointer",
                            boxShadow: t.btnShadow,
                          }}
                        >
                          Sign
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── SIDEBAR ── */}
          <div style={{ width: "300px", flexShrink: 0 }}>
            <div style={{
              background: t.sidebarBg, backdropFilter: "blur(16px)",
              borderRadius: "18px", border: `1px solid ${t.sidebarBorder}`,
              boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
              padding: "24px", position: "sticky", top: "24px",
            }}>
              <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "16px" }}>
                Signers
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {signers.map((signer) => {
                  const isSigned = signatureBoxes.find((b) => b.signerPublicKey === signer.publicKey)?.signed;
                  return (
                    <div
                      key={signer.id}
                      style={{
                        padding: "14px 16px", borderRadius: "12px",
                        border: `1px solid hsl(var(--${signer.color}))`,
                        background: isSigned ? t.signedBg : t.signerCardBg,
                        transition: "all 0.2s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                        <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: `hsl(var(--${signer.color}) / 0.15)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <User size={14} color={`hsl(var(--${signer.color}))`} />
                        </div>
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{signer.name}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Clock size={12} color={isSigned ? t.signedColor : t.pendingColor} />
                        <span style={{ fontSize: "12px", fontWeight: 500, color: isSigned ? t.signedColor : t.pendingColor }}>
                          {isSigned ? "Signed ✓" : "Pending"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {mode === "issue" && (
                <button
                  onClick={handleIssueCredential}
                  disabled={processing}
                  style={{
                    width: "100%", marginTop: "20px", padding: "13px",
                    borderRadius: "12px", border: "none",
                    background: processing ? "#e2e8f0" : t.gradient,
                    color: processing ? "#94a3b8" : "white",
                    fontSize: "15px", fontWeight: 700,
                    cursor: processing ? "not-allowed" : "pointer",
                    boxShadow: processing ? "none" : t.btnShadow,
                    transition: "all 0.2s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  }}
                  onMouseEnter={e => { if (!processing) (e.currentTarget.style.boxShadow = t.btnShadowHover); }}
                  onMouseLeave={e => { if (!processing) (e.currentTarget.style.boxShadow = t.btnShadow); }}
                >
                  <CheckCircle size={18} />
                  {processing ? "Issuing..." : "Issue Credential"}
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};