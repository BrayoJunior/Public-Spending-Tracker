require("dotenv").config({ path: "C:/Users/pc/Documents/EDU/.env" });
const { ethers } = require("ethers");
const express = require("express");
const app = express();
const cors = require("cors");
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000" }));

const contractAddress = "0x1119731e98897d8aeAFC7C93a0f2747f3370965f";
const rpcUrl = "https://rpc.open-campus-codex.gelato.digital/";
const provider = new ethers.JsonRpcProvider(rpcUrl);

const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
const adminWallet = new ethers.Wallet(adminPrivateKey, provider);

const keyStore = {
  "0x3118E24391693A8431AF6c44bd85C89d7a26BF36": process.env.PRIVATE_KEY,
  "0x1703d946BEb0eF13d34DC367C024f0421F405C7B": process.env.PRIVATE_KEY_RECEIVER,
  "0x4439B0f955085a518244f3Ce31d472Ea629e370d": process.env.PRIVATE_KEY_HOSPITAL,
  "0xE0B8e857b834aDF28a868acF43dA7e0d6A9239c4": process.env.PRIVATE_KEY_MINISTRY,
};

// Extract the 'abi' array from the artifact JSON
const contractArtifact = require("../frontend/src/EduSpendingTrackerABI.json");
const contractABI = contractArtifact.abi;

async function logTransaction(entity, amount, recipient, purpose, currency, transactionId) {
  const contract = new ethers.Contract(contractAddress, contractABI, adminWallet);

  const entityNames = {
    "0x3118E24391693A8431AF6c44bd85C89d7a26BF36": "Government",
    "0x1703d946BEb0eF13d34DC367C024f0421F405C7B": "School",
    "0x4439B0f955085a518244f3Ce31d472Ea629e370d": "Hospital",
    "0xE0B8e857b834aDF28a868acF43dA7e0d6A9239c4": "Ministry",
  };
  const senderName = entityNames[entity] || "Unknown";
  const recipientName = entityNames[recipient] || "Unknown";

  try {
    const gasEstimate = await contract.addTransaction.estimateGas(
      ethers.toBigInt(amount),
      recipient,
      purpose,
      currency,
      transactionId,
      senderName,
      recipientName
    );
    const gasLimit = gasEstimate * BigInt(15) / BigInt(10); // 50% buffer

    const tx = await contract.addTransaction(
      ethers.toBigInt(amount),
      recipient,
      purpose,
      currency,
      transactionId,
      senderName,
      recipientName,
      { gasPrice: ethers.parseUnits("10", "gwei"), gasLimit }
    );
    const receipt = await tx.wait();
    console.log(`Logged transaction for ${entity}: ${receipt.hash}`);
    return receipt.hash;
  } catch (error) {
    console.error(`Failed to log transaction for ${entity}:`, error.message);
    throw error;
  }
}

app.post("/transfer", async (req, res) => {
  const { from, to, amount, purpose, currency } = req.body;
  const transactionId = ethers.hexlify(ethers.randomBytes(32));

  console.log("Processing transfer:", { from, to, amount, purpose, currency });

  try {
    await provider.getNetwork();
    const senderTxHash = await logTransaction(from, amount, to, purpose, currency, transactionId);
    const receiverTxHash = await logTransaction(to, amount, from, `Received: ${purpose}`, currency, transactionId);
    res.status(200).json({ senderTxHash, receiverTxHash, transactionId });
  } catch (error) {
    console.error("Transfer error:", error.message, error.stack);
    res.status(500).json({ error: "Failed to process transaction", details: error.message });
  }
});

app.listen(3001, () => console.log("Backend running on http://localhost:3001"));