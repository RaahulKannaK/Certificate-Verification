const mongoose = require("mongoose");

const signatureSchema = new mongoose.Schema({
  signerId: String,
  signerRole: String,
  publicKey: String,
  signature: String,
  signedAt: Date
});

const credentialSchema = new mongoose.Schema({
  credentialId: {
    type: String,
    required: true,
    unique: true
  },
  issuedBy: {
    type: String, // institutionId
    required: true
  },
  issuedFor: {
    type: String, // studentId
    required: true
  },
  flowType: {
    type: String,
    enum: ["self", "sequential", "parallel"],
    required: true
  },
  requiredSigners: [String],
  signatures: [signatureSchema],
  status: {
    type: String,
    enum: ["pending", "partially_signed", "completed"],
    default: "pending"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Credential", credentialSchema);