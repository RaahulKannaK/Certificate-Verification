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
      const res = await fetch("http://localhost:5000/biometric/verify-face", {
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
      <div className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 flex items-center justify-center p-4">
        <div className="glass rounded-3xl p-8 max-w-lg w-full relative">
          <button
            onClick={handleCancel}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="aspect-video bg-secondary rounded-2xl mb-6 flex items-center justify-center relative overflow-hidden">
            {cameraError ? (
              <div className="text-center p-6">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <p className="text-sm text-destructive">{cameraError}</p>
                <Button size="sm" className="mt-4" onClick={startCamera}>
                  Retry
                </Button>
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
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-64 border-2 border-primary/70 rounded-full animate-pulse" />
                </div>
              </>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {!cameraError && (
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="font-medium">Verifying face...</p>

              <div className="w-full h-2 bg-secondary rounded-full mt-4">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ---------------- MAIN UI ---------------- */
  return (
    <div className="glass rounded-3xl p-8 max-w-md w-full text-center">
      {verified ? (
        <>
          <Check className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <p className="font-semibold text-green-600">Face Verified</p>
        </>
      ) : (
        <>
          <ScanFace className="w-10 h-10 mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-bold mb-2">Face Verification Required</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Please verify your identity to continue signing.
          </p>

          <Button className="w-full" onClick={handleVerify} disabled={isProcessing}>
            {isProcessing ? "Verifying..." : "Start Face Verification"}
          </Button>
        </>
      )}
    </div>
  );
};
