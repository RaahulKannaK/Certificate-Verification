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

/* ================= COMPONENT ================= */
export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  file, signingType, signers, credentialId, mode = "issue", onComplete,
}) => {

  const { user } = useAuth();

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
      const viewport = page.getViewport({
        scale: DOC_WIDTH / page.getViewport({ scale: 1 }).width
      });

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
    if (!user?.walletPublicKey) {
      toast.error("Student wallet missing");
      return;
    }

    try {
      setProcessing(true);

      const formData = new FormData();
      formData.append("certificate", file);

      const uploadRes = await axios.post(
        `${import.meta.env.VITE_API_URL}/institution/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      let finalInstitutionKeys: string[] = [];

      if (signingType === "self") {
        finalInstitutionKeys = [];
      } else {
        finalInstitutionKeys = signers.map((s) => s.publicKey);

        if (finalInstitutionKeys.includes(user.walletPublicKey)) {
          toast.error("Student and Institution wallet cannot be same");
          setProcessing(false);
          return;
        }

        if (finalInstitutionKeys.length === 0) {
          toast.error("At least one institution required");
          setProcessing(false);
          return;
        }
      }

      const payload = {
        studentPublicKey: user.walletPublicKey,
        institutionPublicKey: finalInstitutionKeys,
        credentialId: `CRD-${Date.now()}`,
        filePath: uploadRes.data.filePath,
        title: file.name,
        purpose: "Digital document signing",
        signingType,
        signers: signingType === "self" ? [] : signers,
        signatureFields: signatureBoxes.map((b) => ({
          signerPublicKey: b.signerPublicKey,
          xRatio: Number(b.xRatio),
          yRatio: Number(b.yRatio),
          widthRatio: Number(b.widthRatio),
          heightRatio: Number(b.heightRatio),
          page: b.page || 1,
          color: b.color,
        })),
      };

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/institution/issueCredential`,
        payload
      );

      if (res.data.success) {
        toast.success("Credential issued successfully");
        onComplete();
      } else {
        toast.error(res.data.message || "Issue failed");
      }

    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Server error");
    } finally {
      setProcessing(false);
    }
  };

  /* ================= SIGN DOCUMENT ================= */
  const handleSignDocument = async (box: SignatureBox) => {
    if (!user?.walletPublicKey || !credentialId) return;

    try {
      setProcessing(true);

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/credential/sign`,
        {
          credentialId,
          signerPublicKey: user.walletPublicKey,
        }
      );

      if (res.data.success) {
        toast.success("Signed successfully");
        setSignatureBoxes((prev) =>
          prev.map((b) =>
            b.id === box.id ? { ...b, signed: true } : b
          )
        );
      }

    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Sign failed");
    } finally {
      setProcessing(false);
    }
  };

  const tools = [
    { id: "move", icon: <Move size={15} />, label: "Move" },
    { id: "box", icon: <Square size={15} />, label: "Box" },
    { id: "text", icon: <Type size={15} />, label: "Text" },
    { id: "eraser", icon: <Eraser size={15} />, label: "Eraser" },
  ];
    return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <div style={{ padding: "24px" }}>
        <div style={{ display: "flex", gap: "24px" }}>

          {/* DOCUMENT AREA */}
          <div style={{ flex: 1 }}>

            {/* Toolbar */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id as any)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    cursor: "pointer",
                  }}
                >
                  {tool.icon} {tool.label}
                </button>
              ))}
            </div>

            {/* PDF Canvas */}
            <div style={{ position: "relative" }}>
              <div
                ref={containerRef}
                style={{ position: "relative", width: DOC_WIDTH }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                <canvas
                  ref={canvasRef}
                  width={pdfSize.width}
                  height={pdfSize.height}
                />

                {signatureBoxes.map((box) => {
                  const signer = signers.find(
                    (s) => s.publicKey === box.signerPublicKey
                  );

                  return (
                    <div
                      key={box.id}
                      onMouseDown={(e) => handleMouseDown(e, box.id)}
                      style={{
                        position: "absolute",
                        left: box.xRatio * pdfSize.width,
                        top: box.yRatio * pdfSize.height,
                        width: box.widthRatio * pdfSize.width,
                        height: box.heightRatio * pdfSize.height,
                        border: "2px dashed #6366f1",
                        borderRadius: "8px",
                      }}
                    >
                      {mode === "sign" && !box.signed && (
                        <button
                          onClick={() => handleSignDocument(box)}
                          disabled={processing}
                          style={{
                            position: "absolute",
                            bottom: "4px",
                            right: "4px",
                            padding: "4px 10px",
                            fontSize: "12px",
                            cursor: "pointer",
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

          {/* SIDEBAR */}
          <div style={{ width: "280px" }}>
            <h3>Signers</h3>

            {signers.map((signer) => {
              const isSigned = signatureBoxes.find(
                (b) => b.signerPublicKey === signer.publicKey
              )?.signed;

              return (
                <div key={signer.id} style={{ marginBottom: "12px" }}>
                  <div>{signer.name}</div>
                  <div style={{ fontSize: "12px", color: isSigned ? "green" : "gray" }}>
                    {isSigned ? "Signed ✓" : "Pending"}
                  </div>
                </div>
              );
            })}

            {mode === "issue" && (
              <button
                onClick={handleIssueCredential}
                disabled={processing}
                style={{
                  marginTop: "20px",
                  width: "100%",
                  padding: "12px",
                  cursor: "pointer",
                }}
              >
                {processing ? "Issuing..." : "Issue Credential"}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};