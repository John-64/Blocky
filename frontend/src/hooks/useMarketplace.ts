import { useEffect, useState } from "react";
import { ethers } from "ethers";
import abi from "/Users/gianni/Progetti/Blocky/artifacts/contracts/Marketplace.sol/Marketplace.json";
import deployedAddresses from "/Users/gianni/Progetti/Blocky/ignition/deployments/chain-31337/deployed_addresses.json";

export function useMarketplace() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  useEffect(() => {
    const init = async () => {
      if ((window as any).ethereum) {
        const address = deployedAddresses["MarketplaceModule#Marketplace"];

        const p = new ethers.BrowserProvider((window as any).ethereum);
        const s = await p.getSigner();
        const c = new ethers.Contract(address, abi.abi, s);
        setProvider(p);
        setSigner(s);
        setContract(c);
      }
    };
    init();
  }, []);

  return { provider, signer, contract };
}