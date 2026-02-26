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

const DOC_WIDTH = 800;
const DOC_HEIGHT = 1120;

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

const clamp = (v: number) => Math.min(1, Math.max(0, v));

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  file, signingType, signers, credentialId, mode = "issue", onComplete,
}) => {

  const { user } = useAuth();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [pdfSize, setPdfSize] = useState({ width: DOC_WIDTH, height: DOC_HEIGHT });
  const [signatureBoxes, setSignatureBoxes] = useState<SignatureBox[]>([]);
  const [selectedTool, setSelectedTool] = useState<"move" | "box" | "text" | "eraser">("move");
  const [draggingBox, setDraggingBox] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);

  /* ================= PDF LOAD ================= */
  useEffect(() => {
    if (!file) return;

    const url = URL.createObjectURL(file);

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

  /* ================= INIT SIGNATURE BOXES (FIXED SELF FLOW) ================= */
  useEffect(() => {

    let activeSigners = signers;

    if (signingType === "self" && user?.walletPublicKey) {
      activeSigners = [{
        id: "self",
        name: "Institution",
        publicKey: user.walletPublicKey,
        color: "primary",
      } as any];
    }

    if (!activeSigners?.length) return;

    const boxes: SignatureBox[] = activeSigners.map((signer, index) => ({
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

  }, [signers, signingType, user]);

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
    /* ================= ISSUE CREDENTIAL (FIXED) ================= */
  const handleIssueCredential = async () => {

    if (!user?.walletPublicKey) {
      toast.error("Institution wallet missing");
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

      let institutionKeys: string[] = [];

      if (signingType === "self") {
        institutionKeys = [user.walletPublicKey];
      } else {
        institutionKeys = signers
          .filter((s) => s.publicKey && s.publicKey.trim() !== "")
          .map((s) => s.publicKey);
      }

      if (institutionKeys.length === 0) {
        toast.error("No valid signers found");
        setProcessing(false);
        return;
      }

      const payload = {
        studentPublicKey: user.walletPublicKey,
        institutionPublicKey: institutionKeys,
        credentialId: `CRD-${Date.now()}`,
        filePath: uploadRes.data.filePath,
        title: file.name,
        purpose: "Digital document signing",
        signingType,
        signers,
        signatureFields: signatureBoxes,
      };

      console.log("🚀 Sending payload:", payload);

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/institution/issueCredential`,
        payload
      );

      if (res.data.success) {
        toast.success("Credential issued successfully");
        onComplete();
      } else {
        toast.error(res.data.message);
      }

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

  /* ================= UI ================= */
  return (
    <div style={{ padding: "20px" }}>

      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ position: "relative", width: DOC_WIDTH }}
      >
        <canvas
          ref={canvasRef}
          width={pdfSize.width}
          height={pdfSize.height}
          style={{ width: "100%" }}
        />

        {signatureBoxes.map((box) => (
          <div
            key={box.id}
            onMouseDown={(e) => handleMouseDown(e, box.id)}
            style={{
              position: "absolute",
              left: box.xRatio * pdfSize.width,
              top: box.yRatio * pdfSize.height,
              width: box.widthRatio * pdfSize.width,
              height: box.heightRatio * pdfSize.height,
              border: "2px dashed #3b82f6",
              borderRadius: "8px",
              cursor: "move",
            }}
          >
            {mode === "sign" && !box.signed && (
              <button
                onClick={() => handleSignDocument(box)}
                disabled={processing}
                style={{
                  position: "absolute",
                  bottom: 4,
                  right: 4,
                  padding: "4px 8px",
                  fontSize: "12px",
                  background: "#16a34a",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                }}
              >
                Sign
              </button>
            )}
          </div>
        ))}
      </div>

      {mode === "issue" && (
        <button
          onClick={handleIssueCredential}
          disabled={processing}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            background: "#16a34a",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          {processing ? "Issuing..." : "Issue Credential"}
        </button>
      )}
    </div>
  );
};