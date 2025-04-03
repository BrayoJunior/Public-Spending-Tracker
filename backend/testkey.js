require("dotenv").config({ path: "C:/Users/pc/Documents/EDU/.env" }); // Point to parent directory
const { ethers } = require("ethers");

console.log("ADMIN_PRIVATE_KEY:", process.env.ADMIN_PRIVATE_KEY);
console.log("Length:", process.env.ADMIN_PRIVATE_KEY.length);
console.log("PRIVATE_KEY:", process.env.PRIVATE_KEY);
console.log("PRIVATE_KEY_RECEIVER:", process.env.PRIVATE_KEY_RECEIVER);

try {
  const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY);
  console.log("Address:", wallet.address);
} catch (e) {
  console.error("Error:", e);
}