import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { SigningType, Signer } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import {
  Square,
  Type,
  Eraser,
  Move,
  CheckCircle,
  Clock,
  User,
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
  file?: File;
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
  file,
  signingType,
  signers,
  credentialId,
  mode = "issue",
  onComplete,
}) => {
  const { user } = useAuth();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfSize, setPdfSize] = useState({
    width: DOC_WIDTH,
    height: DOC_HEIGHT,
  });

  const [signatureBoxes, setSignatureBoxes] = useState<SignatureBox[]>([]);
  const [selectedTool, setSelectedTool] =
    useState<"move" | "box" | "text" | "eraser">("move");

  const [draggingBox, setDraggingBox] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);

  /* ================= PDF LOAD ================= */
  useEffect(() => {
    if (!file && !credentialId) return;

    const loadPdf = async () => {
      let url = "";

      // ISSUE MODE → local file
      if (file) {
        url = URL.createObjectURL(file);
      }

      // SIGN MODE → fetch from backend (Cloudinary URL)
      if (credentialId && !file) {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/institution/issueCredential`
        );
        url = res.data.filePath; // Cloudinary URL
      }

      setPdfUrl(url);

      const pdf = await pdfjsLib.getDocument(url).promise;
      const page = await pdf.getPage(1);

      const viewport = page.getViewport({
        scale: DOC_WIDTH / page.getViewport({ scale: 1 }).width,
      });

      setPdfSize({ width: viewport.width, height: viewport.height });

      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport }).promise;
    };

    loadPdf();
  }, [file, credentialId]);

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
              xRatio: clamp(
                (e.clientX - rect.left - dragOffset.x) / pdfSize.width
              ),
              yRatio: clamp(
                (e.clientY - rect.top - dragOffset.y) / pdfSize.height
              ),
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
      formData.append("certificate", file!);

      const uploadRes = await axios.post(
        `${import.meta.env.VITE_API_URL}/institution/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const payload = {
        studentPublicKey: user.walletPublicKey,
        institutionPublicKey: signers.map((s) => s.publicKey),
        credentialId: `CRD-${Date.now()}`,
        filePath: uploadRes.data.filePath, // Cloudinary URL
        title: file?.name,
        purpose: "Digital document signing",
        signingType,
        signers,
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
    <div className="animate-fade-in">
      <div className="flex gap-6">
        <div className="flex-1">
          <div
            ref={containerRef}
            className="relative glass rounded-2xl overflow-auto mx-auto"
            style={{ width: DOC_WIDTH, height: "75vh" }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <canvas
              ref={canvasRef}
              width={pdfSize.width}
              height={pdfSize.height}
              className="w-full h-full"
            />

            {signatureBoxes.map((box) => (
              <div
                key={box.id}
                onMouseDown={(e) => handleMouseDown(e, box.id)}
                className="absolute group cursor-move"
                style={{
                  left: box.xRatio * pdfSize.width,
                  top: box.yRatio * pdfSize.height,
                  width: box.widthRatio * pdfSize.width,
                  height: box.heightRatio * pdfSize.height,
                  border: `2px dashed hsl(var(--${box.color}))`,
                  borderRadius: 10,
                }}
              >
                {mode === "sign" && !box.signed && (
                  <Button
                    size="xs"
                    className="absolute bottom-0 right-0 m-1"
                    onClick={() => handleSignDocument(box)}
                    disabled={processing}
                  >
                    Sign
                  </Button>
                )}
              </div>
            ))}
          </div>

          {mode === "issue" && (
            <Button
              variant="hero"
              className="mt-4"
              onClick={handleIssueCredential}
              disabled={processing}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {processing ? "Issuing..." : "Issue Credential"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};