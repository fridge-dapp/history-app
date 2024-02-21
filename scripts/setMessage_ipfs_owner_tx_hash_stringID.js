const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const hre = require("hardhat");
const moment = require("moment");
const {
  encryptDataField,
  decryptNodeResponse,
} = require("@swisstronik/swisstronik.js");

const JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIwYTJlMjhjMS0xZDZhLTRjYmMtOGNmMi02YzY1YjA4YWJkOTYiLCJlbWFpbCI6Im5pbmpoYWNrYXRob25AZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siaWQiOiJGUkExIiwiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjF9LHsiaWQiOiJOWUMxIiwiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjF9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImRjNDlhNDcwZDU1NWI0ODdiYjY1Iiwic2NvcGVkS2V5U2VjcmV0IjoiMDE5M2E3MGVlZmU1NzdmOThiNTUwNzhjZWJkNzc4YjA1ZmZiNGQ1MjJjYzhiYTFkNTZiMzg2ZDE2YzIzMTMzYiIsImlhdCI6MTcwMTE4MjA4MH0.Fsj0QMbRGmf0Bd2yN58SbTwuhiKB7Da79bHZM4SNKUg";

const pinFileToIPFS = async () => {
  const formData = new FormData();
  const src = "./data-real.json";

  const file = fs.createReadStream(src);
  formData.append("file", file);

  const pinataMetadata = JSON.stringify({
    name: "File name",
  });
  formData.append("pinataMetadata", pinataMetadata);

  const pinataOptions = JSON.stringify({
    cidVersion: 0,
  });
  formData.append("pinataOptions", pinataOptions);

  try {
    const res = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        maxBodyLength: "Infinity",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
          Authorization: `Bearer ${JWT}`,
        },
      }
    );
    return res.data.IpfsHash;
  } catch (error) {
    console.log(error);
  }
};

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
  const contractAddress = "0x5eB8fc64E489fF63470814438bfbE3782309F484";
  const [signer] = await hre.ethers.getSigners();
  const contractFactory = await hre.ethers.getContractFactory("FridgeStringID");
  const contract = contractFactory.attach(contractAddress);
  const functionName = "saveDataBatch";

  const ipfsHash = await pinFileToIPFS();
  const url_ipfsHash = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

  const data = fs.readFileSync("./data-real.json", "utf8");
  const jsonData = JSON.parse(data);

  //const _timestamp = new Date(jsonData.date);
  const _time = moment(jsonData.date);
  const _timestamp = _time.unix();

  console.log("TIMESTAMP: ", _timestamp);

  const dataToSend = [
    {
      fridge_id: jsonData.idToSet,
      timestamp: _timestamp,
      uploader: signer.address,
      ipfsHash: url_ipfsHash,
      txHash: "Filler hash for the first transaction",
    },
  ];
  console.log("DATA:", dataToSend);

  const setMessageTx = await sendShieldedTransaction(
    signer,
    contractAddress,
    contract.interface.encodeFunctionData(functionName, [dataToSend]),
    0
  );
  await setMessageTx.wait();
  console.log("Transaction Receipt: ", setMessageTx);
  console.log("Transaction Hash: ", setMessageTx.hash);

  const dataToSendTxHash = [
    {
      fridge_id: jsonData.idToSet,
      timestamp: _timestamp,
      uploader: signer.address,
      ipfsHash: url_ipfsHash,
      txHash: setMessageTx.hash,
    },
  ];

  console.log("DATA:", dataToSendTxHash);

  const setMessageTxHash = await sendShieldedTransaction(
    signer,
    contractAddress,
    contract.interface.encodeFunctionData(functionName, [dataToSendTxHash]),
    0
  );
  await setMessageTxHash.wait();
  console.log("Transaction Receipt: ", setMessageTxHash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
