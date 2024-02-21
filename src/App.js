import "./App.css";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import FridgeIPFS from "./artifacts/contracts/FridgeStringID.sol/FridgeStringID.json";
import {
  encryptDataField,
  decryptNodeResponse,
} from "@swisstronik/swisstronik.js";

const myContractAddress = "0x5eB8fc64E489fF63470814438bfbE3782309F484";

const allowed_wallets = [
  "0x50E06E0c40E8fD3BA29B3cc515E693101f96FfB4",
  "0x28511486999394a04856506737bFa9AA15d90c53",
  "0x0c1889D0173642D88705546241987F5CCc4d9F56",
];

const sendShieldedQuery = async (provider, destination, data) => {
  const rpclink = "https://json-rpc.testnet.swisstronik.com/";
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

function App() {
  const [fridgeId, setFridgeId] = useState("");
  const [fridgeData, setFridgeData] = useState([]);
  const [buttonClicked, setButtonClicked] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);

  useEffect(() => {
    const connectWallet = async () => {
      if (typeof window.ethereum !== "undefined") {
        await window.ethereum.request({ method: "eth_requestAccounts" });

        const address = window.ethereum.selectedAddress;
        setWalletAddress(address);
      }
    };

    connectWallet();
  }, []);

  const fetchFridgeData = async () => {
    if (typeof window.ethereum !== "undefined") {
      await window.ethereum.request({ method: "eth_requestAccounts" });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        myContractAddress,
        FridgeIPFS.abi,
        provider
      );

      const functionName = "getAllDataByMultipleUploaders";
      const functionCallData = contract.interface.encodeFunctionData(
        functionName,
        [allowed_wallets, fridgeId]
      );

      const responseMessage = await sendShieldedQuery(
        provider,
        myContractAddress,
        functionCallData
      );

      const decodedResponse = contract.interface.decodeFunctionResult(
        functionName,
        responseMessage
      );

      const data = decodedResponse[0].map((item) => {
        const timestamp = Number(item.timestamp);
        const date = new Date(timestamp * 1000);

        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();

        const formattedDate = `${day}/${month}/${year}`;

        /*
        const hours = date.getHours();
        const minutes = date.getMinutes();

        const hoursFormatted = hours.toString().padStart(2, "0");
        const minutesFormatted = minutes.toString().padStart(2, "0");

        const formattedTime = `${hoursFormatted}:${minutesFormatted}`;
        */

        return {
          date: formattedDate,
          //time: formattedTime,
          ipfsHash: item.ipfsHash,
          txHash: item.txHash,
        };
      });

      const filteredData = data.filter(
        (item) => item.txHash !== "Filler hash for the first transaction"
      );

      const groupedData = filteredData.reduce((groups, item) => {
        const date = item.date;
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(item);
        return groups;
      }, {});

      setFridgeData(groupedData);
      setButtonClicked(true);
    }
  };

  return (
    <div className="App">
      <div className="App-header">
        <div className="wallet-status">
          <p>
            Wallet Address:{" "}
            {walletAddress
              ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
              : "Not connected"}
          </p>
        </div>
        <div className="app-info">
          <h1>Fridge Data Dapp</h1>
          <h2>Your Fridge, Your Data: Monitor with Confidence</h2>
        </div>
        <div className="input-field">
          <input
            placeholder="Fridge Id"
            onChange={(e) => {
              let value = e.target.value;
              setFridgeId(value);
            }}
            className="input-field"
          />
        </div>

        <button onClick={() => fetchFridgeData()} className="button">
          Fetch the Fridge's History
        </button>
        {buttonClicked && Object.keys(fridgeData).length === 0 ? (
          <p className="message">This fridge has no data submitted yet.</p>
        ) : (
          Object.entries(fridgeData).map(([date, data], index) => (
            <div key={index} className="data-container">
              <h2 className="date-header">Date: {date}</h2>
              <div className="container">
                {data.map((item, index) => (
                  <div key={index} className="item-container">
                    <div className="Categories">
                      <p>
                        {item.ipfsHash.startsWith("https") ? (
                          <b>ipfsHash</b>
                        ) : (
                          <b>Technical Support Summary</b>
                        )}
                        : {item.ipfsHash}
                      </p>
                      <p>
                        <b>Tx Hash: </b>
                        {item.txHash}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
