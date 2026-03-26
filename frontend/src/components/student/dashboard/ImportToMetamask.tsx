import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Copy, CheckCircle, ExternalLink, Loader2, AlertTriangle } from "lucide-react";

interface ImportToMetamaskProps {
  portalPublicKey: string;    // 0xA1439F...
  role: 'student' | 'institution';
  onImported: () => void;     // Called when user confirms import
  onClose?: () => void;       // Optional close handler
}

const ImportToMetamask: React.FC<ImportToMetamaskProps> = ({ 
  portalPublicKey, 
  role, 
  onImported,
  onClose 
}) => {
  const [step, setStep] = useState<'fetch' | 'show' | 'done'>('fetch');
  const [privateKey, setPrivateKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    autoSetup();
  }, []);

  const autoSetup = async () => {
    try {
      // Fetch private key from backend
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/getPortalKey`, 
        { 
          publicKey: portalPublicKey, 
          role 
        }
      );
      
      const key = res.data.privateKey;
      setPrivateKey(key);
      
      // Auto-copy to clipboard
      try {
        await navigator.clipboard.writeText(key);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch (clipErr) {
        console.log("Auto-copy failed, user will manual copy");
      }
      
      setStep('show');
      toast.success("🔑 Private key ready! Copy and import to MetaMask.");
      
    } catch (err: any) {
      console.error("Failed to fetch key:", err);
      setError(err.response?.data?.message || "Failed to fetch private key");
      setStep('show');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(privateKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied! Now paste in MetaMask.");
    } catch (err) {
      toast.error("Copy failed. Select and copy manually.");
    }
  };

  const openMetaMask = () => {
    // MetaMask doesn't have a direct import URL, so we open the extension
    // Users need to click account icon → Import account
    window.open('https://metamask.io/', '_blank');
    toast.info("In MetaMask: Click account icon → Import account → Paste key");
  };

  if (step === 'fetch') {
    return (
      <div style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000
      }}>
        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "40px",
          textAlign: "center",
          maxWidth: "300px"
        }}>
          <Loader2 size={40} style={{ animation: "spin 1s linear infinite", marginBottom: "16px", color: "#1e1a6b" }} />
          <p>Fetching your portal key...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "20px"
    }}>
      <div style={{
        background: "white",
        borderRadius: "16px",
        padding: "24px",
        maxWidth: "450px",
        width: "100%",
        position: "relative",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
      }}>
        {onClose && (
          <button 
            onClick={onClose}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px"
            }}
          >
            ✕
          </button>
        )}

        <div style={{
          background: "#fef3c7",
          borderRadius: "8px",
          padding: "12px",
          marginBottom: "20px",
          border: "1px solid #fcd34d",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <AlertTriangle size={20} color="#92400e" />
          <p style={{ fontSize: "13px", color: "#92400e", margin: 0 }}>
            One-time setup: Import your portal key to MetaMask
          </p>
        </div>

        <h3 style={{ 
          fontSize: "20px", 
          fontWeight: 700, 
          color: "#0f172a",
          marginBottom: "8px"
        }}>
          Import to MetaMask
        </h3>

        <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "20px", lineHeight: 1.5 }}>
          Your portal key <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontSize: "12px" }}>{portalPublicKey.slice(0, 10)}...</code> needs to be imported to sign.
        </p>

        {error ? (
          <div style={{
            background: "#fef2f2",
            color: "#991b1b",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "16px",
            fontSize: "13px"
          }}>
            {error}
          </div>
        ) : (
          <>
            <div style={{
              background: "#f8fafc",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "20px",
              border: "1px solid #e2e8f0"
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px"
              }}>
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                  Private Key (Auto-copied)
                </span>
                <button 
                  onClick={copyToClipboard}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "12px",
                    color: copied ? "#16a34a" : "#1e1a6b",
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              
              <div style={{
                fontFamily: "monospace",
                fontSize: "11px",
                color: "#0f172a",
                wordBreak: "break-all",
                background: "white",
                padding: "12px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                userSelect: "all"
              }}>
                {privateKey}
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginBottom: "12px" }}>
                Steps to import:
              </p>
              <ol style={{ 
                fontSize: "13px", 
                color: "#475569", 
                lineHeight: 2, 
                paddingLeft: "20px",
                margin: 0
              }}>
                <li>Click <strong>"Open MetaMask"</strong> below</li>
                <li>Click your <strong>account icon</strong> (top right)</li>
                <li>Select <strong>"Import account"</strong></li>
                <li>Select type: <strong>"Private Key"</strong></li>
                <li>Paste the key above (already copied ✓)</li>
                <li>Click <strong>Import</strong></li>
                <li><strong>Switch</strong> to the new account</li>
                <li>Return here and click <strong>"I've Imported"</strong></li>
              </ol>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={openMetaMask}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  background: "white",
                  color: "#0f172a",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                <ExternalLink size={16} />
                Open MetaMask
              </button>
              
              <button
                onClick={onImported}
                style={{
                  flex: 2,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #1e1a6b, #2d2870)",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                <CheckCircle size={16} />
                I've Imported → Sign
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ImportToMetamask;