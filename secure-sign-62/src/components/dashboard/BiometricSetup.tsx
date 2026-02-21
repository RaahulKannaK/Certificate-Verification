import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  Fingerprint,
  ScanFace,
  Check,
  Loader2,
  X,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface BiometricSetupProps {
  onComplete: () => void;
  onSkip?: () => void;
  onCancel?: () => void;
}

export const BiometricSetup: React.FC<BiometricSetupProps> = ({
  onComplete,
  onSkip,
  onCancel,
}) => {
  const { setupBiometric, user } = useAuth();

  const [selectedType, setSelectedType] = useState<"fingerprint" | "face" | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /* ---------------- Cleanup camera ---------------- */
  useEffect(() => {
    return () => stopCamera();
  }, []);

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
      /* ================= FACE FLOW ================= */
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

        // Send photo to server for setup
        console.log("📤 Sending face to server for setup...", { email: user?.email });

        const res = await fetch("http://localhost:5000/biometric/face", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user?.email,
            image: photo,
          }),
        });

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Server returned HTML instead of JSON");
        }

        if (!data.success) throw new Error(data.message);
      }

      /* ================= FINGERPRINT FLOW ================= */
      if (type === "fingerprint") {
        await setupBiometric("fingerprint");
      }

      toast.success(
        `${type === "face" ? "Face recognition" : "Fingerprint"} set up successfully!`
      );
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
      <div className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 flex items-center justify-center p-4">
        <div className="glass rounded-3xl p-8 max-w-lg w-full relative">
          <button
            onClick={handleCancelCamera}
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
              <p className="font-medium">Scanning face...</p>

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

  /* ================= MAIN UI ================= */
  return (
    <div className="glass rounded-3xl p-8 max-w-md w-full">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl font-bold">Secure Your Private Key</h2>
        <p className="text-muted-foreground text-sm">
          Choose biometric protection for your account
        </p>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => handleSetup("fingerprint")}
          disabled={isProcessing}
          className="w-full glass rounded-2xl p-6 flex items-center gap-4"
        >
          <Fingerprint className="w-7 h-7 text-primary" />
          <span className="flex-1 text-left">Fingerprint</span>
          {user?.biometricType === "fingerprint" && <Check />}
        </button>

        <button
          onClick={() => handleSetup("face")}
          disabled={isProcessing}
          className="w-full glass rounded-2xl p-6 flex items-center gap-4"
        >
          <ScanFace className="w-7 h-7 text-accent" />
          <span className="flex-1 text-left">Face Recognition</span>
          {user?.biometricType === "face" && <Check />}
        </button>
      </div>

      {onSkip && (
        <Button variant="ghost" className="w-full mt-6" onClick={onSkip}>
          Skip
        </Button>
      )}
    </div>
  );
};
