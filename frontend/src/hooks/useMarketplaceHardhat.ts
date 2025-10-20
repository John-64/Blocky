import { useEffect, useState, useCallback } from "react";
import { ethers, type Signer, type BrowserProvider, type Contract } from "ethers";
import marketplaceAbi from "/Users/gianni/Progetti/Blocky/artifacts/contracts/Marketplace.sol/Marketplace.json";
import deployedAddresses from "/Users/gianni/Progetti/Blocky/ignition/deployments/chain-31337/deployed_addresses.json";

// Definizione dei tipi per chiarezza e type safety
interface MarketplaceHook {
  provider: BrowserProvider | null;
  signer: Signer | null;
  contract: Contract | null;
  account: string | null;
  connectWallet: () => Promise<void>;
  isReady: boolean;
}

// Dati di configurazione per la rete locale di Hardhat
const HARDHAT_NETWORK = {
  chainId: "0x7a69", // 31337 in esadecimale
  chainName: "Hardhat Localhost",
  rpcUrls: ["http://127.0.0.1:8545"],
  nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
};

/**
 * Hook personalizzato per interagire con il contratto Marketplace
 * sulla rete locale di Hardhat.
 */
export function useHardhatMarketplace(): MarketplaceHook {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [account, setAccount] = useState<string | null>(null);

  /**
   * Tenta di passare MetaMask alla rete Hardhat. Se la rete non è
   * presente, chiede all'utente di aggiungerla.
   */
  const switchOrAddNetwork = useCallback(async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: HARDHAT_NETWORK.chainId }],
      });
    } catch (switchError: any) {
      // Codice 4902 indica che la rete non è stata aggiunta a MetaMask.
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [HARDHAT_NETWORK],
          });
        } catch (addError) {
          console.error("Errore nell'aggiungere la rete Hardhat:", addError);
        }
      } else {
        console.error("Errore nel cambio di rete:", switchError);
      }
    }
  }, []);

  /**
   * Inizializza le istanze di ethers.js (provider, signer, contratto)
   * dopo aver ottenuto l'account dell'utente.
   */
  const initEthers = useCallback(
    async (currentProvider: BrowserProvider, currentAccount: string) => {
      try {
        const contractAddress = deployedAddresses["MarketplaceModule#Marketplace"];
        const userSigner = await currentProvider.getSigner(currentAccount);
        const marketplaceContract = new ethers.Contract(
          contractAddress,
          marketplaceAbi.abi,
          userSigner
        );

        setProvider(currentProvider);
        setSigner(userSigner);
        setContract(marketplaceContract);
        setAccount(currentAccount);
      } catch (error) {
        console.error("Errore durante l'inizializzazione di Ethers:", error);
        // Resetta lo stato in caso di errore
        setAccount(null);
        setContract(null);
        setSigner(null);
      }
    },
    []
  );

  /**
   * Gestisce la connessione del portafoglio. Chiede il permesso all'utente,
   * passa alla rete corretta e inizializza Ethers.
   */
  const connectWallet = useCallback(async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      alert("Installa MetaMask per usare questo marketplace!");
      return;
    }

    try {
      await switchOrAddNetwork();

      const accounts: string[] = await ethereum.request({
        method: "eth_requestAccounts",
      });
      const browserProvider = new ethers.BrowserProvider(ethereum);
      
      if (accounts.length > 0) {
        await initEthers(browserProvider, accounts[0]);
      }
    } catch (err) {
      console.error("Connessione wallet rifiutata o errore:", err);
    }
  }, [initEthers, switchOrAddNetwork]);

  /**
   * Effetto principale per gestire lo stato di connessione e i cambiamenti di account.
   */
  useEffect(() => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    // Funzione per provare a riconnettersi automaticamente al caricamento della pagina
    const autoConnect = async () => {
      await switchOrAddNetwork(); // Assicura che la rete sia corretta all'avvio
      const browserProvider = new ethers.BrowserProvider(ethereum);
      const accounts = await browserProvider.listAccounts();
      if (accounts.length > 0) {
        await initEthers(browserProvider, accounts[0].address);
      }
    };
    
    autoConnect();

    // Listener per quando l'utente cambia account in MetaMask
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        const browserProvider = new ethers.BrowserProvider(ethereum);
        initEthers(browserProvider, accounts[0]);
      } else {
        // Disconnessione
        setAccount(null);
        setSigner(null);
        setContract(null);
      }
    };

    ethereum.on("accountsChanged", handleAccountsChanged);

    // Funzione di pulizia per rimuovere il listener
    return () => {
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [initEthers, switchOrAddNetwork]);

  return {
    provider,
    signer,
    contract,
    account,
    connectWallet,
    isReady: !!contract && !!account, // Un comodo booleano per sapere se tutto è pronto
  };
}