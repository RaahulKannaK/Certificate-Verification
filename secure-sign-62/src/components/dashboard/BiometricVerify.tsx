import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ScanFace, Loader2, X, AlertCircle, Check } from "lucide-react";
import { toast } from "sonner";

function getTheme(role?: string) {
  const isInstitution = role === "institution";

  return isInstitution
    ? {
        /* ——— Institution — Jungle Green ——— */
        cardBg: "#ffffff",
        cardBorder: "1.5px solid #bbf7d0",
        cardShadow:
          "0 8px 32px rgba(5,150,105,0.10), 0 2px 8px rgba(22,163,74,0.07)",

        overlayBg: "rgba(240, 250, 244, 0.97)",

        closeBg: "#f0faf4",
        closeBorder: "1px solid #bbf7d0",
        closeColor: "#16a34a",
        closeHover: "#dcfce7",

        viewportBg: "#f0faf4",
        viewportBorder: "1.5px solid #bbf7d0",

        ovalBorder: "2.5px solid rgba(22, 163, 74, 0.65)",
        ovalShadow:
          "0 0 0 4px rgba(22,163,74,0.10), 0 0 24px rgba(5,150,105,0.18)",

        retryGradient: "linear-gradient(135deg, #16a34a, #059669)",

        loaderColor: "#16a34a",
        verifyingText: "#14532d",
        progressTrack: "#dcfce7",
        progressFill: "linear-gradient(90deg, #16a34a, #059669)",
        progressPct: "#15803d",

        iconBg: "linear-gradient(135deg, #f0faf4 0%, #dcfce7 100%)",
        iconBorder: "1.5px solid #86efac",
        iconShadow: "0 4px 16px rgba(22,163,74,0.13)",
        iconColor: "#16a34a",

        headingColor: "#052e16",
        subtitleColor: "#15803d",

        btnGradient: "linear-gradient(135deg, #16a34a 0%, #059669 100%)",
        btnGradientActive: "#059669",
        btnShadow: "0 4px 14px rgba(22,163,74,0.35)",
        btnShadowHover: "0 6px 20px rgba(22,163,74,0.45)",

        badgeColor: "#059669",
        badgeDot: "#059669",

        /* verified — always green ✓ */
        verifiedBg: "#f0faf4",
        verifiedBorder: "1.5px solid #bbf7d0",
        verifiedShadow: "0 4px 16px rgba(5,150,105,0.13)",
        verifiedCheck: "#059669",
        verifiedTitle: "#052e16",
        verifiedSub: "#059669",
      }
    : {
        /* ——— Student — Purple ——— */
        cardBg: "#ffffff",
        cardBorder: "1.5px solid #ede9fe",
        cardShadow:
          "0 8px 32px rgba(124,58,237,0.10), 0 2px 8px rgba(99,102,241,0.07)",

        overlayBg: "rgba(245, 243, 255, 0.97)",

        closeBg: "#f5f3ff",
        closeBorder: "1px solid #ede9fe",
        closeColor: "#7c3aed",
        closeHover: "#ede9fe",

        viewportBg: "#f5f3ff",
        viewportBorder: "1.5px solid #ede9fe",

        ovalBorder: "2.5px solid rgba(124, 58, 237, 0.65)",
        ovalShadow:
          "0 0 0 4px rgba(124,58,237,0.10), 0 0 24px rgba(99,102,241,0.18)",

        retryGradient: "linear-gradient(135deg, #7c3aed, #6366f1)",

        loaderColor: "#7c3aed",
        verifyingText: "#4c1d95",
        progressTrack: "#ede9fe",
        progressFill: "linear-gradient(90deg, #7c3aed, #6366f1)",
        progressPct: "#6d28d9",

        iconBg: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
        iconBorder: "1.5px solid #ddd6fe",
        iconShadow: "0 4px 16px rgba(124,58,237,0.13)",
        iconColor: "#7c3aed",

        headingColor: "#1e1b4b",
        subtitleColor: "#6d28d9",

        btnGradient: "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)",
        btnGradientActive: "#6366f1",
        btnShadow: "0 4px 14px rgba(124,58,237,0.35)",
        btnShadowHover: "0 6px 20px rgba(124,58,237,0.45)",

        badgeColor: "#7c3aed",
        badgeDot: "#7c3aed",

        /* verified — always green ✓ */
        verifiedBg: "#f0faf4",
        verifiedBorder: "1.5px solid #bbf7d0",
        verifiedShadow: "0 4px 16px rgba(5,150,105,0.13)",
        verifiedCheck: "#059669",
        verifiedTitle: "#065f46",
        verifiedSub: "#059669",
      };
}

