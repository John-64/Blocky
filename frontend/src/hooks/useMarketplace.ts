import { useEffect, useState, useCallback } from "react";
import { ethers, type Signer } from "ethers"; 
// Assicurati che questi percorsi siano corretti nel tuo progetto
import abi from "/Users/gianni/Progetti/Blocky/artifacts/contracts/Marketplace.sol/Marketplace.json";
import deployedAddresses from "/Users/gianni/Progetti/Blocky/ignition/deployments/chain-31337/deployed_addresses.json";

export function useMarketplace() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [account, setAccount] = useState<string | null>(null);

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
  
  // Funzione per connettere/richiedere l'account (chiamata dal componente ConnectWallet)
  const connectWallet = useCallback(async () => {
    if (!(window as any).ethereum) {
        alert("Installa MetaMask per usare questo marketplace!");
        return;
    }
    
    try {
        const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
        const p = new ethers.BrowserProvider((window as any).ethereum);
        setProvider(p);
        
        if (accounts.length > 0) {
            await initEthers(p, accounts[0]);
        }
        
    } catch (err) {
        console.error("Connessione wallet rifiutata", err);
    }
  }, [initEthers]);
  

  useEffect(() => {
    // 1. Inizializzazione e check account esistente
    const initialCheck = async () => {
        if ((window as any).ethereum) {
            const p = new ethers.BrowserProvider((window as any).ethereum);
            setProvider(p);

            const accounts = await p.listAccounts();
            if (accounts.length > 0) {
                // Se c'è un account già connesso, inizializza contratto e signer
                await initEthers(p, accounts[0].address); 
            }
        }
    };
    initialCheck();

    // 2. Sottoscrizione al cambio account (fondamentale)
    if ((window as any).ethereum) {
        const handleAccountsChanged = (accounts: string[]) => {
            if (accounts.length > 0) {
                // L'account è cambiato, re-inizializza
                const p = new ethers.BrowserProvider((window as any).ethereum);
                initEthers(p, accounts[0]);
            } else {
                // Disconnessione
                setAccount(null);
                setSigner(null);
                setContract(null);
            }
        };

        (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
        
        // Pulizia listener al dismount
        return () => {
            (window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged);
        };
    }
  }, [initEthers]);

  // Espone l'account e la funzione per connettersi
  return { provider, signer, contract, account, connectWallet };
}