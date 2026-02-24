import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Fingerprint, ScanFace, Check, Loader2, X, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface BiometricSetupProps {
  onComplete: () => void;
  onSkip?: () => void;
  onCancel?: () => void;
}

/* ================= THEME ================= */
const getTheme = (role: string) => {
  if (role === "institution") {
    return {
      pageBg: "#f0faf4",
      blob1: "radial-gradient(circle, #bbf7d0 0%, transparent 70%)",
      blob2: "radial-gradient(circle, #d1fae5 0%, transparent 70%)",
      gradient: "linear-gradient(135deg, #16a34a, #059669)",
      btnShadow: "0 4px 14px rgba(22,163,74,0.28)",
      btnShadowHover: "0 8px 24px rgba(22,163,74,0.42)",
      accentColor: "#16a34a",
      cardBg: "white",
      cardBorder: "#bbf7d0",
      cardShadow: "0 8px 40px rgba(22,163,74,0.10)",
      iconBg1: "#f0fdf4",
      iconColor1: "#16a34a",
      iconBg2: "#ecfdf5",
      iconColor2: "#059669",
      optionBorder: "#bbf7d0",
      optionActiveBorder: "#16a34a",
      optionActiveBg: "#f0fdf4",
      checkBg: "#dcfce7",
      checkColor: "#16a34a",
      progressBg: "#dcfce7",
      progressFill: "linear-gradient(90deg, #16a34a, #059669)",
      cameraBorder: "#bbf7d0",
      skipBorder: "#bbf7d0",
      skipHoverBorder: "#16a34a",
      skipHoverColor: "#16a34a",
    };
  }
  // Student — Purple
  return {
    pageBg: "#f5f3ff",
    blob1: "radial-gradient(circle, #ddd6fe 0%, transparent 70%)",
    blob2: "radial-gradient(circle, #ede9fe 0%, transparent 70%)",
    gradient: "linear-gradient(135deg, #7c3aed, #6366f1)",
    btnShadow: "0 4px 14px rgba(124,58,237,0.28)",
    btnShadowHover: "0 8px 24px rgba(124,58,237,0.42)",
    accentColor: "#7c3aed",
    cardBg: "white",
    cardBorder: "#ddd6fe",
    cardShadow: "0 8px 40px rgba(124,58,237,0.10)",
    iconBg1: "#f5f3ff",
    iconColor1: "#7c3aed",
    iconBg2: "#eef2ff",
    iconColor2: "#6366f1",
    optionBorder: "#ddd6fe",
    optionActiveBorder: "#7c3aed",
    optionActiveBg: "#f5f3ff",
    checkBg: "#ede9fe",
    checkColor: "#7c3aed",
    progressBg: "#ede9fe",
    progressFill: "linear-gradient(90deg, #7c3aed, #6366f1)",
    cameraBorder: "#ddd6fe",
    skipBorder: "#e2e8f0",
    skipHoverBorder: "#7c3aed",
    skipHoverColor: "#7c3aed",
  };
};