/* ================================================================ */

interface BiometricVerifyProps {
  credentialId: string;
  signerPublicKey?: string; // Optional - will use user.walletPublicKey if not provided
  isSelfSign?: boolean; // NEW: Flag to indicate self-signing mode
  onComplete: (faceImage?: string) => void;
  onFailed?: () => void; // NEW: Callback for failed verification
  onCancel?: () => void;
}

export const BiometricVerify: React.FC<BiometricVerifyProps> = ({
  credentialId,
  signerPublicKey: propSignerPublicKey,
  isSelfSign = false, // Default to false
  onComplete,
  onFailed,
  onCancel,
}) => {
  const { user } = useAuth();

  /* 🎨 Theme derived from user role — UI only, no logic change */
  const theme = getTheme(user?.role);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Use provided signerPublicKey or fallback to user's walletPublicKey
  const signerPublicKey = propSignerPublicKey || user?.walletPublicKey;

  /* ---------------- Cleanup ---------------- */
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  /* ---------------- Start Camera ---------------- */
  const startCamera = async () => {
    try {
      setCameraError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      if (err.name === "NotAllowedError") setCameraError("Camera permission denied.");
      else if (err.name === "NotFoundError") setCameraError("No camera found.");
      else setCameraError("Failed to access camera.");
    }
  };

  /* ---------------- Capture Photo ---------------- */
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

  /* ---------------- Cancel Camera ---------------- */
  const handleCancel = () => {
    stopCamera();
    setShowCamera(false);
    setIsProcessing(false);
    setScanProgress(0);
    setCameraError(null);
    if (onCancel) onCancel();
  };

  /* ---------------- VERIFY FACE ---------------- */
  const handleVerify = async () => {
    if (!credentialId) {
      toast.error("Missing credential ID");
      return;
    }

    if (!signerPublicKey) {
      toast.error("Missing wallet public key");
      return;
    }

    setIsProcessing(true);
    setShowCamera(true);

    try {
      await startCamera();

      // fake scan animation
      for (let i = 0; i <= 80; i += 10) {
        await new Promise((r) => setTimeout(r, 250));
        setScanProgress(i);
      }

      const photo = capturePhoto();
      if (!photo) throw new Error("Photo capture failed");

      setScanProgress(100);
      await new Promise((r) => setTimeout(r, 300));

      stopCamera();
      setShowCamera(false);

      // NEW: Call verify-face with isSelfSign flag
      const res = await fetch(`${import.meta.env.VITE_API_URL}/biometric/verify-face`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credentialId: credentialId,
          signerPublicKey: signerPublicKey,
          faceImage: photo,
          isSelfSign: isSelfSign, // NEW: Pass self-sign flag
        }),
      });

      const data = await res.json();

      if (!data.success) throw new Error(data.message || "Face verification failed");

      setVerified(true);
      toast.success(isSelfSign ? "Self-verification successful" : "Face verified successfully");

      setTimeout(() => {
        onComplete(photo);
      }, 800);
    } catch (err: any) {
      console.error("❌ Face verify error:", err);
      toast.error(err.message || "Verification failed");
      if (onFailed) onFailed();
      handleCancel();
    } finally {
      setIsProcessing(false);
      setScanProgress(0);
    }
  };

  /* ================================================================
     CAMERA UI
     ================================================================ */
  if (showCamera) {
    return (
      <div
        className="fixed inset-0 backdrop-blur-xl z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: theme.overlayBg }}
      >
        <div
          className="rounded-3xl p-8 max-w-lg w-full relative"
          style={{
            background: theme.cardBg,
            border: theme.cardBorder,
            boxShadow: theme.cardShadow,
          }}
        >
          {/* Close button */}
          <button
            onClick={handleCancel}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{
              background: theme.closeBg,
              border: theme.closeBorder,
              color: theme.closeColor,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = theme.closeHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = theme.closeBg)}
          >
            <X className="w-4 h-4" />
          </button>

          {/* Camera viewport */}
          <div
            className="aspect-video rounded-2xl mb-6 flex items-center justify-center relative overflow-hidden"
            style={{
              background: theme.viewportBg,
              border: theme.viewportBorder,
            }}
          >
            {cameraError ? (
              <div className="text-center p-6">
                <AlertCircle
                  className="w-12 h-12 mx-auto mb-4"
                  style={{ color: "#dc2626" }}
                />
                <p className="text-sm" style={{ color: "#dc2626" }}>
                  {cameraError}
                </p>
                <button
                  className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: theme.retryGradient,
                    color: "#ffffff",
                    border: "none",
                  }}
                  onClick={startCamera}
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                {/* Face oval overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="w-48 h-64 rounded-full animate-pulse"
                    style={{
                      border: theme.ovalBorder,
                      boxShadow: theme.ovalShadow,
                    }}
                  />
                </div>
              </>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {!cameraError && (
            <div className="text-center">
              <Loader2
                className="w-8 h-8 animate-spin mx-auto mb-3"
                style={{ color: theme.loaderColor }}
              />
              <p className="font-semibold text-sm" style={{ color: theme.verifyingText }}>
                {isSelfSign ? "Verifying identity for self-sign…" : "Verifying face…"}
              </p>

              {/* Progress bar */}
              <div
                className="w-full h-2 rounded-full mt-4 overflow-hidden"
                style={{ background: theme.progressTrack }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${scanProgress}%`,
                    background: theme.progressFill,
                  }}
                />
              </div>

              <p className="text-xs mt-2 font-medium" style={{ color: theme.progressPct }}>
                {scanProgress}%
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ================================================================
     MAIN UI
     ================================================================ */
  return (
    <div
      className="rounded-3xl p-8 max-w-md w-full text-center"
      style={{
        background: theme.cardBg,
        border: theme.cardBorder,
        boxShadow: theme.cardShadow,
      }}
    >
      {verified ? (
        /* ——— Verified state ——— */
        <>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{
              background: theme.verifiedBg,
              border: theme.verifiedBorder,
              boxShadow: theme.verifiedShadow,
            }}
          >
            <Check className="w-8 h-8" style={{ color: theme.verifiedCheck }} />
          </div>
          <p
            className="font-bold text-lg tracking-tight"
            style={{ color: theme.verifiedTitle }}
          >
            {isSelfSign ? "Self-Verification Complete" : "Face Verified"}
          </p>
          <p className="text-sm mt-1" style={{ color: theme.verifiedSub }}>
            {isSelfSign 
              ? "Your identity is confirmed for self-signing" 
              : "Identity confirmed successfully"}
          </p>
        </>
      ) : (
        /* ——— Default state ——— */
        <>
          {/* Icon container */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{
              background: theme.iconBg,
              border: theme.iconBorder,
              boxShadow: theme.iconShadow,
            }}
          >
            <ScanFace className="w-8 h-8" style={{ color: theme.iconColor }} />
          </div>

          <h2
            className="text-xl font-bold mb-2 tracking-tight"
            style={{ color: theme.headingColor }}
          >
            {isSelfSign ? "Self-Sign Verification" : "Face Verification Required"}
          </h2>
          <p className="text-sm mb-6" style={{ color: theme.subtitleColor }}>
            {isSelfSign 
              ? "Verify your identity to sign your own credential." 
              : "Please verify your identity to continue signing."}
          </p>

          {/* CTA Button */}
          <button
            className="w-full py-3 rounded-2xl font-semibold text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: isProcessing ? theme.btnGradientActive : theme.btnGradient,
              color: "#ffffff",
              border: "none",
              boxShadow: isProcessing ? "none" : theme.btnShadow,
              letterSpacing: "0.01em",
            }}
            onClick={handleVerify}
            disabled={isProcessing}
            onMouseEnter={(e) => {
              if (!isProcessing) {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = theme.btnShadowHover;
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = theme.btnShadow;
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            }}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying…
              </span>
            ) : (
              isSelfSign ? "Start Self-Verification" : "Start Face Verification"
            )}
          </button>

          {/* Trust badge */}
          <div
            className="mt-4 flex items-center justify-center gap-1.5 text-xs"
            style={{ color: theme.badgeColor }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: theme.badgeDot }}
            />
            Secured & encrypted
          </div>
        </>
      )}
    </div>
  );
};