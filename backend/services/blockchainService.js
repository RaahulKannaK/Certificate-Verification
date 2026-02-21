import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

// Connect to the blockchain (Sepolia network)
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// Admin wallet (Institution deployer wallet)
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Contract ABI — functions defined in your Solidity contract
const contractABI = [
  "function issueCredential(address student, string memory credentialHash) public",
  "function verifyCredential(address student) public view returns (string memory)"
];

// Contract instance
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  contractABI,
  wallet
);

// 🪶 Issue credential on blockchain
export async function issueOnBlockchain(studentWallet, credentialHash) {
  try {
    console.log("🧾 Issuing credential on blockchain...");
    const tx = await contract.issueCredential(studentWallet, credentialHash);
    console.log("🔗 Transaction hash:", tx.hash);
    await tx.wait(); // wait for confirmation
    console.log("✅ Credential recorded on blockchain!");
    return tx.hash;
  } catch (err) {
    console.error("❌ Blockchain transaction failed:", err);
    throw new Error(err.message);
  }
}

// 🧠 Verify credential from blockchain
export async function verifyOnBlockchain(studentWallet) {
  try {
    const hash = await contract.verifyCredential(studentWallet);
    console.log("✅ Verified credential hash:", hash);
    return hash;
  } catch (err) {
    console.error("❌ Verification error:", err);
    throw new Error(err.message);
  }
}
