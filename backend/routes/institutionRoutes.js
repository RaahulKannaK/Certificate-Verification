import express from "express";
import con from "../db.js"; // ✅ import the promise-based connection

const router = express.Router();

// ✅ Issue Credential Route
router.post("/issueCredential", async (req, res) => {
  const { studentId, credentialId, credentialHash } = req.body;

  if (!studentId || !credentialId || !credentialHash) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  try {
    // Insert into credentials table
    const [result] = await con.query(
      "INSERT INTO credentials (studentId, credentialId, credentialHash, status, timestamp) VALUES (?, ?, ?, 'issued', NOW())",
      [studentId, credentialId, credentialHash]
    );

    console.log("✅ Credential issued:", result.insertId);

    res.json({ success: true, message: "Credential issued successfully", id: result.insertId });
  } catch (err) {
    console.error("❌ Error issuing credential:", err);
    res.status(500).json({ success: false, message: "Database error", error: err.message });
  }
});

export default router;
