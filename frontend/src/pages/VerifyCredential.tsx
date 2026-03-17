import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const VerifyCredential = () => {
  const { credentialId } = useParams();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      setResult({ success: false });
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  if (loading) {
    return <h2 style={{ padding: "40px" }}>🔍 Verifying...</h2>;
  }

  if (!result || !result.success) {
    return (
      <div style={{ padding: "40px" }}>
        <h2>❌ Invalid Credential</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px" }}>
      <h2>🔍 Verification Result</h2>

      <h3>
        Status:{" "}
        <span
          style={{
            color:
              result.status === "VERIFIED"
                ? "green"
                : result.status === "PENDING_SIGNATURES"
                ? "orange"
                : "red",
          }}
        >
          {result.status}
        </span>
      </h3>

      <p><b>Credential ID:</b> {result.credentialId}</p>
      <p><b>Title:</b> {result.title}</p>
      <p><b>Student:</b> {result.student}</p>
      <p><b>Issued At:</b> {result.issuedAt}</p>

      <p>
        <b>Blockchain:</b>{" "}
        {result.blockchainValid ? "✅ Valid" : "❌ Invalid"}
      </p>

      <h4>Signers:</h4>
      <ul>
        {result.signers.map((s: any, i: number) => (
          <li key={i}>
            {s.signerPublicKey} →{" "}
            {s.signed ? "✅ Signed" : "❌ Pending"}
          </li>
        ))}
      </ul>

      <br />

      <a href={result.etherscan} target="_blank">
        🔗 View on Etherscan
      </a>
    </div>
  );
};

export default VerifyCredential;