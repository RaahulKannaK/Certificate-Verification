const express = require("express");
const router = express.Router();
const { ethers } = require("ethers");
const Credential = require("../models/Credential"); // adjust path

/* ================================
   STEP 1: PROVIDE MESSAGE TO SIGN
================================ */

router.get("/sign-message/:credentialId", async (req, res) => {
  const { credentialId } = req.params;

  const credential = await Credential.findOne({ credentialId });
  if (!credential) {
    return res.status(404).json({ error: "Credential not found" });
  }

  const message = `I, the owner of this wallet, sign certificate ${credentialId}`;

  res.json({ message });
});

/* ================================
   STEP 2: VERIFY SIGNATURE
================================ */

router.post("/verify-signature", async (req, res) => {
  const { credentialId, signature, walletAddress, message } = req.body;

  const credential = await Credential.findOne({ credentialId });
  if (!credential) {
    return res.status(404).json({ error: "Credential not found" });
  }

  // Recover wallet from signature
  const recoveredAddress = ethers.verifyMessage(message, signature);

  // Check wallet ownership
  if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  // Check wallet matches registered student wallet
  if (walletAddress.toLowerCase() !== credential.studentWallet.toLowerCase()) {
    return res.status(403).json({ error: "Unauthorized wallet" });
  }

  // Mark as signed
  credential.signed = true;
  credential.signature = signature;
  credential.signedBy = walletAddress;
  credential.signedAt = new Date();

  await credential.save();

  res.json({ message: "Certificate signed successfully" });
});

module.exports = router;
