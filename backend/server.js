// backend/server.js
import crypto from "crypto";
import axios from "axios";
import express from "express";
import { ethers } from "ethers";
import cors from "cors";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import { PDFDocument } from 'pdf-lib';
import streamifier from 'streamifier';
import cloudinary from "./config/cloudinary.js";


// ✅ Only one DB import
import db from "./config/db.js";

import { issueOnBlockchain } from "./services/blockchainService.js";
import issueCredential from "./blockchain/issueCredential.js";


const app = express();
// ========================
// 🔧 Middleware
// ========================
app.use(cors({
  origin: ["https://w-sign.onrender.com", "http://localhost:8080"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));


// ✅ Serve uploaded files statically

// ✅ Test route
app.get("/", (req, res) => res.send("✅ Backend is running!"));

// ========================
// ✅ MySQL connection check
// ========================
db.getConnection((err, connection) => {
  if (err) console.error("❌ MySQL connection failed:", err.message);
  else {
    console.log("✅ Connected to MySQL successfully!");
    connection.release();
  }
});

// Keep ONLY this one mergeSignatures function (remove any other)

// ==========================================================
// 🧩 SIGNUP
// ==========================================================
// ==========================================================
// 🔐 SIGNUP
// ==========================================================


app.post("/signup", async (req, res) => {
  const { name, email, password, phone, age, role, walletPublicKey, walletPrivateKeyEncrypted } = req.body;
  console.log("Signup payload:", { ...req.body, password: '[REDACTED]' });

  // Validation - now includes password
  if (!name || !email || !password || !role || !walletPublicKey || !walletPrivateKeyEncrypted) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Password strength validation
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  try {
    if (role === "institution") {
      const [result] = await db.query(
        `INSERT INTO institutions 
         (institutionName, email, password, phone, walletPublicKey, walletPrivateKeyEncrypted)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, email, password, phone || null, walletPublicKey, walletPrivateKeyEncrypted]
      );
      console.log("Institution inserted ID:", result.insertId);
      return res.status(201).json({ message: "🏛️ Institution registered successfully" });
    }

    // Student / Worker / Admin
    const [firstName, ...lastParts] = name.trim().split(" ");
    const lastName = lastParts.join(" ") || "";

    const [result] = await db.query(
      `INSERT INTO users
       (firstName, lastName, age, phone, email, password, role, walletPublicKey, walletPrivateKeyEncrypted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [firstName, lastName, age || null, phone || null, email, password, role, walletPublicKey, walletPrivateKeyEncrypted]
    );

    console.log("User inserted ID:", result.insertId);
    res.status(201).json({ message: "🎓 User signup successful" });
  } catch (err) {
    console.error("❌ Signup Error:", err.sqlMessage || err);
    // Handle duplicate email error
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: err.sqlMessage || "Server error" });
  }
});

// ==========================================================
// 🔐 LOGIN (Email + Password + Public Key)
// ==========================================================

// ==========================================================
// 🔐 LOGIN (Email + Password + Public Key) - DEBUG VERSION
// ==========================================================
// ==========================================================
// 🔐 LOGIN (Email + Password + Public Key) - DEBUG VERSION
// ==========================================================
app.post("/login", async (req, res) => {
  const { email, password, publicKey } = req.body;

  try {
    // Parallelize user and institution lookups
    const [userResult, instResult] = await Promise.all([
      db.query(
        "SELECT id, firstName, lastName, age, phone, email, role, walletPublicKey, password FROM users WHERE email = ? AND walletPublicKey = ?",
        [email, publicKey]
      ),
      db.query(
        "SELECT id, institutionName AS firstName, '' AS lastName, null AS age, phone, email, 'institution' AS role, walletPublicKey, password FROM institutions WHERE email = ? AND walletPublicKey = ?",
        [email, publicKey]
      )
    ]);

    const userRows = userResult[0];
    const instRows = instResult[0];

    let foundUser = null;

    if (userRows.length) {
      foundUser = userRows[0];
    } else if (instRows.length) {
      foundUser = instRows[0];
    }

    if (!foundUser) {
      return res.status(404).json({ message: "User or institution not found" });
    }

    // Verify password (plain text as per existing logic)
    if (foundUser.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Success - Remove password from response
    const { password: _, ...userWithoutPassword } = foundUser;

    return res.json({
      message: "✅ Login successful!",
      user: userWithoutPassword
    });
  } catch (err) {
    console.error("❌ Login Error Details:", err);
    console.error("Error Code:", err.code);
    console.error("Error Message:", err.message);
    console.error("Error Stack:", err.stack);
    res.status(500).json({
      message: "Server error during login",
      error: err.message
    });
  }
});
// ==========================================================
// 🔗 GET WALLET
// ==========================================================
app.post("/getWallet", async (req, res) => {
  const { email, role } = req.body;
  if (!email || !role) return res.status(400).json({ message: "Missing email or role" });

  try {
    const table = role === "institution" ? "institutions" : "users";
    const [rows] = await db.query(`SELECT walletPublicKey FROM ${table} WHERE email = ?`, [email]);

    if (!rows.length) return res.status(404).json({ message: "User not found" });

    res.json({ walletPublicKey: rows[0].walletPublicKey || null });
  } catch (err) {
    console.error("🔥 getWallet SERVER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


app.get("/biometric/status/:email", async (req, res) => {
  const { email } = req.params;

  try {
    const [[user]] = await db.query(
      "SELECT biometric_type FROM users WHERE email = ?",
      [email]
    );


    const [[institution]] = await db.query(
      "SELECT biometric_type FROM institutions WHERE email = ?",
      [email]
    );

    const record = user || institution;

    if (!record || !record.biometric_type) {
      return res.json({
        biometricSetup: false,
        biometricType: null,
      });
    }

    res.json({
      biometricSetup: true,
      biometricType: record.biometric_type,
    });

  } catch (err) {
    console.error("Status error:", err);
    res.status(500).json({
      biometricSetup: false,
      biometricType: null,
    });
  }
});

app.post("/biometric/face", async (req, res) => {
  const { email, image } = req.body;

  console.log("📥 FACE ENROLL REQUEST:", {
    email,
    imageLength: image?.length,
  });

  if (!email || !image) {
    return res.status(400).json({
      success: false,
      message: "Missing email or image",
    });
  }

  try {
    // ===============================
    // 1️⃣ Check secret
    // ===============================
    if (!process.env.BIOMETRIC_SECRET) {
      console.error("❌ BIOMETRIC_SECRET not defined");
      return res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
    }

    console.log("🔑 ENROLL SECRET:", process.env.BIOMETRIC_SECRET);

    // ===============================
    // 2️⃣ Call Python AI
    // ===============================
    console.log("🤖 Sending image to Python...");

    const aiRes = await axios.post(
      `${process.env.FACE_API_URL}/extract-face`,
      { image },
      { timeout: 3000000 }
    );

    if (!aiRes.data.success) {
      return res.status(400).json({
        success: false,
        message: "Face not detected. Try again.",
      });
    }

    const embeddingArray = aiRes.data.embedding;

    console.log("✅ Embedding length:", embeddingArray.length);

    if (!Array.isArray(embeddingArray) || embeddingArray.length !== 128) {
      return res.status(500).json({
        success: false,
        message: "Invalid embedding format",
      });
    }

    const embeddingJSON = JSON.stringify(embeddingArray);

    // ===============================
    // 3️⃣ Generate crypto values
    // ===============================
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(16);

    console.log("Salt length:", salt.length);
    console.log("IV length:", iv.length);
    console.log("Salt is buffer:", Buffer.isBuffer(salt));
    console.log("IV is buffer:", Buffer.isBuffer(iv));

    const key = crypto.scryptSync(
      process.env.BIOMETRIC_SECRET,
      salt,
      32
    );

    console.log("Key length:", key.length);

    // ===============================
    // 4️⃣ Encrypt
    // ===============================
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

    const encrypted = Buffer.concat([
      cipher.update(embeddingJSON, "utf8"),
      cipher.final(),
    ]);

    console.log("Encrypted length:", encrypted.length);
    console.log("Encrypted is buffer:", Buffer.isBuffer(encrypted));

    // 🚨 IMPORTANT: STORE RAW BUFFERS (NO HEX)
    // ===============================
    const [[user]] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    const [[institution]] = await db.query(
      "SELECT id FROM institutions WHERE email = ?",
      [email]
    );

    if (!user && !institution) {
      return res.status(404).json({
        success: false,
        message: "Email not found",
      });
    }

    if (user) {
      await db.query(
        `UPDATE users
         SET biometric_type = ?,
             biometric_vector_encrypted = ?,
             biometric_iv = ?,
             biometric_salt = ?,
             biometric_created_at = NOW()
         WHERE email = ?`,
        ["face", encrypted, iv, salt, email]
      );
      console.log("✅ Stored biometric for USER (RAW BUFFER)");
    } else {
      await db.query(
        `UPDATE institutions
         SET biometric_type = ?,
             biometric_vector_encrypted = ?,
             biometric_iv = ?,
             biometric_salt = ?,
             biometric_created_at = NOW()
         WHERE email = ?`,
        ["face", encrypted, iv, salt, email]
      );
      console.log("✅ Stored biometric for INSTITUTION (RAW BUFFER)");
    }

    return res.json({
      success: true,
      message: "Face biometric enrolled securely",
    });

  } catch (err) {
    console.error("❌ FACE ENROLL ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during face enrollment",
    });
  }
});


app.post("/credential/sign", async (req, res) => {
  console.log("📥 SIGN API HIT - Stage:", req.body.stage || "unknown");
  console.log("📦 Body:", req.body);

  try {
    const {
      credentialId,
      signerPublicKey,
      signature,
      message,
      stage = "ecdsa",
      faceData,
      ecdsaToken,
      isSelfSign = false,
    } = req.body;

    /* ================= VALIDATION ================= */
    if (!credentialId || !signerPublicKey) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    /* ================= STAGE 1: ECDSA VERIFICATION ================= */
    if (stage === "ecdsa") {
      
      if (!signature || !message) {
        return res.status(400).json({
          success: false,
          message: "Signature and message required for ECDSA stage",
        });
      }

      // Verify ECDSA signature
      try {
        const recoveredAddress = ethers.verifyMessage(message, signature);
        console.log("🔐 Recovered:", recoveredAddress);
        console.log("🎯 Expected:", signerPublicKey);

        if (recoveredAddress.toLowerCase() !== signerPublicKey.toLowerCase()) {
          return res.status(400).json({
            success: false,
            message: "Invalid signature",
          });
        }
        console.log("✅ ECDSA verification passed");
      } catch (verifyErr) {
        return res.status(400).json({
          success: false,
          message: "Signature verification failed",
        });
      }

      // Check if signer is authorized
      let signer = null;
      
      // Try direct match first
      const [[directSigner]] = await db.query(
        `SELECT cs.*, u.walletPublicKey as userKey, i.walletPublicKey as instKey
         FROM credential_signers cs
         LEFT JOIN users u ON cs.signerPublicKey = u.walletPublicKey
         LEFT JOIN institutions i ON cs.signerPublicKey = i.walletPublicKey
         WHERE cs.credentialId = ? AND LOWER(cs.signerPublicKey) = LOWER(?)`,
        [credentialId, signerPublicKey]
      );
      
      signer = directSigner;

      // If not found, check linked accounts
      if (!signer) {
        const [[linkedStudent]] = await db.query(
          `SELECT walletPublicKey FROM users WHERE LOWER(metamaskAddress) = LOWER(?)`,
          [signerPublicKey]
        );
        
        const [[linkedInstitution]] = await db.query(
          `SELECT walletPublicKey FROM institutions WHERE LOWER(metamaskAddress) = LOWER(?)`,
          [signerPublicKey]
        );
        
        const portalKey = linkedStudent?.walletPublicKey || linkedInstitution?.walletPublicKey;
        
        if (portalKey) {
          const [[linkedSigner]] = await db.query(
            `SELECT cs.*, u.walletPublicKey as userKey, i.walletPublicKey as instKey
             FROM credential_signers cs
             LEFT JOIN users u ON cs.signerPublicKey = u.walletPublicKey
             LEFT JOIN institutions i ON cs.signerPublicKey = i.walletPublicKey
             WHERE cs.credentialId = ? AND LOWER(cs.signerPublicKey) = LOWER(?)`,
            [credentialId, portalKey]
          );
          signer = linkedSigner;
        }
      }

      if (!signer) {
        // Get expected signers for error message
        const [expectedSigners] = await db.query(
          `SELECT cs.signerPublicKey, cs.isStudent, 
            u.walletPublicKey as uKey, u.metamaskAddress as uMeta,
            i.walletPublicKey as iKey, i.metamaskAddress as iMeta
           FROM credential_signers cs
           LEFT JOIN users u ON cs.signerPublicKey = u.walletPublicKey
           LEFT JOIN institutions i ON cs.signerPublicKey = i.walletPublicKey
           WHERE cs.credentialId = ?`,
          [credentialId]
        );

        const formattedSigners = expectedSigners.map(s => ({
          portalKey: s.signerPublicKey,
          type: s.isStudent ? 'student' : 'institution',
          linkedMetamask: s.uMeta || s.iMeta || null
        }));

        return res.status(403).json({
          success: false,
          message: "Unauthorized signer",
          yourMetamask: signerPublicKey,
          expectedSigners: formattedSigners,
          hint: "Your MetaMask address is not linked to any signer on this credential",
          needsLinking: true
        });
      }

      // Check if already signed
      if (signer.signed === 1 || signer.signed === true) {
        return res.status(400).json({
          success: false,
          message: "Already signed",
          signedAt: signer.signedAt
        });
      }

      // Check sequential order
      const [[credential]] = await db.query(
        `SELECT signingType FROM issued_credentials WHERE credentialId = ?`,
        [credentialId]
      );

      if (credential?.signingType === "sequential") {
        const [[pending]] = await db.query(
          `SELECT signerOrder FROM credential_signers 
           WHERE credentialId = ? AND signed = 0 AND signerOrder < ?
           ORDER BY signerOrder LIMIT 1`,
          [credentialId, signer.signerOrder]
        );

        if (pending && pending.signerOrder < signer.signerOrder) {
          return res.status(400).json({
            success: false,
            message: "Sequential signing order violation",
            pendingOrder: pending.signerOrder,
            yourOrder: signer.signerOrder
          });
        }
      }

      // Generate temporary token for stage 2
      const tokenData = `${credentialId}:${signer.signerPublicKey}:${signature}:${Date.now()}:${Math.random()}`;
      const newEcdsaToken = crypto.createHash('sha256').update(tokenData).digest('hex').substring(0, 32);
      
      // Store pending signature temporarily
      await db.query(
        `INSERT INTO pending_signatures 
         (credentialId, signerPublicKey, signature, message, ecdsaToken, createdAt, faceAttempts) 
         VALUES (?, ?, ?, ?, ?, NOW(), 0)
         ON DUPLICATE KEY UPDATE 
         signature = ?, message = ?, ecdsaToken = ?, createdAt = NOW(), faceAttempts = 0`,
        [credentialId, signer.signerPublicKey, signature, message, newEcdsaToken, signature, message, newEcdsaToken]
      );

      console.log("✅ Stage 1 complete - ECDSA verified, awaiting face verification");

      return res.json({
        success: true,
        stage: "ecdsa_complete",
        message: "ECDSA verified. Please complete face verification.",
        ecdsaToken: newEcdsaToken,
        nextStage: "face",
        expiresIn: "5 minutes"
      });
    }

    /* ================= STAGE 2: FACE VERIFICATION ================= */
    else if (stage === "face") {
      
      if (!ecdsaToken || !faceData) {
        return res.status(400).json({
          success: false,
          message: "ECDSA token and face data required for face stage",
        });
      }

      // Verify token and get pending signature
      const [[pending]] = await db.query(
        `SELECT * FROM pending_signatures 
         WHERE ecdsaToken = ? AND credentialId = ? AND LOWER(signerPublicKey) = LOWER(?)`,
        [ecdsaToken, credentialId, signerPublicKey]
      );

      if (!pending) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired ECDSA token. Please restart signing process.",
        });
      }

      // Check token expiry (5 minutes)
      const tokenAge = Date.now() - new Date(pending.createdAt).getTime();
      if (tokenAge > 5 * 60 * 1000) {
        await db.query(`DELETE FROM pending_signatures WHERE ecdsaToken = ?`, [ecdsaToken]);
        return res.status(400).json({
          success: false,
          message: "ECDSA token expired. Please restart signing process.",
        });
      }

      // ================= FACE VERIFICATION =================
      console.log("🔍 Starting face verification...");
      
      let faceVerified = false;
      let faceError = null;

      try {
        // TODO: Implement actual face verification
        // Option 1: Check if face exists in image
        // faceVerified = await verifyFaceExists(faceData);
        
        // Option 2: Match against stored template (recommended)
        faceVerified = await matchFaceAgainstStored(signerPublicKey, faceData);
        
        // Option 3: Liveness detection
        // const liveness = await checkLiveness(faceData);
        // faceVerified = liveness.isLive && faceVerified;

        console.log("✅ Face verification result:", faceVerified);
        
      } catch (err) {
        console.error("❌ Face verification error:", err);
        faceError = err.message;
        faceVerified = false;
      }

      if (!faceVerified) {
        // Increment failed attempts
        await db.query(
          `UPDATE pending_signatures 
           SET faceAttempts = faceAttempts + 1,
               lastAttemptAt = NOW()
           WHERE ecdsaToken = ?`,
          [ecdsaToken]
        );

        // Check max attempts (3)
        const [[attemptData]] = await db.query(
          `SELECT faceAttempts FROM pending_signatures WHERE ecdsaToken = ?`,
          [ecdsaToken]
        );

        if (attemptData?.faceAttempts >= 3) {
          await db.query(`DELETE FROM pending_signatures WHERE ecdsaToken = ?`, [ecdsaToken]);
          return res.status(403).json({
            success: false,
            message: "Too many failed face verification attempts. Please restart.",
            attempts: attemptData.faceAttempts
          });
        }

        return res.status(400).json({
          success: false,
          message: "Face verification failed",
          error: faceError || "Face does not match registered biometric",
          attemptsRemaining: 3 - (attemptData?.faceAttempts || 0)
        });
      }

      // ================= BOTH STAGES PASSED - FINALIZE SIGNATURE =================
      console.log("✅ Both ECDSA and Face verified - Finalizing signature");

      // Update credential_signers as signed
      await db.query(
        `UPDATE credential_signers 
         SET signed = 1, signedAt = NOW(), ecdsaVerified = 1, faceVerified = 1
         WHERE credentialId = ? AND signerPublicKey = ?`,
        [credentialId, pending.signerPublicKey]
      );

      // Clean up pending signature
      await db.query(`DELETE FROM pending_signatures WHERE ecdsaToken = ?`, [ecdsaToken]);

      // Log the signature
      await db.query(
        `INSERT INTO signature_logs 
         (credentialId, signerPublicKey, method, ecdsaSignature, verifiedAt) 
         VALUES (?, ?, 'ecdsa+face', ?, NOW())`,
        [credentialId, pending.signerPublicKey, pending.signature]
      );

      // Check if all signers completed
      const [allSigners] = await db.query(
        `SELECT signed FROM credential_signers WHERE credentialId = ?`,
        [credentialId]
      );
      
      const allDone = allSigners.every(s => s.signed === 1 || s.signed === true);
      
      if (allDone) {
        await db.query(
          `UPDATE issued_credentials 
           SET status = 'completed', completedAt = NOW() 
           WHERE credentialId = ?`,
          [credentialId]
        );
      }

      console.log("✅ Signature finalized successfully");

      return res.json({
        success: true,
        stage: "complete",
        message: "Signed successfully with ECDSA + Face verification",
        signer: pending.signerPublicKey,
        verificationMethods: ["ecdsa", "face"],
        allComplete: allDone
      });
    }

    /* ================= INVALID STAGE ================= */
    else {
      return res.status(400).json({
        success: false,
        message: "Invalid stage. Use 'ecdsa' or 'face'",
      });
    }

  } catch (err) {
    console.error("❌ SIGN ERROR:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// ================= FACE VERIFICATION STUBS =================
// Replace these with your actual face recognition implementation

async function matchFaceAgainstStored(signerPublicKey, faceData) {
  // TODO: Implement with your face recognition service (AWS Rekognition, Azure Face, etc.)
  
  // 1. Retrieve stored face template
  const [[user]] = await db.query(
    `SELECT faceTemplate, faceData FROM users WHERE LOWER(walletPublicKey) = LOWER(?)`,
    [signerPublicKey]
  );
  
  const [[institution]] = await db.query(
    `SELECT faceTemplate, faceData FROM institutions WHERE LOWER(walletPublicKey) = LOWER(?)`,
    [signerPublicKey]
  );
  
  const storedTemplate = user?.faceTemplate || institution?.faceTemplate;
  const storedFaceData = user?.faceData || institution?.faceData;
  
  if (!storedTemplate && !storedFaceData) {
    console.log("⚠️ No face template found, allowing bypass for testing");
    return true; // REMOVE IN PRODUCTION
  }

  // TODO: Call your face comparison API
  // Example: return await faceApi.compare(faceData, storedTemplate);
  
  console.log("⚠️ Face verification bypassed - implement actual matching!");
  return true; // STUB - REMOVE IN PRODUCTION
}

async function verifyFaceExists(faceData) {
  // Check if image is valid base64 and contains face data
  if (!faceData || typeof faceData !== 'string') return false;
  if (!faceData.startsWith('data:image')) return false;
  return true;
}

async function checkLiveness(faceData) {
  // TODO: Implement liveness detection to prevent photo spoofing
  return { isLive: true, confidence: 0.99 };
}


app.post("/verifyCredential", async (req, res) => {
  console.log("🔍 VERIFY API HIT");
  console.log("📦 Body:", req.body);

  try {
    const { credentialId } = req.body;

    if (!credentialId) {
      return res.status(400).json({
        success: false,
        message: "Credential ID required",
      });
    }

    /* ================= GET CREDENTIAL ================= */
    const [[credential]] = await db.query(
      `SELECT * FROM issued_credentials WHERE credentialId = ?`,
      [credentialId]
    );

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: "Credential not found",
      });
    }

    /* ================= GET SIGNERS WITH SIGNATURES ================= */
    const [signers] = await db.query(
      `SELECT 
        cs.signerPublicKey, 
        cs.signed, 
        cs.signedAt, 
        cs.isStudent, 
        cs.signerOrder,
        sl.ecdsaSignature,
        sl.method as signatureMethod,
        sl.verifiedAt as signatureVerifiedAt
       FROM credential_signers cs
       LEFT JOIN signature_logs sl 
         ON cs.credentialId = sl.credentialId 
         AND cs.signerPublicKey = sl.signerPublicKey
       WHERE cs.credentialId = ?
       ORDER BY cs.signerOrder`,
      [credentialId]
    );

    /* ================= CHECK ALL SIGNED ================= */
    const allSigned = signers.every((s) => s.signed === 1);

    /* ================= BLOCKCHAIN VERIFY ================= */
    let blockchainValid = false;
    let onChainStatus = "NOT_CHECKED";

    if (credential.txHash) {
      try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const receipt = await provider.getTransactionReceipt(credential.txHash);
        
        if (receipt) {
          blockchainValid = receipt.status === 1;
          onChainStatus = receipt.status === 1 ? "CONFIRMED" : "FAILED";
          console.log("⛓ On-chain receipt found, status:", onChainStatus);
        } else {
          blockchainValid = true;
          onChainStatus = "PENDING";
          console.log("⛓ Transaction pending:", credential.txHash);
        }
      } catch (err) {
        console.log("⚠️ Blockchain check failed:", err.message);
        blockchainValid = true;
        onChainStatus = "DB_TRUSTED";
      }
    }

    /* ================= FINAL STATUS ================= */
    let status = "INVALID";

    if (allSigned && credential.txHash && blockchainValid) {
      status = "VERIFIED";
    } else if (!allSigned) {
      status = "PENDING_SIGNATURES";
    } else if (allSigned && !credential.txHash) {
      status = "SIGNING_COMPLETE";
    } else if (!blockchainValid) {
      status = "BLOCKCHAIN_FAILED";
    }

    /* ================= RESPONSE ================= */
    res.json({
      success: true,
      credentialId: credential.credentialId,
      title: credential.title,
      student: credential.studentPublicKey,
      institutions: JSON.parse(credential.institutionPublicKeys || "[]"),
      status,
      issuedAt: credential.issuedAt,
      signers: signers.map(s => ({
        signerPublicKey: s.signerPublicKey,
        signed: s.signed === 1,
        signedAt: s.signedAt,
        isStudent: s.isStudent === 1,
        order: s.signerOrder,
        // Include signature data for verification
        ecdsaSignature: s.ecdsaSignature || null,
        signatureMethod: s.signatureMethod || null,
        signatureVerifiedAt: s.signatureVerifiedAt || null
      })),
      blockchainValid,
      onChainStatus,
      txHash: credential.txHash,
      etherscan: credential.txHash 
        ? `https://sepolia.etherscan.io/tx/${credential.txHash}` 
        : null,
    });

  } catch (error) {
    console.error("❌ VERIFY ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

app.post("/auth/getPortalKey", async (req, res) => {
  try {
    const { publicKey, role, password } = req.body;
    
    // Verify password/token (add your auth logic here)
    // if (!verifyAuth(req)) return res.status(401).json({ error: "Unauthorized" });

    const table = role === 'student' ? 'users' : 'institutions';
    
    const [[account]] = await db.query(
      `SELECT walletPrivateKeyEncrypted FROM ${table} WHERE walletPublicKey = ?`,
      [publicKey]
    );

    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    res.json({
      success: true,
      publicKey: publicKey,
      privateKey: account.privateKey, // Hex format: 0x...
      message: "Import this private key into MetaMask to sign directly with your portal key"
    });

  } catch (err) {
    console.error("❌ Export error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// Link MetaMask to institution account
// Universal MetaMask linking for both students and institutions


// In your verification endpoint - handle missing blockchain gracefully

app.get("/verify/:credentialId", async (req, res) => {
  try {
    const { credentialId } = req.params;

    // Get credential from DB
    const [[credential]] = await db.query(
      `SELECT * FROM issued_credentials WHERE credentialId = ?`,
      [credentialId]
    );

    if (!credential) {
      return res.status(404).json({
        success: false,
        status: "NOT_FOUND",
        message: "Credential not found"
      });
    }

    // Get signers
    const [signers] = await db.query(
      `SELECT * FROM credential_signers WHERE credentialId = ? ORDER BY signerOrder`,
      [credentialId]
    );

    // Check blockchain only if txHash exists
    let blockchainStatus = "NOT_SUBMITTED";
    let blockchainData = null;

    if (credential.txHash) {
      try {
        // Verify on blockchain
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const contract = new ethers.Contract(
          process.env.CONTRACT_ADDRESS,
          CONTRACT_ABI,
          provider
        );

        // Try to get credential from blockchain
        const onChainData = await contract.credentials(credentialId);
        
        if (onChainData && onChainData.studentPublicKey) {
          blockchainStatus = "VERIFIED";
          blockchainData = onChainData;
        } else {
          blockchainStatus = "PENDING"; // txHash exists but not confirmed yet
        }
      } catch (chainErr) {
        console.error("Blockchain check failed:", chainErr);
        blockchainStatus = "ERROR";
      }
    }

    // Determine overall status
    const allSigned = signers.every(s => s.signed === 1);
    let status = "PENDING";
    
    if (allSigned && credential.txHash && blockchainStatus === "VERIFIED") {
      status = "VERIFIED";
    } else if (allSigned && !credential.txHash) {
      status = "SIGNED_OFFCHAIN"; // All signed but not on blockchain yet
    } else if (allSigned) {
      status = "SIGNING_COMPLETE";
    }

    res.json({
      success: true,
      status: status,
      credential: {
        id: credential.credentialId,
        title: credential.title,
        student: credential.studentPublicKey,
        issuedAt: credential.issuedAt,
        txHash: credential.txHash,
        blockchainStatus: blockchainStatus
      },
      signers: signers.map(s => ({
        address: s.signerPublicKey,
        signed: s.signed === 1,
        signedAt: s.signedAt,
        isStudent: s.isStudent === 1
      }))
    });

  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Anchor signed credential to blockchain
// Add this to your server.js

app.post("/credential/anchor", async (req, res) => {
  console.log("📥 ANCHOR API HIT");
  
  try {
    const { credentialId } = req.body;

    if (!credentialId) {
      return res.status(400).json({
        success: false,
        message: "Missing credentialId"
      });
    }

    // Get credential data
    const [[credential]] = await db.query(
      `SELECT * FROM issued_credentials WHERE credentialId = ?`,
      [credentialId]
    );

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: "Credential not found"
      });
    }

    // Get all signed signers
    const [signers] = await db.query(
      `SELECT * FROM credential_signers 
       WHERE credentialId = ? AND signed = 1 
       ORDER BY signerOrder`,
      [credentialId]
    );

    if (signers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No signed signers found"
      });
    }

    console.log(`📋 Credential: ${credentialId}`);
    console.log(`✍️ Signed by ${signers.length} signers`);

    // Check if already anchored
    if (credential.txHash) {
      return res.json({
        success: true,
        message: "Already anchored",
        txHash: credential.txHash
      });
    }

    // Connect to blockchain
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    const contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      [
        "function issueCredential(string memory _credentialId, address _student, address[] memory _signers, string memory _metadata) external returns (bool)",
        "function credentials(string memory _credentialId) external view returns (address student, address[] memory signers, bool isValid, uint256 timestamp)"
      ],
      wallet
    );

    // Prepare data for blockchain
    const studentAddress = credential.studentPublicKey;
    const signerAddresses = signers.map(s => s.signerPublicKey);
    const metadata = JSON.stringify({
      title: credential.title,
      fileHash: credential.fileHash || "",
      issuedAt: credential.issuedAt
    });

    console.log("⛓️ Submitting to blockchain...");
    console.log("Student:", studentAddress);
    console.log("Signers:", signerAddresses);

    // Submit to blockchain
    const tx = await contract.issueCredential(
      credentialId,
      studentAddress,
      signerAddresses,
      metadata
    );

    console.log("⏳ Waiting for confirmation...");
    const receipt = await tx.wait();
    
    console.log("✅ Anchored! Tx:", receipt.hash);

    // Update database with txHash
    await db.query(
      `UPDATE issued_credentials 
       SET txHash = ?, status = 'completed' 
       WHERE credentialId = ?`,
      [receipt.hash, credentialId]
    );

    res.json({
      success: true,
      message: "Anchored successfully",
      txHash: receipt.hash
    });

  } catch (err) {
    console.error("❌ ANCHOR ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Anchor failed"
    });
  }
});

// Merge signatures into final PDF
// Keep ONLY this one mergeSignatures function (remove any other)
async function mergeSignatures(credentialId) {
  const { PDFDocument } = await import('pdf-lib');
  
  // Get original document
  const [[cred]] = await db.query(
    `SELECT filePath FROM issued_credentials WHERE credentialId = ?`,
    [credentialId]
  );

  // Get all signatures with their field positions
  const [signatures] = await db.query(
    `SELECT si.signatureImageUrl, sf.xRatio, sf.yRatio, sf.widthRatio, sf.heightRatio
     FROM signature_images si
     JOIN signature_fields sf ON si.signerPublicKey = sf.signerPublicKey
     WHERE si.credentialId = ? AND sf.credentialId = ?`,
    [credentialId, credentialId]
  );

  // Download original PDF
  const pdfResponse = await axios.get(cred.filePath, { 
    responseType: 'arraybuffer',
    timeout: 30000 
  });
  
  const pdfDoc = await PDFDocument.load(pdfResponse.data);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();

  // Add each signature
  for (const sig of signatures) {
    try {
      const imgResponse = await axios.get(sig.signatureImageUrl, { 
        responseType: 'arraybuffer',
        timeout: 30000 
      });
      
      const pngImage = await pdfDoc.embedPng(imgResponse.data);
      const x = sig.xRatio * width;
      const y = sig.yRatio * height;
      const w = sig.widthRatio * width;
      const h = sig.heightRatio * height;

      firstPage.drawImage(pngImage, { x, y, width: w, height: h });
      console.log(`✅ Embedded signature at (${x.toFixed(0)}, ${y.toFixed(0)})`);
    } catch (imgErr) {
      console.error("❌ Error embedding signature:", imgErr.message);
    }
  }

  // Save and upload final PDF
  const finalPdfBytes = await pdfDoc.save();
  const finalBuffer = Buffer.from(finalPdfBytes);

  const finalResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'final_documents',
        public_id: `${credentialId}_final_${Date.now()}`,
        resource_type: 'raw',
        format: 'pdf'
      },
      (error, result) => error ? reject(error) : resolve(result)
    );
    streamifier.createReadStream(finalBuffer).pipe(stream);
  });

  console.log("✅ Final document uploaded:", finalResult.secure_url);
  return finalResult.secure_url;
}


// server.js or routes.js


app.post("/biometric/verify-face", async (req, res) => {
  const { credentialId, signerPublicKey, faceImage, isSelfSign } = req.body;

  console.log("📥 VERIFY FACE REQUEST:", {
    credentialId,
    signerPublicKey,
    faceImageLength: faceImage?.length,
    isSelfSign,
  });

  if (!credentialId || !signerPublicKey || !faceImage) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }

  try {
    // ===============================
    // 1️⃣ Ensure secret exists
    // ===============================
    if (!process.env.BIOMETRIC_SECRET) {
      throw new Error("BIOMETRIC_SECRET not configured");
    }

    // ===============================
    // 2️⃣ Validate credential
    // ===============================
    const [[credential]] = await db.query(
      `SELECT * FROM issued_credentials WHERE credentialId = ?`,
      [credentialId]
    );

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: "Invalid credentialId",
      });
    }

    // Determine if self-sign
    const selfSign = isSelfSign || credential.signingType === "self";

    // ===============================
    // 3️⃣ Fetch biometric record (users or institutions)
    // ===============================
    let biometricRecord;

    if (selfSign) {
      // Self-sign: Get from users table
      const [[user]] = await db.query(
        `SELECT biometric_vector_encrypted,
                biometric_iv,
                biometric_salt
         FROM users
         WHERE walletPublicKey = ?`,
        [signerPublicKey]
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (!user.biometric_vector_encrypted) {
        return res.status(403).json({
          success: false,
          message: "Face biometric not enrolled for user",
        });
      }

      biometricRecord = user;

    } else {
      // Institution sign: Get from institutions table
      const [[institution]] = await db.query(
        `SELECT biometric_vector_encrypted,
                biometric_iv,
                biometric_salt
         FROM institutions
         WHERE walletPublicKey = ?`,
        [signerPublicKey]
      );

      if (!institution) {
        return res.status(404).json({
          success: false,
          message: "Institution not found",
        });
      }

      if (!institution.biometric_vector_encrypted) {
        return res.status(403).json({
          success: false,
          message: "Face biometric not enrolled for institution",
        });
      }

      biometricRecord = institution;
    }

    // ===============================
    // 4️⃣ Use RAW Buffers (IMPORTANT)
    // ===============================
    const encryptedVector = biometricRecord.biometric_vector_encrypted;
    const iv = biometricRecord.biometric_iv;
    const salt = biometricRecord.biometric_salt;

    console.log("Is encrypted buffer:", Buffer.isBuffer(encryptedVector));
    console.log("Is IV buffer:", Buffer.isBuffer(iv));
    console.log("Is salt buffer:", Buffer.isBuffer(salt));

    if (
      !Buffer.isBuffer(encryptedVector) ||
      !Buffer.isBuffer(iv) ||
      !Buffer.isBuffer(salt)
    ) {
      return res.status(500).json({
        success: false,
        message: "Biometric data format invalid",
      });
    }

    if (iv.length !== 16 || salt.length !== 16) {
      return res.status(500).json({
        success: false,
        message: "Invalid IV or salt length",
      });
    }

    // ===============================
    // 5️⃣ Derive AES key
    // ===============================
    const key = crypto.scryptSync(
      process.env.BIOMETRIC_SECRET,
      salt,
      32
    );

    // ===============================
    // 6️⃣ Decrypt
    // ===============================
    let decrypted;

    try {
      const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        key,
        iv
      );

      decrypted = Buffer.concat([
        decipher.update(encryptedVector),
        decipher.final(),
      ]).toString("utf8");

    } catch (error) {
      console.error("❌ Decryption failed:", error.message);

      return res.status(500).json({
        success: false,
        message: "Biometric decryption failed",
      });
    }

    // ===============================
    // 7️⃣ Parse vector
    // ===============================
    let storedVector;

    try {
      storedVector = JSON.parse(decrypted);
    } catch {
      return res.status(500).json({
        success: false,
        message: "Corrupted biometric data",
      });
    }

    if (!Array.isArray(storedVector) || storedVector.length !== 128) {
      return res.status(500).json({
        success: false,
        message: "Invalid biometric vector format",
      });
    }

    console.log("✅ Stored vector validated (128-D)");

    // ===============================
    // 8️⃣ Call Python service
    // ===============================
    const aiResponse = await axios.post(
      `${process.env.FACE_API_URL}/verify-face`,
      {
        image: faceImage,
        storedVector,
      },
      { timeout: 3000000 }
    );

    const { match, confidence } = aiResponse.data;

    console.log("📥 Python response:", aiResponse.data);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Face verification failed",
        confidence,
      });
    }

    // ===============================
    // ✅ SUCCESS
    // ===============================
    console.log("✅ FACE VERIFIED SUCCESSFULLY");

    return res.json({
      success: true,
      message: "Face verified successfully",
      confidence,
      credentialId,
      signerPublicKey,
    });

  } catch (err) {
    console.error("❌ VERIFY FACE SERVER ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error during face verification",
    });
  }
});

