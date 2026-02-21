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
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPdfUrl(url);

    const loadPdf = async () => {
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
      formData.append("certificate", file);

      const uploadRes = await axios.post(
        "http://localhost:5000/institution/upload",
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
        "http://localhost:5000/institution/issueCredential",
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

      const res = await axios.post("http://localhost:5000/credential/sign", {
        credentialId,
        signerPublicKey: user.walletPublicKey,
      });

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
        {/* DOCUMENT */}
        <div className="flex-1">
          <div className="glass rounded-2xl p-4 mb-4 flex gap-2">
            <Button
              size="sm"
              variant={selectedTool === "move" ? "default" : "ghost"}
              onClick={() => setSelectedTool("move")}
            >
              <Move className="w-4 h-4 mr-1" /> Move
            </Button>
            <Button size="sm" variant="ghost">
              <Square className="w-4 h-4 mr-1" /> Box
            </Button>
            <Button size="sm" variant="ghost">
              <Type className="w-4 h-4 mr-1" /> Text
            </Button>
            <Button size="sm" variant="ghost">
              <Eraser className="w-4 h-4 mr-1" /> Eraser
            </Button>
          </div>

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

            {signatureBoxes.map((box) => {
              const signer = signers.find(
                (s) => s.publicKey === box.signerPublicKey
              );

              return (
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
                  <div
                    className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100"
                    style={{
                      background: `hsl(var(--${box.color}))`,
                      color: "#fff",
                    }}
                  >
                    {signer?.name}
                  </div>

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
              );
            })}
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="w-80">
          <div className="glass rounded-2xl p-6 sticky top-6">
            <h3 className="text-lg font-semibold mb-4">Signers</h3>

            {signers.map((signer) => (
              <div
                key={signer.id}
                className="p-4 rounded-xl border mb-3"
                style={{ borderColor: `hsl(var(--${signer.color}))` }}
              >
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">{signer.name}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex gap-1">
                  <Clock className="w-3 h-3" />
                  {signatureBoxes.find(
                    (b) => b.signerPublicKey === signer.publicKey
                  )?.signed
                    ? "Signed"
                    : "Pending"}
                </div>
              </div>
            ))}

            {mode === "issue" && (
              <Button
                variant="hero"
                size="lg"
                className="w-full mt-6"
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
    </div>
  );
};
