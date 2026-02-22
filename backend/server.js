// backend/server.js
import crypto from "crypto";
import axios from "axios";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import streamifier from "streamifier";
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
  origin: ["http://localhost:8080"],
  methods: ["GET", "POST", "PUT", "DELETE"],
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

// ==========================================================
// 🧩 SIGNUP
// ==========================================================
app.post("/signup", async (req, res) => {
  const { name, email, phone, age, role, walletPublicKey, walletPrivateKeyEncrypted } = req.body;
  console.log("Signup payload:", req.body);

  if (!name || !email || !role || !walletPublicKey || !walletPrivateKeyEncrypted) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    if (role === "institution") {
      const [result] = await db.query(
        `INSERT INTO institutions 
         (institutionName, email, phone, walletPublicKey, walletPrivateKeyEncrypted)
         VALUES (?, ?, ?, ?, ?)`,
        [name, email, phone || null, walletPublicKey, walletPrivateKeyEncrypted]
      );
      console.log("Institution inserted ID:", result.insertId);
      return res.status(201).json({ message: "🏛️ Institution registered successfully" });
    }

    // Student / Worker
    const [firstName, ...lastParts] = name.trim().split(" ");
    const lastName = lastParts.join(" ") || "";

    await db.query(
      `INSERT INTO users
       (firstName, lastName, age, phone, email, role, walletPublicKey, walletPrivateKeyEncrypted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [firstName, lastName, age || null, phone || null, email, role, walletPublicKey, walletPrivateKeyEncrypted]
    );

    res.status(201).json({ message: "🎓 User signup successful" });
  } catch (err) {
    console.error("❌ Signup Error:", err.sqlMessage || err);
    res.status(500).json({ message: err.sqlMessage || "Server error" });
  }
});

// ==========================================================
// 🔐 LOGIN
// ==========================================================
app.post("/login", async (req, res) => {
  const { publicKey } = req.body;
  if (!publicKey) return res.status(400).json({ message: "Public key is required" });

  try {
    // Try student first
    const [userRows] = await db.query(
      "SELECT id, firstName, lastName, age, phone, email, role, walletPublicKey FROM users WHERE walletPublicKey = ?",
      [publicKey]
    );

    if (userRows.length) return res.json({ message: "✅ Login successful!", user: userRows[0] });

    // Try institution
    const [instRows] = await db.query(
      "SELECT id, institutionName AS firstName, '' AS lastName, null AS age, phone, email, 'institution' AS role, walletPublicKey FROM institutions WHERE walletPublicKey = ?",
      [publicKey]
    );

    if (instRows.length) return res.json({ message: "✅ Login successful!", user: instRows[0] });

    return res.status(404).json({ message: "User or institution not found" });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ message: "Server error during login" });
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
      "https://unvertically-pottier-cordelia.ngrok-free.dev/extract-face",
      { image },
      { timeout: 100000 }
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
  const { credentialId, signerPublicKey, faceImage } = req.body;

  // ---------------------- Validation ----------------------
  if (!credentialId || !signerPublicKey || !faceImage) {
    return res.status(400).json({ success: false, message: "Missing data: credentialId, signerPublicKey, and faceImage are required" });
  }

  try {
    // ---------------------- 1️⃣ Fetch user's biometric ----------------------
    const [[institution]] = await db.query(
      `SELECT biometric_vector_encrypted, biometric_iv, biometric_salt
      FROM institutions
      WHERE walletPublicKey = ?`,
      [signerPublicKey]
    );

    if (!institution || !institution.biometric_vector_encrypted) {
      return res.status(403).json({
        success: false,
        message: "Biometric not enrolled for this institution",
      });
    }


    if (!user || !user.biometric_vector_encrypted) {
      return res.status(403).json({ success: false, message: "Biometric not enrolled for this user" });
    }

    // ---------------------- 2️⃣ Decrypt biometric vector ----------------------
    const salt = Buffer.from(user.biometric_salt, "hex");
    const iv = Buffer.from(user.biometric_iv, "hex");
    const encryptedVector = Buffer.from(user.biometric_vector_encrypted, "hex");

    const key = crypto.scryptSync(process.env.BIOMETRIC_SECRET || "bio_secret", salt, 32);
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedVector), decipher.final()]);
    const storedVector = Array.from(decrypted);

    // ---------------------- 3️⃣ Face verification ----------------------
    const aiResponse = await axios.post("https://unvertically-pottier-cordelia.ngrok-free.dev/verify-face", {
      image: faceImage,
      storedVector,
    });

    const { match, confidence } = aiResponse.data;

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Face verification failed — not matched",
        confidence,
      });
    }

    // ---------------------- 4️⃣ Fetch credential & signer ----------------------
    const [[credential]] = await db.query(
      `SELECT signingType FROM issued_credentials WHERE credentialId = ?`,
      [credentialId]
    );

    if (!credential) return res.status(404).json({ success: false, message: "Credential not found" });

    const [[signer]] = await db.query(
      `SELECT * FROM credential_signers
       WHERE credentialId = ? AND signerPublicKey = ?`,
      [credentialId, signerPublicKey]
    );

    if (!signer) return res.status(403).json({ success: false, message: "Signer not authorized" });
    if (signer.signed) return res.json({ success: false, message: "Already signed" });

    // ---------------------- 5️⃣ Sequential signing check ----------------------
    if (credential.signingType === "sequential") {
      const [[nextSigner]] = await db.query(
        `SELECT signerOrder FROM credential_signers
         WHERE credentialId = ? AND signed = 0
         ORDER BY signerOrder LIMIT 1`,
        [credentialId]
      );

      if (nextSigner.signerOrder !== signer.signerOrder) {
        return res.status(403).json({ success: false, message: "Not your turn to sign" });
      }
    }

    // ---------------------- 6️⃣ Mark signer as signed ----------------------
    await db.query(
      `UPDATE credential_signers
       SET signed = 1, updatedAt = NOW()
       WHERE credentialId = ? AND signerPublicKey = ?`,
      [credentialId, signerPublicKey]
    );

    const [[pending]] = await db.query(
      `SELECT COUNT(*) AS cnt
       FROM credential_signers
       WHERE credentialId = ? AND signed = 0`,
      [credentialId]
    );

    if (pending.cnt === 0) {
      await db.query(
        `UPDATE issued_credentials
         SET status = 'completed'
         WHERE credentialId = ?`,
        [credentialId]
      );
    }

    // ---------------------- 7️⃣ Success response ----------------------
    res.json({
      success: true,
      message: "Signed successfully with biometric face verification",
      confidence,
    });
  } catch (err) {
    console.error("❌ Biometric sign error:", err.message || err);
    res.status(500).json({ success: false, message: "Server error occurred" });
  }
});


// server.js or routes.js


app.post("/biometric/verify-face", async (req, res) => {
  const { credentialId, signerPublicKey, faceImage } = req.body;

  console.log("📥 VERIFY FACE REQUEST:", {
    credentialId,
    signerPublicKey,
    faceImageLength: faceImage?.length,
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
      `SELECT id FROM issued_credentials WHERE credentialId = ?`,
      [credentialId]
    );

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: "Invalid credentialId",
      });
    }

    // ===============================
    // 3️⃣ Fetch biometric record
    // ===============================
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
        message: "Face biometric not enrolled",
      });
    }

    // ===============================
    // 4️⃣ Use RAW Buffers (IMPORTANT)
    // ===============================
    const encryptedVector = institution.biometric_vector_encrypted;
    const iv = institution.biometric_iv;
    const salt = institution.biometric_salt;

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
      "https://unvertically-pottier-cordelia.ngrok-free.dev/verify-face",
      {
        image: faceImage,
        storedVector,
      },
      { timeout: 10000 }
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
      signingType,
      signers,
      signatureFields = [],
    } = req.body;

    /* ================= VALIDATION ================= */
    if (
      !studentPublicKey ||
      !Array.isArray(institutionPublicKey) ||
      institutionPublicKey.length === 0 ||
      !credentialId ||
      !filePath ||
      !signingType
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing or invalid required fields",
      });
    }

    /* ================= STUDENT CHECK ================= */
    const [[student]] = await db.query(
      `SELECT id, COALESCE(walletAddress, walletPublicKey) AS wallet
       FROM users
       WHERE walletAddress = ? OR walletPublicKey = ?`,
      [studentPublicKey, studentPublicKey]
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student wallet not found",
      });
    }

    /* ================= INSTITUTION CHECK ================= */
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

    /* ================= SIGNERS ================= */
    for (const s of signers) {
      await db.query(
        `INSERT INTO credential_signers
         (credentialId, studentPublicKey, institutionPublicKeys,
          signerPublicKey, signerOrder, signed)
         VALUES (?, ?, ?, ?, ?, 0)`,
        [
          credentialId,
          studentPublicKey,
          JSON.stringify(institutionPublicKey),
          s.publicKey,
          s.order,
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
         (
           credentialId,
           signerPublicKey,
           xRatio,
           yRatio,
           widthRatio,
           heightRatio,
           x_px,
           y_px,
           width_px,
           height_px,
           color
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          credentialId,
          field.signerPublicKey,

          // 🚨 NEVER INSERT NaN
          Number.isFinite(xRatio) ? xRatio : 0,
          Number.isFinite(yRatio) ? yRatio : 0,
          Number.isFinite(widthRatio) ? widthRatio : 0,
          Number.isFinite(heightRatio) ? heightRatio : 0,

          0,
          0,
          0,
          0,

          field.color || "blue",
        ]
      );
    }

    /* ================= RESPONSE ================= */
    res.json({
      success: true,
      credentialId,
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
      return res.status(400).json({
        success: false,
        message: "Missing walletPublicKey",
      });
    }

    const [credentials] = await db.query(
      `SELECT id, credentialId, title, filePath, purpose, status,
              signingType, txHash, institutionPublicKeys
       FROM issued_credentials
       WHERE JSON_CONTAINS(institutionPublicKeys, JSON_QUOTE(?))
       ORDER BY issuedAt DESC`,
      [walletPublicKey]
    );

    if (!credentials.length) {
      return res.json({ success: true, data: [] });
    }

    const credentialIds = credentials.map(c => c.credentialId);

    const [fields] = await db.query(
      `SELECT credentialId, signerPublicKey,
              xRatio, yRatio, widthRatio, heightRatio,
              color
       FROM signature_fields
       WHERE credentialId IN (${credentialIds.map(() => "?").join(",")})`,
      credentialIds
    );

    const data = credentials.map(c => ({
      ...c,
      signatureFields: fields.filter(f => f.credentialId === c.credentialId),
    }));

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

    const [signatureFields] = await db.query(
      `SELECT signerPublicKey,
              xRatio, yRatio, widthRatio, heightRatio,
              color
       FROM signature_fields
       WHERE credentialId = ?`,
      [credentialId]
    );

    const [signers] = await db.query(
      `SELECT signerPublicKey, signerOrder, signed
       FROM credential_signers
       WHERE credentialId = ?
       ORDER BY signerOrder`,
      [credentialId]
    );

    res.json({
      success: true,
      data: {
        ...credential,
        signatureFields,
        signers,
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
