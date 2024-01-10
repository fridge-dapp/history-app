import "./App.css";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import FridgeIPFS from "./artifacts/contracts/FridgeSensorsIPFS.sol/FridgeIPFS.json";
import {
  encryptDataField,
  decryptNodeResponse,
} from "@swisstronik/swisstronik.js";

const myContractAddress = "0x035c35f4cC4806Cc3FEbB16c0843eFfF761BbdC7";

const sendShieldedQuery = async (provider, destination, data) => {
  const rpclink = "https://json-rpc.testnet.swisstronik.com/"; //URL of the RPC node for Swisstronik.
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
  const [fridgeId, setFridgeId] = useState(0);
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

      const functionName = "getAllData";
      const functionCallData = contract.interface.encodeFunctionData(
        functionName,
        [fridgeId]
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
        const date = new Date(timestamp * 1000); // Convert the timestamp to milliseconds

        const day = date.getDate();
        const month = date.getMonth() + 1; // Months are 0-based in JavaScript
        const year = date.getFullYear();

        const formattedDate = `${day}/${month}/${year}`;

        return {
          date: formattedDate,
          ipfsHash: item.ipfsHash,
        };
      });

      // Group the data by date
      const groupedData = data.reduce((groups, item) => {
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
            type="number"
            min="0"
            placeholder="Fridge Id"
            onChange={(e) => {
              let value = e.target.value;
              if (value < 0) {
                value = 0;
              }
              setFridgeId(value);
            }}
            className="input-field"
          />
        </div>

        <button onClick={() => fetchFridgeData()} className="button">
          Fetch the Fridge's Sensors History
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
                    <div className="ipfsHash">
                      <p>
                        {item.ipfsHash.startsWith("https")
                          ? "ipfsHash"
                          : "Technical Support Summary"}
                        : {item.ipfsHash}
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
