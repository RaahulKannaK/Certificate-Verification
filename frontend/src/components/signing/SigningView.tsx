import React, { useState, useEffect, useMemo, useRef } from "react";
import Button from "../ui/ThemeButton";
import { BiometricVerify } from "../biometric/BiometricVerify";
import {
  ArrowLeft, Shield, CheckCircle2, AlertCircle, Key, Clock, User,
  Type as TypeIcon, MousePointer, RotateCcw
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "../ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/* ================= TYPES ================= */
type SigningStep = "signature" | "verification" | "complete";

export interface CertificateData {
  credentialId: string;
  title: string;
  filePath?: string;
  purpose?: string;
  status: string;
  signingType: "self" | "sequential" | "parallel";
  studentPublicKey: string;
  institutionPublicKeys: string[];
  txHash?: string;
  issuedAt?: string;
  signatureFields?: any[];
  signers?: any[];
}

interface SigningViewProps {
  credentialId: string;
  onBack: () => void;
}

const fontOptions = [
  { name: "Elegant", font: "italic 32px Georgia, serif" },
  { name: "Classic", font: "32px 'Times New Roman', serif" },
  { name: "Modern", font: "300 28px Helvetica, sans-serif" },
  { name: "Script", font: "italic 36px 'Brush Script MT', cursive" },
];

/* ================= THEME ================= */
const getTheme = (role: string) => {
  return {
    gradient: "linear-gradient(135deg, #1e1a6b, #1e1a6b)",
    btnShadow: "none",
    btnShadowHover: "none",
    accentColor: "#1e1a6b",
    cardBorder: "#c4b5fd",
    cardBg: "#f5f3ff",
    selfSignBg: "#fef3c7",
    selfSignBorder: "#f59e0b",
    selfSignIcon: "#f59e0b",
    inputBorder: "#c4b5fd",
    inputFocusBorder: "#1e1a6b",
    clearBtnHover: "#f5f3ff",
    noticeBg: "#f5f3ff",
    noticeBorder: "#c4b5fd",
    noticeIcon: "#1e1a6b",
    outlineBorder: "#c4b5fd",
    outlineHover: "#1e1a6b",
  };
};

/* ================= MAIN COMPONENT ================= */
export const SigningView: React.FC<SigningViewProps> = ({ credentialId, onBack }) => {
  const { user } = useAuth();
  const t = getTheme(user?.role || "student");

  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [signature, setSignature] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<SigningStep>("signature");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSetupPrompt, setShowSetupPrompt] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /* FETCH CERTIFICATE */
  useEffect(() => {
    const fetchCertificate = async () => {
      if (!credentialId) return;
      setIsLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/issuedCredential/${credentialId}`);
        const data = await res.json();
        if (!data.success) {
          toast.error(data.message || "Certificate not found");
          return;
        }
        const certData = data.data;
        if (!certData.credentialId) certData.credentialId = credentialId;
        certData.institutionPublicKeys = Array.isArray(certData.institutionPublicKeys) ? certData.institutionPublicKeys : [];
        certData.signatureFields = Array.isArray(certData.signatureFields) ? certData.signatureFields : [];
        certData.signers = Array.isArray(certData.signers) ? certData.signers : [];
        setCertificate(certData);
      } catch (err) {
        toast.error("Failed to load certificate");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCertificate();
  }, [credentialId]);

  /* BIOMETRIC STATUS */
  useEffect(() => {
    const checkBiometricStatus = async () => {
      if (!user?.walletPublicKey) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/biometric/status/${user.walletPublicKey}`);
        const data = await res.json();
        setIsSetupComplete(!!data.enrolled);
      } catch {
        setIsSetupComplete(false);
      }
    };
    checkBiometricStatus();
  }, [user]);

  const isMyTurn = useMemo(() => {
    if (!certificate || !user?.walletPublicKey) return false;
    if (certificate.signingType === "self") return certificate.studentPublicKey === user.walletPublicKey;
    if (certificate.signingType === "parallel") {
      return certificate.institutionPublicKeys.includes(user.walletPublicKey) ||
        certificate.signers?.some(s => s.signerPublicKey === user.walletPublicKey);
    }
    const index = (certificate.signers?.findIndex(s => !s.signed) ?? 0);
    const currentSignerKey = certificate.signers?.[index]?.signerPublicKey;
    return user.walletPublicKey === currentSignerKey;
  }, [certificate, user]);

  const handleVerifyAndSign = () => {
    if (!isMyTurn) return toast.error("Not your signing turn");
    if (!signature) return toast.error("Please provide signature first");
    if (!isSetupComplete) { setShowSetupPrompt(true); return; }
    setCurrentStep("verification");
  };

  const handleVerificationComplete = async (faceImage: string) => {
    try {
      setIsSubmitting(true);
      const isSelfSign = certificate?.signingType === "self";
      const res = await fetch(`${import.meta.env.VITE_API_URL}/credential/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credentialId: certificate?.credentialId,
          signerPublicKey: user?.walletPublicKey,
          faceImage,
          signature,
          isSelfSign,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(isSelfSign ? "Self-signed successfully" : "Signed successfully");
      setCurrentStep("complete");
      setTimeout(onBack, 1800);
    } catch (err: any) {
      toast.error(err.message || "Signing failed");
      setCurrentStep("signature");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (currentStep === "verification" && certificate?.credentialId && user?.walletPublicKey) {
    return <BiometricVerify credentialId={certificate.credentialId} signerPublicKey={user.walletPublicKey} onComplete={handleVerificationComplete} onFailed={() => setCurrentStep("signature")} onCancel={() => setCurrentStep("signature")} />;
  }

  if (currentStep === "complete") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-300 flex items-center justify-center mb-5"><CheckCircle2 size={44} className="text-green-600" /></div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Signed Successfully</h2>
        <p className="text-slate-500">Returning to dashboard…</p>
      </div>
    );
  }

  if (isLoading || !certificate) {
    return <div className="flex flex-col items-center justify-center min-h-[60vh]"><Clock size={40} className="animate-spin text-slate-400 mb-4" /><h2>{isLoading ? "Loading..." : "Not Found"}</h2></div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 border rounded-xl hover:bg-slate-50 transition-colors"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{certificate.signingType === "self" ? "Self-Sign Certificate" : "Sign Certificate"}</h1>
          <p className="text-slate-500">Digital signature for {certificate.title}</p>
        </div>
      </div>

      <InnerPreview certificate={certificate} myPublicKey={user?.walletPublicKey} onSignatureChange={setSignature} />

      <div className="flex gap-4 pt-6">
        <Button onClick={onBack} className="flex-1 bg-slate-100 text-slate-900 hover:bg-slate-200 border-none">Cancel</Button>
        <Button onClick={handleVerifyAndSign} disabled={!signature || isSubmitting || !isMyTurn} className="flex-1 border-none">{isSubmitting ? "Signing..." : "Verify & Sign"}</Button>
      </div>

      <Dialog open={showSetupPrompt} onOpenChange={setShowSetupPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Biometric Setup Required</DialogTitle>
            <DialogDescription>Please complete your biometric enrollment before signing documents.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 pt-4">
            <Button onClick={onBack} className="flex-1">Go to Setup</Button>
            <Button onClick={() => setShowSetupPrompt(false)} variant="secondary" className="flex-1">Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ================= INNER PREVIEW ================= */
const InnerPreview: React.FC<{ certificate: any, myPublicKey?: string, onSignatureChange: (sig: any) => void }> = ({ certificate, myPublicKey, onSignatureChange }) => {
  const { user } = useAuth();
  const t = getTheme(user?.role || "student");
  const [pdfCanvasRef, setPdfCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [signCanvasRef, setSignCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [pdfSize, setPdfSize] = useState({ width: 720, height: 0 });
  const [activeTab, setActiveTab] = useState<"type" | "draw">("type");
  const [typedName, setTypedName] = useState("");
  const [selectedFont, setSelectedFont] = useState(0);
  const [sigImg, setSigImg] = useState<string | null>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!certificate.filePath || !pdfCanvasRef) return;
    const render = async () => {
      const pdf = await pdfjsLib.getDocument(certificate.filePath).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 720 / page.getViewport({ scale: 1 }).width });
      pdfCanvasRef.width = viewport.width;
      pdfCanvasRef.height = viewport.height;
      setPdfSize({ width: viewport.width, height: viewport.height });
      await page.render({ canvasContext: pdfCanvasRef.getContext("2d")!, viewport, canvas: pdfCanvasRef }).promise;
    };
    render();
  }, [certificate.filePath, pdfCanvasRef]);

  const myBox = useMemo(() => {
    if (!myPublicKey || !certificate.signatureFields) return null;
    return certificate.signatureFields.find((f: any) => !f.signed && (f.signerPublicKey?.toLowerCase() === myPublicKey.toLowerCase() || (f.isStudent && certificate.studentPublicKey?.toLowerCase() === myPublicKey.toLowerCase())));
  }, [myPublicKey, certificate]);

  useEffect(() => {
    if (!myBox || activeTab !== "type" || !typedName.trim()) return;
    const canvas = document.createElement("canvas");
    canvas.width = myBox.wRatio * pdfSize.width || 200;
    canvas.height = myBox.hRatio * pdfSize.height || 64;
    const ctx = canvas.getContext("2d")!;
    ctx.font = fontOptions[selectedFont].font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);
    const img = canvas.toDataURL();
    setSigImg(img);
    onSignatureChange({ image: img, x: myBox.xRatio * pdfSize.width, y: myBox.yRatio * pdfSize.height, width: canvas.width, height: canvas.height });
  }, [typedName, selectedFont, activeTab, myBox, pdfSize]);

  const startDraw = (e: any) => {
    const rect = signCanvasRef!.getBoundingClientRect();
    isDrawing.current = true;
    lastPos.current = { x: (e.clientX - rect.left) * (signCanvasRef!.width / rect.width), y: (e.clientY - rect.top) * (signCanvasRef!.height / rect.height) };
  };

  const draw = (e: any) => {
    if (!isDrawing.current) return;
    const ctx = signCanvasRef!.getContext("2d")!;
    const rect = signCanvasRef!.getBoundingClientRect();
    const pos = { x: (e.clientX - rect.left) * (signCanvasRef!.width / rect.width), y: (e.clientY - rect.top) * (signCanvasRef!.height / rect.height) };
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y); ctx.stroke();
    lastPos.current = pos;
  };

  const stopDraw = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const img = signCanvasRef!.toDataURL();
    setSigImg(img);
    onSignatureChange({ image: img, x: myBox.xRatio * pdfSize.width, y: myBox.yRatio * pdfSize.height, width: myBox.wRatio * pdfSize.width, height: myBox.hRatio * pdfSize.height });
  };

  return (
    <div className="space-y-6">
      <div className="border rounded-2xl overflow-hidden bg-slate-50 relative p-4">
        <div className="relative mx-auto bg-white shadow-xl" style={{ width: pdfSize.width, height: pdfSize.height }}>
          <canvas ref={setPdfCanvasRef} />
          {sigImg && myBox && <img src={sigImg} className="absolute pointer-events-none" style={{ left: myBox.xRatio * pdfSize.width, top: myBox.yRatio * pdfSize.height, width: myBox.wRatio * pdfSize.width, height: myBox.hRatio * pdfSize.height }} />}
        </div>
      </div>

      {myBox && (
        <div className="bg-white border rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center"><h3 className="font-bold">Signature</h3><button onClick={() => { setTypedName(""); setSigImg(null); onSignatureChange(null); }} className="text-sm text-slate-500 hover:text-red-500 flex items-center gap-1"><RotateCcw size={14} /> Clear</button></div>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab("type")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'type' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Type</button>
            <button onClick={() => setActiveTab("draw")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'draw' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Draw</button>
          </div>
          {activeTab === "type" ? (
            <div className="space-y-3">
              <input value={typedName} onChange={(e) => setTypedName(e.target.value)} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Your name" />
              <div className="flex gap-2">{fontOptions.map((f, i) => <button key={i} onClick={() => setSelectedFont(i)} className={`px-3 py-1 rounded-md text-xs border ${selectedFont === i ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-200'}`}>{f.name}</button>)}</div>
            </div>
          ) : (
            <canvas ref={setSignCanvasRef} width={800} height={200} className="w-full h-40 border-2 border-dashed rounded-xl cursor-crosshair bg-slate-50" onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw} />
          )}
        </div>
      )}
    </div>
  );
};
