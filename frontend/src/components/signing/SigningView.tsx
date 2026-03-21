import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom"; // Only addition
import Button from "../ui/ThemeButton";
import { BiometricVerify } from "../biometric/BiometricVerify";
import {
  ArrowLeft, Shield, CheckCircle2, AlertCircle, Key, Clock, User,
  Type as TypeIcon, MousePointer, RotateCcw, PenTool
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

/* ================= STAGE ROADMAP COMPONENT - ONLY ADDITION ================= */
const SigningStageRoadmap: React.FC<{
  currentStage: "ecdsa" | "face" | "complete";
}> = ({ currentStage }) => {
  const stages = [
    { id: "ecdsa", label: "Wallet Signature", icon: Key },
    { id: "face", label: "Biometric Verify", icon: User },
    { id: "complete", label: "Complete", icon: CheckCircle2 }
  ];

  const getStageStatus = (stageId: string) => {
    const stageOrder = ["ecdsa", "face", "complete"];
    const currentIndex = stageOrder.indexOf(currentStage);
    const stageIndex = stageOrder.indexOf(stageId);
    
    if (stageIndex < currentIndex) return "complete";
    if (stageIndex === currentIndex) return "active";
    return "pending";
  };

  return (
    <div className="bg-white border rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between relative">
        {/* Line */}
        <div className="absolute top-5 left-10 right-10 h-0.5 bg-slate-200" />
        <div 
          className="absolute top-5 left-10 h-0.5 bg-indigo-600 transition-all duration-500" 
          style={{ width: currentStage === "ecdsa" ? "0%" : currentStage === "face" ? "50%" : "100%" }}
        />

        {stages.map((stage) => {
          const status = getStageStatus(stage.id);
          const Icon = stage.icon;
          
          return (
            <div key={stage.id} className="flex flex-col items-center gap-2 z-10 flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                status === "complete" ? "bg-green-500 border-green-500" : 
                status === "active" ? "bg-indigo-600 border-indigo-600 ring-4 ring-indigo-100" : 
                "bg-white border-slate-300"
              }`}>
                {status === "complete" ? (
                  <CheckCircle2 size={20} className="text-white" />
                ) : (
                  <Icon size={20} className={status === "active" ? "text-white" : "text-slate-400"} />
                )}
              </div>
              <span className={`text-xs font-semibold ${
                status === "active" ? "text-indigo-600" : 
                status === "complete" ? "text-green-600" : "text-slate-400"
              }`}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */
export const SigningView: React.FC<SigningViewProps> = ({ credentialId, onBack }) => {
  const { user } = useAuth();
  const location = useLocation(); // Only addition
  const t = getTheme(user?.role || "student");

  // Get ECDSA token from navigation state
  const ecdsaToken = location.state?.ecdsaToken;

  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [signatureData, setSignatureData] = useState<{image: string, x: number, y: number, width: number, height: number} | null>(null);
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
      if (!user?.email) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/biometric/status/${user.email}`);
        const data = await res.json();
        setIsSetupComplete(data.biometricSetup);
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
        certificate.signers?.some(s => s.signerPublicKey === user.walletPublicKey && !s.signed);
    }
    const unsignedSigners = certificate.signers?.filter(s => !s.signed) || [];
    if (unsignedSigners.length === 0) return false;
    const currentSigner = unsignedSigners[0];
    return currentSigner.signerPublicKey === user.walletPublicKey;
  }, [certificate, user]);

  const handleVerifyAndSign = () => {
    if (!isMyTurn) return toast.error("Not your signing turn");
    if (!signatureData) return toast.error("Please provide signature first");
    if (!isSetupComplete) { setShowSetupPrompt(true); return; }
    if (!ecdsaToken) {
      toast.error("Session expired. Please restart signing process.");
      return;
    }
    setCurrentStep("verification");
  };

  const handleVerificationComplete = async (faceImage: string) => {
    try {
      setIsSubmitting(true);
      const isSelfSign = certificate?.signingType === "self";
      
      // STAGE 2: Send face verification with ECDSA token
      const res = await fetch(`${import.meta.env.VITE_API_URL}/credential/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credentialId: certificate?.credentialId,
          signerPublicKey: user?.walletPublicKey,
          stage: "face",
          ecdsaToken: ecdsaToken,
          faceData: faceImage,
          signatureImage: signatureData?.image,
          isSelfSign,
        }),
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      
      toast.success(data.allComplete ? "All signed! Final document created." : (isSelfSign ? "Self-signed successfully" : "Signed successfully"));
      setCurrentStep("complete");
      setTimeout(onBack, 2000);
    } catch (err: any) {
      toast.error(err.message || "Signing failed");
      setCurrentStep("signature");
    } finally {
      setIsSubmitting(false);
    }
  };

  // STAGE 2: Face Verification Screen
  if (currentStep === "verification" && certificate?.credentialId && user?.walletPublicKey) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Stage Roadmap - Only addition */}
        <SigningStageRoadmap currentStage="face" />
        
        <BiometricVerify 
          credentialId={certificate.credentialId} 
          signerPublicKey={user.walletPublicKey} 
          onComplete={handleVerificationComplete} 
          onFailed={() => setCurrentStep("signature")} 
          onCancel={() => setCurrentStep("signature")} 
        />
      </div>
    );
  }

  if (currentStep === "complete") {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Stage Roadmap - Only addition */}
        <SigningStageRoadmap currentStage="complete" />
        
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <div className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-300 flex items-center justify-center mb-5">
            <CheckCircle2 size={44} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Signed Successfully</h2>
          <p className="text-slate-500">Returning to dashboard…</p>
        </div>
      </div>
    );
  }

  if (isLoading || !certificate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Clock size={40} className="animate-spin text-slate-400 mb-4" />
        <h2>{isLoading ? "Loading..." : "Not Found"}</h2>
      </div>
    );
  }

  // STAGE 1 COMPLETE - Signature Input Screen
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
      {/* Stage Roadmap - Only addition */}
      <SigningStageRoadmap currentStage="ecdsa" />

      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 border rounded-xl hover:bg-slate-50 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {certificate.signingType === "self" ? "Self-Sign Certificate" : "Sign Certificate"}
          </h1>
          <p className="text-slate-500">Digital signature for {certificate.title}</p>
        </div>
      </div>

      {/* Success message for Stage 1 */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
        <CheckCircle2 size={24} className="text-green-600" />
        <div>
          <p className="font-semibold text-green-800">Wallet Verified</p>
          <p className="text-sm text-green-600">ECDSA signature validated. Complete signature below.</p>
        </div>
      </div>

      <InnerPreview 
        certificate={certificate} 
        myPublicKey={user?.walletPublicKey} 
        onSignatureChange={setSignatureData} 
      />

      <div className="flex gap-4 pt-6">
        <Button onClick={onBack} className="flex-1 bg-slate-100 text-slate-900 hover:bg-slate-200 border-none">
          Cancel
        </Button>
        <Button 
          onClick={handleVerifyAndSign} 
          disabled={!signatureData || isSubmitting || !isMyTurn || !ecdsaToken} 
          className="flex-1 border-none"
        >
          {isSubmitting ? "Signing..." : (isMyTurn ? "Verify & Sign" : "Waiting for others")}
        </Button>
      </div>

      {!ecdsaToken && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          <AlertCircle size={16} className="inline mr-2" />
          Session expired. Please restart signing from the documents list.
        </div>
      )}

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

/* ================= INNER PREVIEW - UNCHANGED ================= */
const InnerPreview: React.FC<{ 
  certificate: any, 
  myPublicKey?: string, 
  onSignatureChange: (sig: {image: string, x: number, y: number, width: number, height: number} | null) => void 
}> = ({ certificate, myPublicKey, onSignatureChange }) => {
  const { user } = useAuth();
  const [pdfCanvasRef, setPdfCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [signCanvasRef, setSignCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [pdfSize, setPdfSize] = useState({ width: 720, height: 0 });
  const [activeTab, setActiveTab] = useState<"type" | "draw">("type");
  const [typedName, setTypedName] = useState("");
  const [selectedFont, setSelectedFont] = useState(0);
  const [sigPreview, setSigPreview] = useState<string | null>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Render PDF
  useEffect(() => {
    if (!certificate.filePath || !pdfCanvasRef) return;
    const render = async () => {
      try {
        const pdf = await pdfjsLib.getDocument(certificate.filePath).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 720 / page.getViewport({ scale: 1 }).width });
        pdfCanvasRef.width = viewport.width;
        pdfCanvasRef.height = viewport.height;
        setPdfSize({ width: viewport.width, height: viewport.height });
        await page.render({ canvasContext: pdfCanvasRef.getContext("2d")!, viewport }).promise;
      } catch (err) {
        console.error("PDF render error:", err);
      }
    };
    render();
  }, [certificate.filePath, pdfCanvasRef]);

  // Find my signature box
  const myBox = useMemo(() => {
    if (!myPublicKey || !certificate.signatureFields?.length) return null;
    return certificate.signatureFields.find((f: any) => 
      f.signerPublicKey?.toLowerCase() === myPublicKey.toLowerCase() ||
      (f.isStudent && certificate.studentPublicKey?.toLowerCase() === myPublicKey.toLowerCase())
    );
  }, [myPublicKey, certificate]);

  // Generate typed signature
  useEffect(() => {
    if (!myBox || activeTab !== "type" || !typedName.trim()) {
      setSigPreview(null);
      onSignatureChange(null);
      return;
    }
    
    const canvas = document.createElement("canvas");
    const width = Math.max(200, myBox.wRatio * pdfSize.width || 200);
    const height = Math.max(64, myBox.hRatio * pdfSize.height || 64);
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillRect(0, 0, width, height);
    ctx.font = fontOptions[selectedFont].font;
    ctx.fillStyle = "#1e1a6b";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(typedName, width / 2, height / 2);
    
    const img = canvas.toDataURL("image/png");
    setSigPreview(img);
    onSignatureChange({
      image: img,
      x: myBox.xRatio * pdfSize.width,
      y: myBox.yRatio * pdfSize.height,
      width: width,
      height: height
    });
  }, [typedName, selectedFont, activeTab, myBox, pdfSize]);

  // Drawing handlers
  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!signCanvasRef) return;
    const rect = signCanvasRef.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    isDrawing.current = true;
    lastPos.current = {
      x: (clientX - rect.left) * (signCanvasRef.width / rect.width),
      y: (clientY - rect.top) * (signCanvasRef.height / rect.height)
    };
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || !signCanvasRef) return;
    const ctx = signCanvasRef.getContext("2d")!;
    const rect = signCanvasRef.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const pos = {
      x: (clientX - rect.left) * (signCanvasRef.width / rect.width),
      y: (clientY - rect.top) * (signCanvasRef.height / rect.height)
    };
    
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1e1a6b";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
    
    lastPos.current = pos;
  };

  const stopDraw = () => {
    if (!isDrawing.current || !signCanvasRef || !myBox) return;
    isDrawing.current = false;
    const img = signCanvasRef.toDataURL("image/png");
    setSigPreview(img);
    onSignatureChange({
      image: img,
      x: myBox.xRatio * pdfSize.width,
      y: myBox.yRatio * pdfSize.height,
      width: myBox.wRatio * pdfSize.width,
      height: myBox.hRatio * pdfSize.height
    });
  };

  const clearSignature = () => {
    setTypedName("");
    setSigPreview(null);
    onSignatureChange(null);
    if (signCanvasRef) {
      const ctx = signCanvasRef.getContext("2d");
      ctx?.clearRect(0, 0, signCanvasRef.width, signCanvasRef.height);
    }
  };

  if (!myBox) {
    return (
      <div className="p-8 text-center bg-amber-50 border border-amber-200 rounded-2xl">
        <AlertCircle className="mx-auto mb-3 text-amber-500" size={40} />
        <p className="text-amber-700">No signature field assigned to you on this document.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* PDF Preview with signature overlay */}
      <div className="border rounded-2xl overflow-hidden bg-slate-50 relative p-4">
        <div className="relative mx-auto bg-white shadow-xl" style={{ width: pdfSize.width, height: pdfSize.height }}>
          <canvas ref={setPdfCanvasRef} className="absolute top-0 left-0" />
          {sigPreview && (
            <img 
              src={sigPreview} 
              className="absolute pointer-events-none border border-dashed border-indigo-300"
              style={{ 
                left: myBox.xRatio * pdfSize.width, 
                top: myBox.yRatio * pdfSize.height, 
                width: myBox.wRatio * pdfSize.width, 
                height: myBox.hRatio * pdfSize.height 
              }} 
            />
          )}
          {!sigPreview && (
            <div 
              className="absolute border-2 border-dashed border-indigo-300 bg-indigo-50/30 flex items-center justify-center"
              style={{ 
                left: myBox.xRatio * pdfSize.width, 
                top: myBox.yRatio * pdfSize.height, 
                width: myBox.wRatio * pdfSize.width, 
                height: myBox.hRatio * pdfSize.height 
              }}
            >
              <span className="text-indigo-400 text-sm font-medium">Your signature here</span>
            </div>
          )}
        </div>
      </div>

      {/* Signature Input */}
      <div className="bg-white border rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2">
            <PenTool size={18} className="text-indigo-600" />
            Create Signature
          </h3>
          <button 
            onClick={clearSignature} 
            className="text-sm text-slate-500 hover:text-red-500 flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
          >
            <RotateCcw size={14} /> Clear
          </button>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => { setActiveTab("type"); clearSignature(); }}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'type' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <TypeIcon size={16} /> Type
          </button>
          <button 
            onClick={() => { setActiveTab("draw"); clearSignature(); }}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'draw' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <MousePointer size={16} /> Draw
          </button>
        </div>

        {activeTab === "type" ? (
          <div className="space-y-3">
            <input 
              value={typedName} 
              onChange={(e) => setTypedName(e.target.value)} 
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-lg"
              placeholder="Type your full name"
              maxLength={30}
            />
            <div className="flex gap-2 flex-wrap">
              {fontOptions.map((f, i) => (
                <button 
                  key={i} 
                  onClick={() => setSelectedFont(i)} 
                  className={`px-3 py-2 rounded-md text-sm border transition-all ${selectedFont === i ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  {f.name}
                </button>
              ))}
            </div>
            {typedName && (
              <div className="p-4 bg-slate-50 rounded-xl border text-center" style={{ font: fontOptions[selectedFont].font }}>
                {typedName}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <canvas 
              ref={setSignCanvasRef} 
              width={800} 
              height={200} 
              className="w-full h-48 border-2 border-dashed rounded-xl cursor-crosshair bg-slate-50 touch-none"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
            <p className="text-xs text-slate-400 text-center">Draw your signature in the box above</p>
          </div>
        )}
      </div>
    </div>
  );
};