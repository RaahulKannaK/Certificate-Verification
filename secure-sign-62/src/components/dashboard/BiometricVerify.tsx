import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ScanFace, Loader2, X, AlertCircle, Check } from "lucide-react";
import { toast } from "sonner";

interface BiometricVerifyProps {
  credentialId: string;
  onComplete: (faceImage?: string) => void;
  onCancel?: () => void;
}

export const BiometricVerify: React.FC<BiometricVerifyProps> = ({
  credentialId,
  onComplete,
  onCancel,
}) => {
  const { user } = useAuth();

  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

    if (!user?.walletPublicKey) {
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

      /* 🔥 Correct request body */
      const res = await fetch(`${import.meta.env.VITE_API_URL}/biometric/verify-face`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credentialId: credentialId,
          signerPublicKey: user.walletPublicKey,
          faceImage: photo,
        }),
      });

      const data = await res.json();

      if (!data.success) throw new Error(data.message || "Face verification failed");

      setVerified(true);
      toast.success("Face verified successfully");

      setTimeout(() => {
        onComplete(photo); // pass photo back for signing
      }, 800);
    } catch (err: any) {
      console.error("❌ Face verify error:", err);
      toast.error(err.message || "Verification failed");
      handleCancel();
    } finally {
      setIsProcessing(false);
      setScanProgress(0);
    }
  };

  /* ---------------- CAMERA UI ---------------- */
  if (showCamera) {
    return (
      <div
        className="fixed inset-0 backdrop-blur-xl z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(245, 243, 255, 0.97)" }}
      >
        <div
          className="rounded-3xl p-8 max-w-lg w-full relative"
          style={{
            background: "#ffffff",
            border: "1.5px solid #ede9fe",
            boxShadow:
              "0 8px 32px rgba(124, 58, 237, 0.10), 0 2px 8px rgba(99, 102, 241, 0.07)",
          }}
        >
          {/* Close button */}
          <button
            onClick={handleCancel}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{
              background: "#f5f3ff",
              border: "1px solid #ede9fe",
              color: "#7c3aed",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "#ede9fe")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "#f5f3ff")
            }
          >
            <X className="w-4 h-4" />
          </button>

          {/* Camera viewport */}
          <div
            className="aspect-video rounded-2xl mb-6 flex items-center justify-center relative overflow-hidden"
            style={{
              background: "#f5f3ff",
              border: "1.5px solid #ede9fe",
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
                    background: "linear-gradient(135deg, #7c3aed, #6366f1)",
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
                      border: "2.5px solid rgba(124, 58, 237, 0.65)",
                      boxShadow:
                        "0 0 0 4px rgba(124, 58, 237, 0.10), 0 0 24px rgba(99, 102, 241, 0.18)",
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
                style={{ color: "#7c3aed" }}
              />
              <p className="font-semibold text-sm" style={{ color: "#4c1d95" }}>
                Verifying face…
              </p>

              {/* Progress bar */}
              <div
                className="w-full h-2 rounded-full mt-4 overflow-hidden"
                style={{ background: "#ede9fe" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${scanProgress}%`,
                    background: "linear-gradient(90deg, #7c3aed, #6366f1)",
                  }}
                />
              </div>

              <p
                className="text-xs mt-2 font-medium"
                style={{ color: "#6d28d9" }}
              >
                {scanProgress}%
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ---------------- MAIN UI ---------------- */
  return (
    <div
      className="rounded-3xl p-8 max-w-md w-full text-center"
      style={{
        background: "#ffffff",
        border: "1.5px solid #ede9fe",
        boxShadow:
          "0 8px 32px rgba(124, 58, 237, 0.10), 0 2px 8px rgba(99, 102, 241, 0.07)",
      }}
    >
      {verified ? (
        <>
          {/* Success state — green tones */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{
              background: "#f0faf4",
              border: "1.5px solid #bbf7d0",
              boxShadow: "0 4px 16px rgba(5, 150, 105, 0.13)",
            }}
          >
            <Check className="w-8 h-8" style={{ color: "#059669" }} />
          </div>
          <p
            className="font-bold text-lg tracking-tight"
            style={{ color: "#065f46" }}
          >
            Face Verified
          </p>
          <p className="text-sm mt-1" style={{ color: "#059669" }}>
            Identity confirmed successfully
          </p>
        </>
      ) : (
        <>
          {/* Icon */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{
              background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
              border: "1.5px solid #ddd6fe",
              boxShadow: "0 4px 16px rgba(124, 58, 237, 0.13)",
            }}
          >
            <ScanFace className="w-8 h-8" style={{ color: "#7c3aed" }} />
          </div>

          <h2
            className="text-xl font-bold mb-2 tracking-tight"
            style={{ color: "#1e1b4b" }}
          >
            Face Verification Required
          </h2>
          <p className="text-sm mb-6" style={{ color: "#6d28d9" }}>
            Please verify your identity to continue signing.
          </p>

          {/* CTA Button */}
          <button
            className="w-full py-3 rounded-2xl font-semibold text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: isProcessing
                ? "#6366f1"
                : "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)",
              color: "#ffffff",
              border: "none",
              boxShadow: isProcessing
                ? "none"
                : "0 4px 14px rgba(124, 58, 237, 0.35)",
              letterSpacing: "0.01em",
            }}
            onClick={handleVerify}
            disabled={isProcessing}
            onMouseEnter={(e) => {
              if (!isProcessing) {
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 6px 20px rgba(124, 58, 237, 0.45)";
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 4px 14px rgba(124, 58, 237, 0.35)";
              (e.currentTarget as HTMLButtonElement).style.transform =
                "translateY(0)";
            }}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying…
              </span>
            ) : (
              "Start Face Verification"
            )}
          </button>

          {/* Subtle trust badge */}
          <div
            className="mt-4 flex items-center justify-center gap-1.5 text-xs"
            style={{ color: "#059669" }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#059669" }}
            />
            Secured & encrypted
          </div>
        </>
      )}
    </div>
  );
};