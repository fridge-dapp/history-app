const hre = require("hardhat");
const fs = require("fs");
const {
  encryptDataField,
  decryptNodeResponse,
} = require("@swisstronik/swisstronik.js");

const sendShieldedTransaction = async (signer, destination, data, value) => {
  const rpclink = hre.network.config.url;
  const [encryptedData] = await encryptDataField(rpclink, data);
  return await signer.sendTransaction({
    from: signer.address,
    to: destination,
    data: encryptedData,
    value,
  });
};

async function main() {
  const contractAddress = "0x035c35f4cC4806Cc3FEbB16c0843eFfF761BbdC7";
  const [signer] = await hre.ethers.getSigners();
  const contractFactory = await hre.ethers.getContractFactory("FridgeIPFS");
  const contract = contractFactory.attach(contractAddress);
  const functionName = "saveDataBatch";

  // Read data from JSON file
  const data = fs.readFileSync("./data-IPFS.json", "utf8");
  const jsonData = JSON.parse(data);

  // Prepare the array of data to be sent
  const dataToSend = jsonData.data.map((item) => {
    return {
      fridge_id: parseInt(item.idToSet),
      ipfsHash: item.url,
    };
  });

  const setMessageTx = await sendShieldedTransaction(
    signer,
    contractAddress,
    contract.interface.encodeFunctionData(functionName, [dataToSend]),
    0
  );
  await setMessageTx.wait();
  console.log("Transaction Receipt: ", setMessageTx);
  console.log("Transaction Hash: ", setMessageTx.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
