import { useState, useEffect } from "react";

export default function ConnectWallet() {
  const [account, setAccount] = useState<string | null>(null);

  const connect = async () => {
    if (!(window as any).ethereum) {
      alert("Please, install MetaMask for using this marketplace!");
      return;
    }
    try {
      const accounts = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);
    } catch (err) {
      console.error("Wallet connection rejected", err);
    }
  };

  // ⚡ Tenta la connessione automatica al mount
  useEffect(() => {
    if (!(window as any).ethereum) return;

    (async () => {
      try {
        const accounts = await (window as any).ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) setAccount(accounts[0]);
      } catch (err) {
        console.error("Errore durante il check account", err);
      }
    })();
  }, []);

  return (
    <div className="mb-4">
      {account ? (
        <p className="text-gray-600">Connected: {account}</p>
      ) : (
        <button
          onClick={connect}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:cursor-pointer"
        >
          Connect your wallet
        </button>
      )}
    </div>
  );
}
