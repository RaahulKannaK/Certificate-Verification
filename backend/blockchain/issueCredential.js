// blockchain/issueCredential.js
import { ethers, isAddress } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

/* ─────────────────────────────── */
/* 📁 Resolve current directory    */
/* ─────────────────────────────── */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ─────────────────────────────── */
/* 📜 Load Contract ABI            */
/* ─────────────────────────────── */
const contractPath = path.resolve(
  __dirname,
  "./artifacts/contracts/CredentialRegistry.sol/CredentialRegistry.json"
);

const contractJson = JSON.parse(fs.readFileSync(contractPath, "utf8"));
const contractABI = contractJson.abi;

/* ─────────────────────────────── */
/* 🔗 Blockchain Setup             */
/* ─────────────────────────────── */
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const wallet = new ethers.Wallet(
  process.env.PRIVATE_KEY,
  provider
);

const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  contractABI,
  wallet
);

/* ─────────────────────────────── */
/* 🚀 Issue Credential Function    */
/* ─────────────────────────────── */
/**
 * Issues a credential on blockchain
 * @param {string} studentWallet Ethereum wallet address of student
 * @param {string} credentialHash SHA256 or any unique string
 * @returns {Promise<{txHash: string, blockNumber: number}>}
 */
export default async function issueCredential(studentWallet, credentialHash) {
  console.log("📥 issueCredential (blockchain) called");
  console.log("🎓 Student wallet:", studentWallet);
  console.log("🧾 Credential hash input:", credentialHash);

  try {
    /* ✅ Validate Ethereum address */
    if (!isAddress(studentWallet)) {
      throw new Error("Invalid Ethereum address: " + studentWallet);
    }

    /* ✅ Convert hash → bytes32 */
    const hashBytes32 = credentialHash.startsWith("0x")
      ? credentialHash
      : ethers.keccak256(ethers.toUtf8Bytes(credentialHash));

    console.log("🔐 Bytes32 hash:", hashBytes32);

    /* ✅ Send transaction */
    const tx = await contract.issueCredential(
      hashBytes32,
      studentWallet
    );

    console.log("📤 Transaction sent:", tx.hash);

    /* ✅ Wait for confirmation */
    const receipt = await tx.wait();

    console.log(
      "✅ Credential issued on blockchain | Block:",
      receipt.blockNumber
    );

    return {
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    };

  } catch (error) {
    console.error("❌ issueCredential blockchain ERROR:", error);
    throw error;
  }
}
