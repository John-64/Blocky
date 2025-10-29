import { useEffect, useState, useCallback } from "react";
import { ethers, type Signer } from "ethers"; 
import abi from "/Users/gianni/Progetti/Blocky/artifacts/contracts/Marketplace.sol/Marketplace.json";
import deployedAddresses from "/Users/gianni/Progetti/Blocky/ignition/deployments/chain-80002/deployed_addresses.json";

export function useMarketplace() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [account, setAccount] = useState<string | null>(null);

  const AMOY_NETWORK = {
    chainId: "0x13882",
    chainName: "Amoy",
    rpcUrls: ["https://polygon-amoy.infura.io/v3/48ac5909913246b989505d1191478b39"],
    nativeCurrency: { name: "Polkadot Token", symbol: "POL", decimals: 18 },
    blockExplorerUrls: ["https://amoy.polygonscan.com"]
    };

  const switchToAmoy = useCallback(async () => {
    if (!(window as any).ethereum) return;

    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: AMOY_NETWORK.chainId }]
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: "wallet_addEthereumChain",
            params: [AMOY_NETWORK]
          });
        } catch (addError) {
          console.error("Errore nell'aggiungere la rete Amoy:", addError);
        }
      } else {
        console.error("Errore nel cambio rete:", switchError);
      }
    }
  }, []);

  const initEthers = useCallback(async (currentProvider: ethers.BrowserProvider, currentAccount: string) => {
    try {
      const address = deployedAddresses["MarketplaceModule#Marketplace"];
      const s = await currentProvider.getSigner(currentAccount);
      const c = new ethers.Contract(address, abi.abi, s);

      setSigner(s);
      setContract(c);
      setAccount(currentAccount);
    } catch (error) {
      console.error("Errore nell'inizializzazione di Ethers:", error);
      setAccount(null);
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (!(window as any).ethereum) {
      alert("Installa MetaMask per usare questo marketplace!");
      return;
    }

    try {
      await switchToAmoy();

      const accounts: string[] = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
      const p = new ethers.BrowserProvider((window as any).ethereum);
      setProvider(p);

      if (accounts.length > 0) {
        await initEthers(p, accounts[0]);
      }
    } catch (err) {
      console.error("Connessione wallet rifiutata o errore:", err);
    }
  }, [initEthers, switchToAmoy]);

  useEffect(() => {
    const initialCheck = async () => {
      if ((window as any).ethereum) {
        await switchToAmoy();
        const p = new ethers.BrowserProvider((window as any).ethereum);
        setProvider(p);

        const accounts = await p.listAccounts();
        if (accounts.length > 0) {
          await initEthers(p, accounts[0].address);
        }
      }
    };
    initialCheck();

    if ((window as any).ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          const p = new ethers.BrowserProvider((window as any).ethereum);
          initEthers(p, accounts[0]);
        } else {
          setAccount(null);
          setSigner(null);
          setContract(null);
        }
      };

      (window as any).ethereum.on("accountsChanged", handleAccountsChanged);

      return () => {
        (window as any).ethereum.removeListener("accountsChanged", handleAccountsChanged);
      };
    }
  }, [initEthers, switchToAmoy]);

  const buyItem = useCallback(async (itemId: number, priceInEth: string) => {
    if (!contract || !signer) return;

    try {
      const tx = await contract.buyItem(itemId, { value: ethers.parseEther(priceInEth) });
      await tx.wait();
      console.log("Articolo comprato!");
    } catch (err) {
      console.error("Errore acquisto:", err);
    }
  }, [contract, signer]);

  return { provider, signer, contract, account, connectWallet, buyItem };
}
