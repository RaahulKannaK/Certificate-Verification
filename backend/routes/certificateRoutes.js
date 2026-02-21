import express from "express";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/uploadCertificate", upload.single("file"), async (req, res) => {
  try {
    const fileUrl = req.file.path;  // Cloudinary URL

    // Save fileUrl in DB
    // Example:
    // await Certificate.create({ filePath: fileUrl });

    res.json({ success: true, fileUrl });

  } catch (error) {
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;