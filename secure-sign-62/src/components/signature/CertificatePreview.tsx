import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Type, MousePointer, RotateCcw } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";
import { BiometricVerify } from "../dashboard/BiometricVerify";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/* ================= TYPES ================= */

interface SignatureField {
  id?: number;
  signerPublicKey: string;
  xRatio: number;
  yRatio: number;
  wRatio: number;
  hRatio: number;
  color: string;
  signed?: boolean;
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

export const CertificatePreview = ({
  certificate,
  myPublicKey,
  onSignatureChange,
}: CertificatePreviewProps) => {
  const [pdfCanvasRef, setPdfCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [signCanvasRef, setSignCanvasRef] = useState<HTMLCanvasElement | null>(null);

  const [pdfSize, setPdfSize] = useState({ width: DOC_WIDTH, height: 0 });
  const [activeTab, setActiveTab] = useState<"type" | "draw">("type");
  const [typedName, setTypedName] = useState("");
  const [selectedFont, setSelectedFont] = useState(0);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  const [isVerified, setIsVerified] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);

  /* ================= FIXED DOCUMENT URL ================= */

  const documentUrl =
    certificate.documentUrl ||
    (certificate.filePath
      ? `${import.meta.env.VITE_API_URL.replace(/\/$/, "")}/${certificate.filePath.replace(/^\//, "")}`
      : undefined);

  /* ================= LOAD PDF ================= */

  useEffect(() => {
    if (!documentUrl || !pdfCanvasRef) return;

    const renderPdf = async () => {
      const pdf = await pdfjsLib.getDocument(documentUrl).promise;
      const page = await pdf.getPage(1);

      const baseViewport = page.getViewport({ scale: 1 });
      const scale = DOC_WIDTH / baseViewport.width;
      const viewport = page.getViewport({ scale });

      const ctx = pdfCanvasRef.getContext("2d");
      if (!ctx) return;

      pdfCanvasRef.width = viewport.width;
      pdfCanvasRef.height = viewport.height;

      setPdfSize({
        width: viewport.width || DOC_WIDTH,
        height: viewport.height || 0,
      });

      ctx.clearRect(0, 0, viewport.width, viewport.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
    };

    renderPdf().catch(console.error);
  }, [documentUrl, pdfCanvasRef]);

  /* ================= SIGNATURE BOX ================= */

  const myBox = useMemo(() => {
    if (!myPublicKey || !certificate.signatureFields) return null;

    return certificate.signatureFields.find(
      (b: SignatureField) =>
        b.signerPublicKey === myPublicKey && !b.signed
    );
  }, [myPublicKey, certificate.signatureFields]);

  const signatureBox = useMemo(() => {
    if (!myBox) return null;

    const safeWidth = pdfSize.width || DOC_WIDTH;
    const safeHeight = pdfSize.height || 0;

    return {
      x: (myBox.xRatio || 0) * safeWidth,
      y: (myBox.yRatio || 0) * safeHeight,
      width: (myBox.wRatio || 0) * safeWidth || 200,
      height: (myBox.hRatio || 0) * safeHeight || 64,
      color: myBox.color,
    };
  }, [myBox, pdfSize]);

  /* ================= CLEAR ================= */

  const clearSignature = () => {
    if (signCanvasRef) {
      const ctx = signCanvasRef.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, signCanvasRef.width, signCanvasRef.height);
    }

    setTypedName("");
    setSignatureImage(null);
    setIsVerified(false);
    onSignatureChange(null);
  };

  /* ================= TYPED SIGNATURE ================= */

  useEffect(() => {
    if (activeTab !== "type" || !signatureBox) return;

    setSignatureImage(null);
    setIsVerified(false);
    onSignatureChange(null);

    if (!typedName.trim()) return;

    const canvas = document.createElement("canvas");
    canvas.width = signatureBox.width;
    canvas.height = signatureBox.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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
    if (!signatureBox || !signCanvasRef) return;

    const ctx = signCanvasRef.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, signCanvasRef.width, signCanvasRef.height);

    setSignatureImage(null);
    setIsVerified(false);
    setIsDrawing(true);
    setLastPos(getCoords(e));
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !signCanvasRef) return;

    const ctx = signCanvasRef.getContext("2d");
    if (!ctx) return;

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
    if (!isDrawing || !signCanvasRef) return;

    setIsDrawing(false);

    const image = signCanvasRef.toDataURL("image/png");
    setSignatureImage(image);
    onSignatureChange({ image, ...signatureBox });
  };

  /* ================= RENDER ================= */

  const safePdfWidth = pdfSize.width || DOC_WIDTH;
  const safePdfHeight = pdfSize.height || 0;

  return (
    <div className="space-y-6">

      {showBiometric && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-[420px] max-w-full">
            <BiometricVerify
              credentialId={certificate.credentialId}
              onComplete={() => {
                setIsVerified(true);
                setShowBiometric(false);
              }}
              onCancel={() => setShowBiometric(false)}
            />
          </div>
        </div>
      )}

      {/* PDF */}
      <div className="border rounded-xl bg-muted/20 overflow-auto relative">
        <div
          className="relative mx-auto bg-white shadow"
          style={{ width: safePdfWidth, height: safePdfHeight }}
        >
          <canvas ref={setPdfCanvasRef} />

          {certificate.signatureFields
            ?.filter(Boolean)
            .map((field: SignatureField, index: number) => {
              const isMine =
                field.signerPublicKey === myPublicKey && !field.signed;

              return (
                <div
                  key={`field-${field.id ?? `${field.xRatio}-${field.yRatio}` ?? index}`}
                  className="absolute rounded-lg"
                  style={{
                    left: (field.xRatio || 0) * safePdfWidth,
                    top: (field.yRatio || 0) * safePdfHeight,
                    width: (field.wRatio || 0) * safePdfWidth,
                    height: (field.hRatio || 0) * safePdfHeight,
                    border: `2px dashed hsl(var(--${field.color}))`,
                    zIndex: isMine ? 10 : 1,
                  }}
                />
              );
            })}

          {signatureImage && signatureBox && (
            <img
              src={signatureImage}
              alt="signature"
              className="absolute"
              style={{
                left: signatureBox.x,
                top: signatureBox.y,
                width: signatureBox.width,
                height: signatureBox.height,
                zIndex: 11,
              }}
            />
          )}
        </div>
      </div>

      {/* Tools */}
      {signatureBox && (
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Add Signature</h3>
            <Button variant="ghost" onClick={clearSignature}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant={activeTab === "type" ? "default" : "outline"}
              onClick={() => setActiveTab("type")}
            >
              <Type className="w-4 h-4 mr-2" /> Type
            </Button>
            <Button
              variant={activeTab === "draw" ? "default" : "outline"}
              onClick={() => setActiveTab("draw")}
            >
              <MousePointer className="w-4 h-4 mr-2" /> Draw
            </Button>
          </div>

          {activeTab === "type" && (
            <input
              className="w-full p-3 border rounded-lg"
              placeholder="Type your institution name"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
            />
          )}

          {activeTab === "draw" && signatureBox && (
            <canvas
              ref={setSignCanvasRef}
              width={signatureBox.width}
              height={signatureBox.height}
              className="border rounded-lg cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          )}

          {signatureImage && !isVerified && (
            <Button
              className="w-full mt-4"
              onClick={() => setShowBiometric(true)}
            >
              Verify & Confirm Signature
            </Button>
          )}

          {isVerified && (
            <div className="text-center text-green-600 font-semibold mt-2">
              ✔ Signature Verified
            </div>
          )}
        </div>
      )}
    </div>
  );
};