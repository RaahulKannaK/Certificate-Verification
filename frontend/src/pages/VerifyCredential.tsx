import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ethers } from "ethers";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  ExternalLink,
  ShieldCheck,
  FileText,
  Users,
  Key,
  Copy,
  Check,
  Eye,
  Lock,
  RefreshCw
} from "lucide-react";

const VerifyCredential = () => {
  const { credentialId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [anchoring, setAnchoring] = useState(false);
  const [selectedSigner, setSelectedSigner] = useState<any>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (credentialId) {
      verifyCredential(credentialId);
    }
  }, [credentialId]);

  const verifyCredential = async (id: string) => {
    try {
      setLoading(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/verifyCredential`,
        { credentialId: id }
      );
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setResult({ success: false, error: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  const anchorToBlockchain = async () => {
    try {
      setAnchoring(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/credential/anchor`,
        { credentialId }
      );
      
      if (res.data.success) {
        alert("✅ Anchored to blockchain! Tx: " + res.data.txHash);
        verifyCredential(credentialId);
      }
    } catch (err: any) {
      alert("❌ Anchor failed: " + err.message);
    } finally {
      setAnchoring(false);
    }
  };

  // Perform ECDSA verification
  const verifySignature = async (signer: any) => {
    setSelectedSigner(signer);
    setVerifying(true);
    setVerificationResult(null);

    try {
      // Construct the message exactly as it was signed
      const message = `WSIGN_PROTOCOL_V1\nCredential:${credentialId}\nSigner:${signer.signerPublicKey}`;
      
      // Get signature from signer data (now returned from backend)
      const signature = signer.ecdsaSignature;
      
      if (!signature) {
        throw new Error("Signature not available in verification data");
      }

      // Perform ECDSA recovery
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      // Check if recovered address matches claimed signer
      const isValid = recoveredAddress.toLowerCase() === signer.signerPublicKey.toLowerCase();

      setVerificationResult({
        valid: isValid,
        recovered: recoveredAddress,
        claimed: signer.signerPublicKey,
        message: message,
        signature: signature,
        messageHash: ethers.hashMessage(message),
        timestamp: new Date().toISOString()
      });

    } catch (err: any) {
      setVerificationResult({
        valid: false,
        error: err.message,
        claimed: signer.signerPublicKey
      });
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  /* ================= UI ================= */

  if (loading) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "#f5f3ff"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ 
            width: "48px", 
            height: "48px", 
            border: "4px solid #e2e8f0",
            borderTop: "4px solid #1e1a6b",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px"
          }} />
          <p style={{ color: "#64748b", fontSize: "16px" }}>Verifying credential...</p>
        </div>
      </div>
    );
  }

  if (!result || !result.success) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "#fef2f2",
        padding: "40px"
      }}>
        <div style={{ 
          background: "white", 
          padding: "40px", 
          borderRadius: "24px",
          textAlign: "center",
          maxWidth: "400px",
          boxShadow: "none"
        }}>
          <XCircle size={64} color="#dc2626" style={{ marginBottom: "16px" }} />
          <h2 style={{ color: "#dc2626", marginBottom: "8px" }}>Invalid Credential</h2>
          <p style={{ color: "#64748b" }}>This credential could not be verified or does not exist.</p>
          <button 
            onClick={() => navigate("/")}
            style={{
              marginTop: "24px",
              padding: "12px 24px",
              background: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = {
    VERIFIED: {
      color: "#16a34a",
      bg: "#f0fdf4",
      icon: ShieldCheck,
      label: "Fully Verified",
      desc: "This credential is verified on the blockchain"
    },
    SIGNED_OFFCHAIN: {
      color: "#2563eb",
      bg: "#eff6ff",
      icon: CheckCircle2,
      label: "Signed Off-Chain",
      desc: "All signatures collected, pending blockchain anchor"
    },
    SIGNING_COMPLETE: {
      color: "#2563eb",
      bg: "#eff6ff",
      icon: CheckCircle2,
      label: "Signing Complete",
      desc: "All parties have signed this credential"
    },
    PENDING_SIGNATURES: {
      color: "#d97706",
      bg: "#fffbeb",
      icon: Clock,
      label: "Pending Signatures",
      desc: "Awaiting signatures from authorized parties"
    },
    BLOCKCHAIN_MISMATCH: {
      color: "#7c3aed",
      bg: "#f5f3ff",
      icon: AlertTriangle,
      label: "Not Anchored",
      desc: "Signed but not yet recorded on blockchain"
    },
    NOT_SUBMITTED: {
      color: "#64748b",
      bg: "#f8fafc",
      icon: FileText,
      label: "Draft",
      desc: "Credential created but signing not started"
    }
  };

  const currentStatus = statusConfig[result.status] || statusConfig.NOT_SUBMITTED;
  const StatusIcon = currentStatus.icon;

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#f5f3ff",
      padding: "40px 20px"
    }}>
      <div style={{ 
        maxWidth: "900px", 
        margin: "0 auto",
        background: "white",
        borderRadius: "24px",
        overflow: "hidden",
        boxShadow: "none"
      }}>
        {/* Header */}
        <div style={{ 
          background: "linear-gradient(135deg, #1e1a6b, #2d2870)",
          padding: "32px",
          color: "white"
        }}>
          <h1 style={{ margin: 0, fontSize: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
            <ShieldCheck size={28} />
            Credential Verification
          </h1>
        </div>

        {/* Status Banner */}
        <div style={{ 
          background: currentStatus.bg,
          padding: "24px 32px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          gap: "16px"
        }}>
          <StatusIcon size={32} color={currentStatus.color} />
          <div>
            <h2 style={{ 
              margin: 0, 
              color: currentStatus.color,
              fontSize: "20px",
              fontWeight: 700
            }}>
              {currentStatus.label}
            </h2>
            <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "14px" }}>
              {currentStatus.desc}
            </p>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "32px" }}>
          {/* Credential Details */}
          <div style={{ 
            background: "#f8fafc",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "24px"
          }}>
            <h3 style={{ 
              margin: "0 0 20px 0", 
              fontSize: "16px",
              color: "#0f172a",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <FileText size={18} color="#1e1a6b" />
              Document Details
            </h3>
            
            <div style={{ display: "grid", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #e2e8f0" }}>
                <span style={{ color: "#64748b", fontSize: "14px" }}>Credential ID</span>
                <span style={{ color: "#0f172a", fontWeight: 600, fontFamily: "monospace", fontSize: "14px" }}>
                  {result.credentialId}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #e2e8f0" }}>
                <span style={{ color: "#64748b", fontSize: "14px" }}>Title</span>
                <span style={{ color: "#0f172a", fontWeight: 600 }}>{result.title}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #e2e8f0" }}>
                <span style={{ color: "#64748b", fontSize: "14px" }}>Student</span>
                <span style={{ color: "#0f172a", fontWeight: 500, fontFamily: "monospace", fontSize: "13px" }}>
                  {result.student?.slice(0, 6)}...{result.student?.slice(-4)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0" }}>
                <span style={{ color: "#64748b", fontSize: "14px" }}>Issued At</span>
                <span style={{ color: "#0f172a", fontWeight: 500 }}>
                  {new Date(result.issuedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Signers with Individual Verification */}
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ 
              margin: "0 0 16px 0", 
              fontSize: "16px",
              color: "#0f172a",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <Users size={18} color="#1e1a6b" />
              Signers ({result.signers.filter((s: any) => s.signed).length}/{result.signers.length})
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {result.signers.map((signer: any, index: number) => (
                <div key={index} style={{
                  padding: "16px",
                  background: signer.signed ? "#f0fdf4" : "#f8fafc",
                  borderRadius: "12px",
                  border: `2px solid ${signer.signed ? "#86efac" : "#e2e8f0"}`
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: signer.signed ? "#16a34a" : "#94a3b8",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "14px",
                        fontWeight: 700
                      }}>
                        {index + 1}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, color: "#0f172a", fontSize: "14px" }}>
                          {signer.isStudent ? "Student" : `Institution ${index}`}
                          {signer.signed && (
                            <span style={{ 
                              marginLeft: "8px", 
                              fontSize: "11px", 
                              color: "#16a34a",
                              background: "#dcfce7",
                              padding: "2px 8px",
                              borderRadius: "99px"
                            }}>
                              ECDSA + Face Verified
                            </span>
                          )}
                        </p>
                        <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b", fontFamily: "monospace" }}>
                          {signer.signerPublicKey?.slice(0, 12)}...{signer.signerPublicKey?.slice(-6)}
                        </p>
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {signer.signed ? (
                        <>
                          <CheckCircle2 size={24} color="#16a34a" />
                          {/* Verify Button - Only show if signature available */}
                          {signer.ecdsaSignature && (
                            <button
                              onClick={() => verifySignature(signer)}
                              style={{
                                padding: "8px 16px",
                                background: selectedSigner?.signerPublicKey === signer.signerPublicKey && verificationResult ? "#dcfce7" : "#f5f3ff",
                                color: "#1e1a6b",
                                border: "1px solid #c4b5fd",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px"
                              }}
                            >
                              <Key size={14} />
                              {selectedSigner?.signerPublicKey === signer.signerPublicKey && verificationResult ? "Hide" : "Verify ECDSA"}
                            </button>
                          )}
                        </>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Clock size={24} color="#94a3b8" />
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>Pending</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Show verification details if this signer is selected */}
                  {selectedSigner?.signerPublicKey === signer.signerPublicKey && verificationResult && (
                    <div style={{
                      marginTop: "16px",
                      padding: "20px",
                      background: "white",
                      borderRadius: "12px",
                      border: `2px solid ${verificationResult.valid ? "#86efac" : "#fecaca"}`
                    }}>
                      <h4 style={{ 
                        margin: "0 0 16px 0", 
                        fontSize: "14px",
                        fontWeight: 700,
                        color: verificationResult.valid ? "#16a34a" : "#dc2626",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}>
                        {verificationResult.valid ? (
                          <><CheckCircle2 size={18} /> Signature Validated</>
                        ) : (
                          <><AlertTriangle size={18} /> Verification Failed</>
                        )}
                      </h4>

                      {verificationResult.valid ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          {/* Public Key */}
                          <div>
                            <p style={{ margin: "0 0 6px 0", fontSize: "12px", fontWeight: 600, color: "#64748b" }}>
                              Signer Public Address (Recovered from Signature):
                            </p>
                            <div style={{
                              padding: "12px",
                              background: "#f0fdf4",
                              borderRadius: "8px",
                              fontFamily: "monospace",
                              fontSize: "13px",
                              color: "#166534",
                              wordBreak: "break-all",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center"
                            }}>
                              <span>{verificationResult.recovered}</span>
                              <button
                                onClick={() => copyToClipboard(verificationResult.recovered, 'address')}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  padding: "4px",
                                  color: "#16a34a"
                                }}
                              >
                                {copiedField === 'address' ? <Check size={16} /> : <Copy size={16} />}
                              </button>
                            </div>
                            <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#16a34a" }}>
                              ✓ Matches claimed signer address
                            </p>
                          </div>

                          {/* Message */}
                          <div>
                            <p style={{ margin: "0 0 6px 0", fontSize: "12px", fontWeight: 600, color: "#64748b" }}>
                              Signed Message:
                            </p>
                            <div style={{
                              padding: "12px",
                              background: "#f8fafc",
                              borderRadius: "8px",
                              fontFamily: "monospace",
                              fontSize: "12px",
                              color: "#0f172a",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-all",
                              border: "1px solid #e2e8f0"
                            }}>
                              {verificationResult.message}
                            </div>
                            <button
                              onClick={() => copyToClipboard(verificationResult.message, 'message')}
                              style={{
                                marginTop: "8px",
                                padding: "6px 12px",
                                background: "#f1f5f9",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "12px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                color: "#64748b"
                              }}
                            >
                              {copiedField === 'message' ? <Check size={14} /> : <Copy size={14} />}
                              Copy Message
                            </button>
                          </div>

                          {/* Signature */}
                          <div>
                            <p style={{ margin: "0 0 6px 0", fontSize: "12px", fontWeight: 600, color: "#64748b" }}>
                              ECDSA Signature:
                            </p>
                            <div style={{
                              padding: "12px",
                              background: "#f8fafc",
                              borderRadius: "8px",
                              fontFamily: "monospace",
                              fontSize: "11px",
                              color: "#0f172a",
                              wordBreak: "break-all",
                              border: "1px solid #e2e8f0"
                            }}>
                              {verificationResult.signature.slice(0, 60)}...
                            </div>
                            <button
                              onClick={() => copyToClipboard(verificationResult.signature, 'signature')}
                              style={{
                                marginTop: "8px",
                                padding: "6px 12px",
                                background: "#f1f5f9",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "12px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                color: "#64748b"
                              }}
                            >
                              {copiedField === 'signature' ? <Check size={14} /> : <Copy size={14} />}
                              Copy Full Signature
                            </button>
                          </div>

                          {/* Message Hash */}
                          <div>
                            <p style={{ margin: "0 0 6px 0", fontSize: "12px", fontWeight: 600, color: "#64748b" }}>
                              Message Hash (Keccak-256):
                            </p>
                            <div style={{
                              padding: "12px",
                              background: "#f8fafc",
                              borderRadius: "8px",
                              fontFamily: "monospace",
                              fontSize: "11px",
                              color: "#64748b",
                              wordBreak: "break-all"
                            }}>
                              {verificationResult.messageHash}
                            </div>
                          </div>

                          {/* Verification Timestamp */}
                          <p style={{ margin: "8px 0 0 0", fontSize: "11px", color: "#94a3b8" }}>
                            Verified at: {new Date(verificationResult.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <p style={{ color: "#dc2626", fontSize: "14px" }}>
                          {verificationResult.error || "Signature verification failed"}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Loading state */}
                  {selectedSigner?.signerPublicKey === signer.signerPublicKey && verifying && (
                    <div style={{
                      marginTop: "16px",
                      padding: "20px",
                      textAlign: "center",
                      color: "#64748b"
                    }}>
                      <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />
                      <p style={{ fontSize: "14px" }}>Verifying ECDSA signature...</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Blockchain Section */}
          <div style={{ 
            background: result.blockchainValid ? "#f0fdf4" : "#fef2f2",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "24px",
            border: `1px solid ${result.blockchainValid ? "#86efac" : "#fecaca"}`
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              {result.blockchainValid ? (
                <ShieldCheck size={24} color="#16a34a" />
              ) : (
                <AlertTriangle size={24} color="#dc2626" />
              )}
              <span style={{ fontWeight: 700, color: result.blockchainValid ? "#16a34a" : "#dc2626" }}>
                Blockchain {result.blockchainValid ? "Verified" : "Not Verified"}
              </span>
            </div>
            
            {result.txHash ? (
              <a 
                href={result.etherscan || `https://sepolia.etherscan.io/tx/${result.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#2563eb",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontFamily: "monospace"
                }}
              >
                {result.txHash.slice(0, 20)}... <ExternalLink size={14} />
              </a>
            ) : (
              <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
                No transaction hash available
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {result.status === "BLOCKCHAIN_MISMATCH" || result.status === "SIGNED_OFFCHAIN" ? (
              <button
                onClick={anchorToBlockchain}
                disabled={anchoring}
                style={{
                  flex: 1,
                  padding: "14px 24px",
                  background: "linear-gradient(135deg, #1e1a6b, #2d2870)",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: anchoring ? "not-allowed" : "pointer",
                  opacity: anchoring ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                {anchoring ? "Anchoring..." : "Anchor to Blockchain"}
              </button>
            ) : null}

            <button
              onClick={() => verifyCredential(credentialId)}
              style={{
                padding: "14px 24px",
                background: "white",
                color: "#1e1a6b",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Refresh
            </button>

            <button
              onClick={() => navigate("/")}
              style={{
                padding: "14px 24px",
                background: "white",
                color: "#64748b",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Back
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default VerifyCredential;