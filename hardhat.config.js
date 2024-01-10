require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.19",
  paths: {
    artifacts: "./src/artifacts",
  },
  networks: {
    swisstronik: {
      url: "https://json-rpc.testnet.swisstronik.com/", //URL of the RPC node for Swisstronik.
      accounts: [
        "0x05e091895db132fd8548fa2b08e1293b7a2401758eadc4e641b656733f245e9e",
      ], //Your private key starting with "0x"
      //Make sure you have enough funds in this wallet to deploy the smart contract
      // 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --> ??
      // 0xe756ae687e78c5ddf8a2b5e79ee1f53da01984625ced62c6953a0cb5ccf1f48d --> Original Sw
      // 0x05e091895db132fd8548fa2b08e1293b7a2401758eadc4e641b656733f245e9e --> Account 1
    },
  },
};
