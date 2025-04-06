import React, { useState, useEffect } from "react";
import axios from "axios";
import { ethers } from "ethers";
import "./index.css";

const contractAddress = "0x1119731e98897d8aeAFC7C93a0f2747f3370965f";
const contractABI = require("./EduSpendingTrackerABI.json");

function App() {
  const [selectedEntity, setSelectedEntity] = useState("government");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [recipient, setRecipient] = useState("");
  const [fiatLogs, setFiatLogs] = useState([]);
  const [onChainLogs, setOnChainLogs] = useState([]);
  const [selectedTx, setSelectedTx] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastTransactionId, setLastTransactionId] = useState(null);
  const [loading, setLoading] = useState(false); // New loading state

  const entities = {
    government: { name: "Government", address: "0x3118E24391693A8431AF6c44bd85C89d7a26BF36" },
    school: { name: "School", address: "0x1703d946BEb0eF13d34DC367C024f0421F405C7B" },
    hospital: { name: "Hospital", address: "0x4439B0f955085a518244f3Ce31d472Ea629e370d" },
    ministry: { name: "Ministry", address: "0xE0B8e857b834aDF28a868acF43dA7e0d6A9239c4" },
  };
  const explorerUrl = "https://opencampus-codex.blockscout.com/tx/";

  useEffect(() => {
    const fetchOnChainLogs = async () => {
      try {
        const provider = new ethers.JsonRpcProvider("https://rpc.open-campus-codex.gelato.digital/");
        const contract = new ethers.Contract(contractAddress, contractABI.abi, provider);
        const filter = contract.filters.TransactionAdded();
        const events = await contract.queryFilter(filter, 0, "latest");
        const logs = events.map((event) => ({
          hash: event.transactionHash,
          entity: event.args.sender, // Use sender from event
          recipient: event.args.recipient,
          amount: ethers.formatUnits(event.args.amount, 0),
          purpose: event.args.purpose,
          currency: event.args.currency,
          timestamp: new Date(Number(event.args.timestamp) * 1000).toISOString(),
          displayTimestamp: new Date(Number(event.args.timestamp) * 1000).toLocaleString(),
          transactionId: event.args.transactionId,
        }));
        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setOnChainLogs(logs);
      } catch (error) {
        console.error("Fetch on-chain logs error:", error.message);
      }
    };
    fetchOnChainLogs();

    if (fiatLogs.length === 0) {
      setFiatLogs([
        { id: 1, amount: "100", from: "Government", to: "School", purpose: "Education", currency: "USD", timestamp: "2025-04-02 10:00" },
      ]);
    }
  }, []);

  const sendFiatTransaction = async () => {
    if (!recipient || !entities[recipient]) {
      alert("Please select a valid recipient");
      return;
    }
    setLoading(true); // Start loading
    try {
      const response = await axios.post("http://localhost:3001/transfer", {
        from: entities[selectedEntity].address,
        to: entities[recipient].address,
        amount,
        purpose,
        currency: "USD",
      });
      const { senderTxHash, receiverTxHash, transactionId } = response.data;

      const timestamp = new Date().toISOString();
      const displayTimestamp = new Date().toLocaleString();

      const newFiatLog = { id: Date.now(), amount, from: entities[selectedEntity].name, to: entities[recipient].name, purpose, currency: "USD", timestamp: displayTimestamp };
      const newOnChainLogSender = {
        hash: senderTxHash,
        entity: entities[selectedEntity].address,
        recipient: entities[recipient].address,
        amount,
        purpose,
        currency: "USD",
        timestamp,
        displayTimestamp,
        transactionId,
      };
      const newOnChainLogReceiver = {
        hash: receiverTxHash,
        entity: entities[recipient].address,
        recipient: entities[selectedEntity].address,
        amount,
        purpose: `Received: ${purpose}`,
        currency: "USD",
        timestamp,
        displayTimestamp,
        transactionId,
      };

      setFiatLogs([newFiatLog, ...fiatLogs]);
      setOnChainLogs((prevLogs) => {
        const updatedLogs = [newOnChainLogSender, newOnChainLogReceiver, ...prevLogs];
        updatedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return updatedLogs;
      });
      setLastTransactionId(transactionId);
      setShowSuccessModal(true);
      setAmount("");
      setPurpose("");
      setRecipient("");
    } catch (error) {
      console.error("Error:", error.message);
      const errorMsg = error.response?.data?.details || error.response?.data?.error || error.message;
      alert(`Transaction failed: ${errorMsg}`);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const openTxModal = (tx) => setSelectedTx(tx);
  const closeTxModal = () => setSelectedTx(null);
  const closeSuccessModal = () => setShowSuccessModal(false);

  const getEntityDisplay = (address) => {
    const entity = Object.values(entities).find((e) => e.address === address);
    return entity ? `${entity.name} (${entity.address.slice(0, 6)}...)` : `${address.slice(0, 6)}...`;
  };

  return (
    <div className="app-container">
      <div className="tagline">Transparent Funding, Powered by EDU Chain</div>
      <div className="entity-selector">
        <label htmlFor="entity">Select Entity:</label>
        <select id="entity" value={selectedEntity} onChange={(e) => setSelectedEntity(e.target.value)}>
          {Object.keys(entities).map((key) => (
            <option key={key} value={key}>{entities[key].name}</option>
          ))}
        </select>
      </div>

      <div className="dashboard">
        <h1>{entities[selectedEntity].name} Dashboard (Address: {entities[selectedEntity].address.slice(0, 6)}...)</h1>
        <div className="metrics">
          <div className="metric-box">
            <h3>Total Sent</h3>
            <p>{fiatLogs.filter(log => log.from === entities[selectedEntity].name).reduce((sum, log) => sum + parseFloat(log.amount), 0)} USD</p>
          </div>
          <div className="metric-box">
            <h3>Total Received</h3>
            <p>{fiatLogs.filter(log => log.to === entities[selectedEntity].name).reduce((sum, log) => sum + parseFloat(log.amount), 0)} USD</p>
          </div>
          <div className="metric-box">
            <h3>Address</h3>
            <p>{entities[selectedEntity].address.slice(0, 6)}...</p>
          </div>
        </div>

        <div className="form">
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (USD)" />
          <input type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Purpose" />
          <select value={recipient} onChange={(e) => setRecipient(e.target.value)}>
            <option value="">Select Recipient</option>
            {Object.keys(entities).filter(key => key !== selectedEntity).map((key) => (
              <option key={key} value={key}>{entities[key].name}</option>
            ))}
          </select>
          <button onClick={sendFiatTransaction} disabled={loading}>
            {loading ? (
            <span className="spinner"></span>
            ) : (
            "Send"
            )}
          </button>
        </div>

        <div className="logs-container">
          <div className="log-section">
            <h2>Fiat Transaction History</h2>
            <div className="log-list">
              {fiatLogs
                .filter((log) => log.from === entities[selectedEntity].name || log.to === entities[selectedEntity].name)
                .map((log) => (
                  <div
                    key={log.id}
                    className={`log-item ${log.from === entities[selectedEntity].name ? "sent" : "received"}`}
                    onClick={() => openTxModal({ ...log, type: "fiat" })}
                  >
                    <p><strong>Amount:</strong> {log.amount} {log.currency}</p>
                    <p><strong>From:</strong> {log.from}</p>
                    <p><strong>To:</strong> {log.to}</p>
                    <p><strong>Purpose:</strong> {log.purpose}</p>
                    <p><strong>Date:</strong> {log.timestamp}</p>
                  </div>
                ))}
            </div>
          </div>

          <div className="log-section">
            <h2>On-Chain Transactions</h2>
            <div className="timeline">
              {onChainLogs
                .filter((log) => 
                  (log.entity === entities[selectedEntity].address && !log.purpose.startsWith("Received:")) || // Sender logs
                  (log.entity === entities[selectedEntity].address && log.purpose.startsWith("Received:"))    // Receiver logs
                )
                .map((log) => (
                  <div key={log.hash} className="timeline-item" onClick={() => openTxModal({ ...log, type: "onchain" })}>
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <p><strong>{log.purpose}</strong></p>
                      <p>
                        {log.purpose.startsWith("Received:") 
                          ? `Received ${log.amount} ${log.currency} from ${getEntityDisplay(log.recipient)}`
                          : `Sent ${log.amount} ${log.currency} to ${getEntityDisplay(log.recipient)}`
                        }
                      </p>
                      <p>{log.displayTimestamp}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {selectedTx && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{selectedTx.type === "fiat" ? "Fiat Transaction Details" : "On-Chain Transaction Details"}</h3>
            <p><strong>Amount:</strong> {selectedTx.amount} {selectedTx.currency}</p>
            {selectedTx.type === "fiat" ? (
              <>
                <p><strong>From:</strong> {selectedTx.from}</p>
                <p><strong>To:</strong> {selectedTx.to}</p>
              </>
            ) : (
              <>
                <p><strong>Sender:</strong> 
                  {selectedTx.purpose.startsWith("Received:") 
                    ? getEntityDisplay(selectedTx.recipient) 
                    : getEntityDisplay(selectedTx.entity)}
                </p>
                <p><strong>Recipient:</strong> 
                  {selectedTx.purpose.startsWith("Received:") 
                    ? getEntityDisplay(selectedTx.entity) 
                    : getEntityDisplay(selectedTx.recipient)}
                </p>
                <p><strong>Tx Hash:</strong> {selectedTx.hash}</p>
                <a href={`${explorerUrl}${selectedTx.hash}`} target="_blank" rel="noopener noreferrer">
                  View on Block Explorer
                </a>
              </>
            )}
            <p><strong>Purpose:</strong> {selectedTx.purpose}</p>
            <p><strong>Date:</strong> {selectedTx.displayTimestamp || selectedTx.timestamp}</p>
            <button onClick={closeTxModal}>Close</button>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal success-modal">
            <div className="success-icon">✔</div>
            <h3>Transaction Successful!</h3>
            <p>Transaction ID: {lastTransactionId.slice(0, 10)}...</p>
            <button onClick={closeSuccessModal}>Awesome!</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