export const BiometricSetup: React.FC<BiometricSetupProps> = ({
  onComplete, onSkip, onCancel,
}) => {
  const { setupBiometric, user } = useAuth();
  const t = getTheme(user?.role || "student");

  const [selectedType, setSelectedType] = useState<"fingerprint" | "face" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const [skipHovered, setSkipHovered] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /* ---------------- Cleanup camera ---------------- */
  useEffect(() => { return () => stopCamera(); }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  /* ---------------- Start camera ---------------- */
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (error: any) {
      if (error.name === "NotAllowedError") setCameraError("Camera permission denied.");
      else if (error.name === "NotFoundError") setCameraError("No camera found.");
      else setCameraError("Failed to access camera.");
    }
  };

  /* ---------------- Capture photo ---------------- */
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg");
  };

  /* ---------------- Cancel camera ---------------- */
  const handleCancelCamera = useCallback(() => {
    stopCamera();
    setShowCamera(false);
    setIsProcessing(false);
    setScanProgress(0);
    setSelectedType(null);
    setCameraError(null);
    if (onCancel) onCancel();
  }, [stopCamera, onCancel]);

  /* ---------------- MAIN SETUP FLOW ---------------- */
  const handleSetup = async (type: "fingerprint" | "face") => {
    setSelectedType(type);
    setIsProcessing(true);
    setScanProgress(0);
    console.log("🚀 BiometricSetup handleSetup called", { type, user });
    let photo: string | null = null;

    try {
      if (type === "face") {
        setShowCamera(true);
        await startCamera();
        for (let i = 0; i <= 80; i += 10) {
          await new Promise((r) => setTimeout(r, 300));
          setScanProgress(i);
        }
        photo = capturePhoto();
        if (!photo) throw new Error("Photo capture failed");
        setScanProgress(100);
        await new Promise((r) => setTimeout(r, 400));
        stopCamera();
        setShowCamera(false);
        console.log("📤 Sending face to server for setup...", { email: user?.email });
        const res = await fetch(`${import.meta.env.VITE_API_URL}/biometric/face`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user?.email, image: photo }),
        });
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); }
        catch { throw new Error("Server returned HTML instead of JSON"); }
        if (!data.success) throw new Error(data.message);
      }

      if (type === "fingerprint") {
        await setupBiometric("fingerprint");
      }

      toast.success(`${type === "face" ? "Face recognition" : "Fingerprint"} set up successfully!`);
      setIsProcessing(false);
      setScanProgress(0);
      onComplete();
    } catch (err: any) {
      console.error("❌ Biometric setup error:", err);
      toast.error(err.message || "Biometric setup failed");
      handleCancelCamera();
    }
  };

  /* ================= CAMERA UI ================= */
  if (showCamera) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
        <div style={{ background: t.cardBg, borderRadius: "24px", border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, padding: "32px", maxWidth: "500px", width: "100%", position: "relative" }}>

          {/* Close */}
          <button
            onClick={handleCancelCamera}
            style={{
              position: "absolute", top: "16px", right: "16px",
              width: "34px", height: "34px", borderRadius: "50%",
              border: "1px solid #e2e8f0", background: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "all 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "#fca5a5")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "#e2e8f0")}
          >
            <X size={15} color="#64748b" />
          </button>

          <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "20px", textAlign: "center" }}>
            Face Recognition Setup
          </h3>

          {/* Camera view */}
          <div style={{ aspectRatio: "4/3", background: "#f1f5f9", borderRadius: "16px", marginBottom: "24px", overflow: "hidden", position: "relative", border: `1px solid ${t.cameraBorder}` }}>
            {cameraError ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "24px", textAlign: "center" }}>
                <AlertCircle size={40} color="#ef4444" style={{ marginBottom: "12px" }} />
                <p style={{ fontSize: "13px", color: "#ef4444", marginBottom: "16px" }}>{cameraError}</p>
                <button
                  onClick={startCamera}
                  style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: t.gradient, color: "white", fontSize: "13px", fontWeight: 600, cursor: "pointer", boxShadow: t.btnShadow }}
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: "150px", height: "200px", border: `2.5px solid ${t.accentColor}`, borderRadius: "50%", opacity: 0.75, animation: "pulse 1.5s ease-in-out infinite" }} />
                </div>
              </>
            )}
          </div>

          <canvas ref={canvasRef} style={{ display: "none" }} />

          {!cameraError && (
            <div style={{ textAlign: "center" }}>
              <Loader2 size={28} color={t.accentColor} style={{ margin: "0 auto 10px", animation: "spin 1s linear infinite" }} />
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginBottom: "14px" }}>Scanning face...</p>
              <div style={{ width: "100%", height: "6px", background: t.progressBg, borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ height: "100%", background: t.progressFill, borderRadius: "999px", width: `${scanProgress}%`, transition: "width 0.3s ease" }} />
              </div>
              <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "6px" }}>{scanProgress}%</p>
            </div>
          )}
        </div>
        <style>{`
          @keyframes pulse { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.03)} }
          @keyframes spin { to{transform:rotate(360deg)} }
        `}</style>
      </div>
    );
  }

  /* ================= MAIN UI ================= */
  return (
    <div style={{ minHeight: "100vh", background: t.pageBg, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>

      {/* Background blobs */}
      <div style={{ position: "fixed", top: "-100px", right: "-100px", width: "500px", height: "500px", borderRadius: "50%", background: t.blob1, zIndex: 0, pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-80px", left: "-80px", width: "420px", height: "420px", borderRadius: "50%", background: t.blob2, zIndex: 0, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "420px" }}>
        <div style={{ background: t.cardBg, borderRadius: "24px", border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, padding: "40px 36px" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "18px", background: t.gradient, boxShadow: t.btnShadow, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
              <Fingerprint size={30} color="white" />
            </div>
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "22px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
              Secure Your Private Key
            </h2>
            <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.65 }}>
              Choose biometric protection for your account
            </p>
          </div>

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>

            {/* Fingerprint */}
            <button
              onClick={() => handleSetup("fingerprint")}
              disabled={isProcessing}
              onMouseEnter={() => setHoveredOption("fingerprint")}
              onMouseLeave={() => setHoveredOption(null)}
              style={{
                width: "100%", padding: "18px 20px", borderRadius: "14px",
                border: `1.5px solid ${hoveredOption === "fingerprint" || selectedType === "fingerprint" ? t.optionActiveBorder : t.optionBorder}`,
                background: hoveredOption === "fingerprint" || selectedType === "fingerprint" ? t.optionActiveBg : "white",
                display: "flex", alignItems: "center", gap: "16px",
                cursor: isProcessing ? "not-allowed" : "pointer",
                transition: "all 0.2s", opacity: isProcessing ? 0.6 : 1,
                boxShadow: hoveredOption === "fingerprint" ? t.btnShadow : "0 1px 4px rgba(0,0,0,0.04)",
                textAlign: "left",
              }}
            >
              <div style={{ width: "46px", height: "46px", borderRadius: "12px", background: t.iconBg1, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Fingerprint size={24} color={t.iconColor1} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", marginBottom: "2px" }}>Fingerprint</p>
                <p style={{ fontSize: "12px", color: "#94a3b8" }}>Use your fingerprint to authenticate</p>
              </div>
              {user?.biometricType === "fingerprint" && (
                <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: t.checkBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Check size={14} color={t.checkColor} />
                </div>
              )}
            </button>

            {/* Face Recognition */}
            <button
              onClick={() => handleSetup("face")}
              disabled={isProcessing}
              onMouseEnter={() => setHoveredOption("face")}
              onMouseLeave={() => setHoveredOption(null)}
              style={{
                width: "100%", padding: "18px 20px", borderRadius: "14px",
                border: `1.5px solid ${hoveredOption === "face" || selectedType === "face" ? t.optionActiveBorder : t.optionBorder}`,
                background: hoveredOption === "face" || selectedType === "face" ? t.optionActiveBg : "white",
                display: "flex", alignItems: "center", gap: "16px",
                cursor: isProcessing ? "not-allowed" : "pointer",
                transition: "all 0.2s", opacity: isProcessing ? 0.6 : 1,
                boxShadow: hoveredOption === "face" ? t.btnShadow : "0 1px 4px rgba(0,0,0,0.04)",
                textAlign: "left",
              }}
            >
              <div style={{ width: "46px", height: "46px", borderRadius: "12px", background: t.iconBg2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ScanFace size={24} color={t.iconColor2} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", marginBottom: "2px" }}>Face Recognition</p>
                <p style={{ fontSize: "12px", color: "#94a3b8" }}>Use your face to authenticate</p>
              </div>
              {user?.biometricType === "face" && (
                <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: t.checkBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Check size={14} color={t.checkColor} />
                </div>
              )}
            </button>
          </div>

          {/* Skip */}
          {onSkip && (
            <button
              onClick={onSkip}
              onMouseEnter={() => setSkipHovered(true)}
              onMouseLeave={() => setSkipHovered(false)}
              style={{
                width: "100%", padding: "11px", marginTop: "8px",
                borderRadius: "10px",
                border: `1px solid ${skipHovered ? t.skipHoverBorder : t.skipBorder}`,
                background: "white",
                color: skipHovered ? t.skipHoverColor : "#64748b",
                fontSize: "14px", fontWeight: 500,
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              Skip for now
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};