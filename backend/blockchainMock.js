// Mock Blockchain Smart Contract Functions
const blockchain = [];

function generateMockTx() {
  return "0x" + Math.random().toString(16).substr(2, 8);
}

function issueCredential(studentId, credentialHash) {
  const txHash = generateMockTx();
  blockchain.push({ studentId, credentialHash, txHash });
  console.log(`Issued credential for ${studentId} | TX: ${txHash}`);
  return { txHash, status: "signed" };
}

function verifyCredential(credentialHash) {
  const record = blockchain.find(b => b.credentialHash === credentialHash);
  return record ? { verified: true, txHash: record.txHash } : { verified: false };
}

module.exports = { issueCredential, verifyCredential };
