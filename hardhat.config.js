require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); 

module.exports = {
  solidity: "0.8.0",
  networks: {
    eduChainTestnet: {
      url: "https://rpc.open-campus-codex.gelato.digital/", 
      chainId: 656476,      
      accounts: [process.env.PRIVATE_KEY],
      timeout: 60000, 
      gas: "auto",
      gasPrice: "auto"
    }
  }
};