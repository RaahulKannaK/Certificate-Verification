import express from "express";
import con from "../db.js";

const router = express.Router();

// ✅ Issue Credential Route
router.post("/issueCredential", async (req, res) => {
  const {
    studentId,
    credentialId,
    credentialHash,
    flowType,
    requiredSigners
  } = req.body;

  if (!studentId || !credentialId || !credentialHash || !flowType) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields"
    });
  }

  try {

    let finalRequiredSigners = [];

    // 🔹 SELF FLOW
    if (flowType === "self") {
      finalRequiredSigners = ["institution"];
    }

    // 🔹 SEQUENTIAL / PARALLEL
    else if (flowType === "sequential" || flowType === "parallel") {

      if (!requiredSigners || requiredSigners.length === 0) {
        return res.status(400).json({
          success: false,
          message: "requiredSigners needed for this flow"
        });
      }

      finalRequiredSigners = requiredSigners;
    }

    else {
      return res.status(400).json({
        success: false,
        message: "Invalid flowType"
      });
    }

    // Insert into DB
    const [result] = await con.query(
      `INSERT INTO credentials 
       (studentId, credentialId, credentialHash, flowType, requiredSigners, signatures, status, timestamp) 
       VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [
        studentId,
        credentialId,
        credentialHash,
        flowType,
        JSON.stringify(finalRequiredSigners),
        JSON.stringify([]) // initially empty signatures
      ]
    );

    console.log("✅ Credential issued:", result.insertId);

    res.json({
      success: true,
      message: "Credential issued successfully",
      id: result.insertId
    });

  } catch (err) {
    console.error("❌ Error issuing credential:", err);
    res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message
    });
  }
});

export default router;