const hre = require("hardhat");
const {
  encryptDataField,
  decryptNodeResponse,
} = require("@swisstronik/swisstronik.js");

const sendShieldedQuery = async (provider, destination, data) => {
  const rpclink = hre.network.config.url;
  const [encryptedData, usedEncryptedKey] = await encryptDataField(
    rpclink,
    data
  );
  const response = await provider.call({
    to: destination,
    data: encryptedData,
  });
  return await decryptNodeResponse(rpclink, response, usedEncryptedKey);
};

async function main() {
  const contractAddress = "0xb07D4Cdc19d22a5Aaa3364c4eA0FeeBBcE2412d2";
  const [signer] = await hre.ethers.getSigners();
  const contractFactory = await hre.ethers.getContractFactory(
    "FridgeIPFSOwnerTxHash"
  );
  const contract = contractFactory.attach(contractAddress);
  const functionName = "getAllDataByMultipleUploaders";
  const idToSet = "2";
  const allowed_wallets = [
    "0x50E06E0c40E8fD3BA29B3cc515E693101f96FfB4",
    "0x28511486999394a04856506737bFa9AA15d90c53",
    "0x0c1889D0173642D88705546241987F5CCc4d9F56",
  ];

  // Encode the function call
  const functionCallData = contract.interface.encodeFunctionData(functionName, [
    allowed_wallets, // New argument: the array of uploaders' addresses
    idToSet,
  ]);

  // Send the shielded query
  const responseMessage = await sendShieldedQuery(
    signer.provider,
    contractAddress,
    functionCallData
  );

  // Decode the response
  const decodedResponse = contract.interface.decodeFunctionResult(
    functionName,
    responseMessage
  );

  console.log("DECODED RESPONSE: ", decodedResponse);

  // Iterate through the array of SensorData
  for (const data of decodedResponse[0]) {
    const ipfsHash = data.ipfsHash;
    const txHash = data.txHash;
    if (txHash !== "Filler hash for the first transaction") {
      console.log("ipfsHash:", [ipfsHash]);
      console.log("txHash:", [txHash]);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