app.post("/biometric/fingerprint", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Missing data" });

  try {
    const fingerprintHash = crypto.createHash("sha256").update("fingerprint_" + Date.now()).digest("hex");
    await db.query(`UPDATE users SET biometric_type = ?, biometric_hash = ? WHERE email = ?`, ["fingerprint", fingerprintHash, email]);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Fingerprint error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================================
// 🎓 GET STUDENTS
// ==========================================================
app.get("/institution/getStudents", async (req, res) => {
  try {
    const [students] = await db.query("SELECT id, firstName, lastName, email, phone, walletPublicKey FROM users");
    res.json(students);
  } catch (err) {
    console.error("❌ Error fetching students:", err);
    res.status(500).json({ message: "Error fetching students" });
  }
});

// ==========================================================
// 🧾 MULTER UPLOAD (certificate)
// ==========================================================
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post("/institution/upload", upload.single("certificate"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No file uploaded" });

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "certificates",
          resource_type: "auto",
        },
        (error, result) => {
          if (result) resolve(result);
          else reject(error);
        }
      );

      stream.end(req.file.buffer);
    });

    res.json({
      message: "File uploaded successfully",
      filePath: result.secure_url,
    });

  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: "Upload failed" });
  }
});
// ==========================================================
// 🪶 ISSUE CREDENTIAL
// ==========================================================
app.post("/institution/issueCredential", async (req, res) => {
  console.log("📥 issueCredential API called");
  console.log("📦 Request body:", req.body);

  try {
    const {
      studentPublicKey,
      institutionPublicKey,
      credentialId,
      filePath,
      title,
      purpose,
      signingType, // self | sequential | parallel
      signers = [],
      signatureFields = [],
    } = req.body;

    /* ================= VALIDATION ================= */
    const isSelfSign = signingType === "self";

    if (
      !studentPublicKey ||
      !Array.isArray(institutionPublicKey) ||
      (!isSelfSign && institutionPublicKey.length === 0) ||
      !credentialId ||
      !filePath ||
      !signingType
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing or invalid required fields",
      });
    }

    /* ================= STUDENT CHECK (Always required) ================= */
    const [[student]] = await db.query(
      `SELECT id, COALESCE(walletAddress, walletPublicKey) AS wallet
       FROM users
       WHERE walletAddress = ? OR walletPublicKey = ?`,
      [studentPublicKey, studentPublicKey]
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student wallet not found in users table",
      });
    }

    /* ================= INSTITUTION CHECK (Skip for self-sign) ================= */
    if (!isSelfSign) {
      const placeholders = institutionPublicKey.map(() => "?").join(",");
      const [institutions] = await db.query(
        `SELECT walletPublicKey FROM institutions 
         WHERE walletPublicKey IN (${placeholders})`,
        institutionPublicKey
      );

      if (institutions.length !== institutionPublicKey.length) {
        return res.status(404).json({
          success: false,
          message: "One or more institution wallets not registered",
        });
      }
    }

    /* ================= FLOW LOGIC ================= */
    let finalSigners = [];

    if (signingType === "self") {
      // Self-sign: Student signs their own document
      // Verify student exists in users table (already done above)
      finalSigners = [
        {
          publicKey: studentPublicKey,
          order: 1,
          isStudent: true,
        },
      ];
    }

    else if (signingType === "sequential") {
      if (!signers.length) {
        return res.status(400).json({
          success: false,
          message: "Sequential flow requires ordered signers",
        });
      }
      finalSigners = signers.sort((a, b) => a.order - b.order);
    }

    else if (signingType === "parallel") {
      if (!signers.length) {
        return res.status(400).json({
          success: false,
          message: "Parallel flow requires signers",
        });
      }
      finalSigners = signers.map((s, index) => ({
        publicKey: s.publicKey,
        order: 0,
      }));
    }

    else {
      return res.status(400).json({
        success: false,
        message: "Invalid signingType",
      });
    }

    /* ================= BLOCKCHAIN ================= */
    const credentialHash = crypto
      .createHash("sha256")
      .update(student.wallet + credentialId + Date.now())
      .digest("hex");

    const blockchainTx = await issueCredential(student.wallet, credentialHash);
    console.log("🔗 Blockchain TX:", blockchainTx);

    /* ================= MASTER RECORD ================= */
    await db.query(
      `INSERT INTO issued_credentials
       (credentialId, studentPublicKey, institutionPublicKeys, signingType,
        title, filePath, purpose, status, issuedAt, txHash)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), ?)`,
      [
        credentialId,
        studentPublicKey,
        JSON.stringify(institutionPublicKey),
        signingType,
        title || "Credential",
        filePath,
        purpose || "",
        blockchainTx.txHash,
      ]
    );

    /* ================= INSERT SIGNERS ================= */
    for (const s of finalSigners) {
      await db.query(
        `INSERT INTO credential_signers
         (credentialId, studentPublicKey, institutionPublicKeys,
          signerPublicKey, signerOrder, signed, isStudent)
         VALUES (?, ?, ?, ?, ?, 0, ?)`,
        [
          credentialId,
          studentPublicKey,
          JSON.stringify(institutionPublicKey),
          s.publicKey,
          s.order,
          s.isStudent || false,
        ]
      );
    }

    /* ================= SIGNATURE FIELDS ================= */
    for (const field of signatureFields) {
      const xRatio = Number(field.xRatio);
      const yRatio = Number(field.yRatio);
      const widthRatio = Number(field.widthRatio);
      const heightRatio = Number(field.heightRatio);

      await db.query(
        `INSERT INTO signature_fields
         (credentialId, signerPublicKey, xRatio, yRatio, widthRatio, heightRatio,
          x_px, y_px, width_px, height_px, color, isStudent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          credentialId,
          field.signerPublicKey,
          Number.isFinite(xRatio) ? xRatio : 0,
          Number.isFinite(yRatio) ? yRatio : 0,
          Number.isFinite(widthRatio) ? widthRatio : 0,
          Number.isFinite(heightRatio) ? heightRatio : 0,
          0, 0, 0, 0,
          field.color || "blue",
          field.isStudent || false,
        ]
      );
    }

    /* ================= RESPONSE ================= */
    res.json({
      success: true,
      credentialId,
      signingType,
      totalSigners: finalSigners.length,
      txHash: blockchainTx.txHash,
      blockNumber: blockchainTx.blockNumber,
      etherscanLink: `https://sepolia.etherscan.io/tx/${blockchainTx.txHash}`,
    });

  } catch (error) {
    console.error("❌ issueCredential SERVER ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// ==========================================================
// 🧾 GET ISSUED CREDENTIALS (for student / publicKey)
// ==========================================================

app.post("/getIssuedCredentials", async (req, res) => {
  try {
    const { walletPublicKey } = req.body;

    if (!walletPublicKey) {
      return res.status(400).json({ success: false, message: "Missing walletPublicKey" });
    }

    // Step 1: Get all credentials (simple, no joins)
    const [allCreds] = await db.query(`SELECT * FROM issued_credentials ORDER BY issuedAt DESC`);

    // Step 2: Filter in JavaScript to avoid collation issues
    const credentials = allCreds.filter(c => {
      const studentMatch = c.studentPublicKey?.toLowerCase() === walletPublicKey.toLowerCase();
      
      let instMatch = false;
      try {
        const instKeys = JSON.parse(c.institutionPublicKeys || '[]');
        instMatch = instKeys.some(k => k.toLowerCase() === walletPublicKey.toLowerCase());
      } catch(e) {}
      
      return studentMatch || instMatch;
    });

    if (!credentials.length) {
      return res.json({ success: true, data: [] });
    }

    const credentialIds = credentials.map(c => c.credentialId);

    // Step 3: Get signers for these credentials
    const [allSigners] = await db.query(`SELECT * FROM credential_signers`);
    const signers = allSigners.filter(s => credentialIds.includes(s.credentialId));

    // Step 4: Get names
    const [allUsers] = await db.query(`SELECT walletPublicKey, firstName, lastName FROM users`);
    const [allInst] = await db.query(`SELECT walletPublicKey, institutionName FROM institutions`);

    const nameMap = {};
    allUsers.forEach(u => {
      nameMap[u.walletPublicKey?.toLowerCase()] = `${u.firstName} ${u.lastName}`;
    });
    allInst.forEach(i => {
      nameMap[i.walletPublicKey?.toLowerCase()] = i.institutionName;
    });

    // Format response
    const data = credentials.map(c => {
      const credSigners = signers.filter(s => s.credentialId === c.credentialId);
      
      return {
        credentialId: c.credentialId,
        title: c.title,
        purpose: c.purpose,
        filePath: c.filePath,
        status: c.status,
        signingType: c.signingType,
        issuedAt: c.issuedAt,
        txHash: c.txHash,
        studentPublicKey: c.studentPublicKey,
        
        // Issuer is student who created it
        issuerName: c.studentPublicKey?.toLowerCase() === walletPublicKey.toLowerCase() 
          ? "You (Self)" 
          : "Student",
        
        // Signers with names
        signers: credSigners.map(s => ({
          signerPublicKey: s.signerPublicKey,
          signerOrder: s.signerOrder,
          signed: s.signed === 1,
          isStudent: s.isStudent === 1,
          name: nameMap[s.signerPublicKey?.toLowerCase()] || (s.isStudent ? "Student" : `Institution ${s.signerOrder}`),
          isYou: s.signerPublicKey?.toLowerCase() === walletPublicKey.toLowerCase()
        }))
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error("❌ getIssuedCredentials error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==========================================================
// 🧾 GET SINGLE ISSUED CREDENTIAL
// ==========================================================
// Make sure to import db properly at top
// const db = require('./db'); or your setup

app.get("/issuedCredential/:credentialId", async (req, res) => {
  try {
    const { credentialId } = req.params;
    console.log("📥 Fetch issued credential:", credentialId);

    // Get credential from issued_credentials (master table)
    const [[credential]] = await db.query(
      `SELECT * FROM issued_credentials WHERE credentialId = ?`,
      [credentialId]
    );

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: "Credential not found",
      });
    }

    // Get signature fields
    const [signatureFields] = await db.query(
      `SELECT signerPublicKey,
              xRatio, yRatio, widthRatio, heightRatio,
              color, isStudent
       FROM signature_fields
       WHERE credentialId = ?`,
      [credentialId]
    );

    // Get signers from credential_signers (clean schema - no duplicate columns)
    const [signers] = await db.query(
      `SELECT signerPublicKey, signerOrder, signed, isStudent
       FROM credential_signers
       WHERE credentialId = ?
       ORDER BY signerOrder`,
      [credentialId]
    );

    // Parse JSON fields if needed
    const institutionPublicKeys = credential.institutionPublicKeys
      ? JSON.parse(credential.institutionPublicKeys)
      : [];

    res.json({
      success: true,
      data: {
        credentialId: credential.credentialId,
        title: credential.title,
        filePath: credential.filePath,
        purpose: credential.purpose,
        status: credential.status,
        signingType: credential.signingType,
        studentPublicKey: credential.studentPublicKey,
        institutionPublicKeys: institutionPublicKeys,
        txHash: credential.txHash,
        issuedAt: credential.issuedAt,
        signatureFields,
        signers,
        // Add any other fields needed by frontend
      },
    });
  } catch (err) {
    console.error("❌ issuedCredential error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/credential/status/:credentialId", async (req, res) => {
  const { credentialId } = req.params;

  const [signers] = await db.query(
    `SELECT signerPublicKey, signerOrder, signed
     FROM credential_signers
     WHERE credentialId = ?
     ORDER BY signerOrder`,
    [credentialId]
  );

  res.json({
    success: true,
    signers,
  });
});



// ==========================================================
// 🚀 START SERVER
// ==========================================================
app.listen(5000, () => console.log("✅ Server running on http://localhost:5000"));