import { ethers } from "ethers";
import MarketplaceABI from "/Users/gianni/Progetti/Blocky/artifacts/contracts/Marketplace.sol/Marketplace.json";

export const MARKETPLACE_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// Tipo per il listing del nuovo contratto
export interface Listing {
  id: bigint;
  seller: string;
  buyer: string;
  metadataURI: string;
  price: bigint;
  createdAt: bigint;
  purchasedAt: bigint;
  timeoutDuration: bigint;
  sold: boolean;
  released: boolean;
  disputed: boolean;
  cancelled: boolean;
}

// Tipo per il frontend (con dati parsed)
export interface ListingDisplay {
  id: string;
  seller: string;
  buyer: string;
  metadataURI: string;
  price: string; // In ETH
  priceWei: string; // In Wei
  createdAt: Date;
  purchasedAt: Date | null;
  timeoutDays: number;
  sold: boolean;
  released: boolean;
  disputed: boolean;
  cancelled: boolean;
  isActive: boolean;
}

export async function getMarketplaceContract() {
  if (!(window as any).ethereum) {
    throw new Error("MetaMask non trovato. Installa MetaMask per continuare.");
  }

  // Richiedi connessione a MetaMask
  await (window as any).ethereum.request({ method: "eth_requestAccounts" });

  const provider = new ethers.BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();

  // Verifica che l'indirizzo sia un contratto
  const code = await provider.getCode(MARKETPLACE_ADDRESS);
  if (code === "0x") {
    throw new Error(`L'indirizzo ${MARKETPLACE_ADDRESS} NON punta a un contratto deployato`);
  }

  // Istanzia il contratto
  const contract = new ethers.Contract(
    MARKETPLACE_ADDRESS,
    MarketplaceABI.abi,
    signer
  );

  return contract;
}

// Ottieni il contratto in sola lettura (senza signer, più veloce)
export async function getMarketplaceContractReadOnly() {
  if (!(window as any).ethereum) {
    throw new Error("MetaMask non trovato");
  }

  const provider = new ethers.BrowserProvider((window as any).ethereum);
  
  const contract = new ethers.Contract(
    MARKETPLACE_ADDRESS,
    MarketplaceABI.abi,
    provider
  );

  return contract;
}

// Ottieni tutti i listing (anche venduti/cancellati)
export async function fetchAllListings(): Promise<ListingDisplay[]> {
  const contract = await getMarketplaceContractReadOnly();
  
  const count: bigint = await contract.listingCount();
  console.log("📊 Totale listing:", count.toString());

  if (count === 0n) {
    console.log("⚠️ Nessun listing trovato nel contratto");
    return [];
  }

  const listings: ListingDisplay[] = [];

  // Itera da 1 a count (gli ID partono da 1)
  for (let i = 1n; i <= count; i++) {
    try {
      const listing: Listing = await contract.getListing(i);
      listings.push(parseListingForDisplay(listing));
    } catch (error) {
      console.error(`Errore nel caricamento del listing ${i}:`, error);
    }
  }

  return listings;
}

// Ottieni solo i listing attivi (non venduti, non cancellati)
export async function fetchActiveListings(): Promise<ListingDisplay[]> {
  const contract = await getMarketplaceContractReadOnly();
  
  const activeIds: bigint[] = await contract.getActiveListings();
  console.log("📋 Listing attivi:", activeIds.length);

  if (activeIds.length === 0) {
    return [];
  }

  const listings: ListingDisplay[] = [];

  for (const id of activeIds) {
    try {
      const listing: Listing = await contract.getListing(id);
      listings.push(parseListingForDisplay(listing));
    } catch (error) {
      console.error(`Errore nel caricamento del listing ${id}:`, error);
    }
  }

  return listings;
}

// Ottieni un singolo listing
export async function fetchListing(id: string | number): Promise<ListingDisplay> {
  const contract = await getMarketplaceContractReadOnly();
  const listing: Listing = await contract.getListing(id);
  return parseListingForDisplay(listing);
}

// Crea un nuovo listing
export async function createListing(
  metadataURI: string,
  priceInEth: string,
  timeoutDays: number
) {
  const contract = await getMarketplaceContract();
  
  const priceWei = ethers.parseEther(priceInEth);
  const timeoutSeconds = timeoutDays * 24 * 60 * 60;

  const tx = await contract.createListing(metadataURI, priceWei, timeoutSeconds);
  console.log("⏳ Transazione inviata:", tx.hash);
  
  const receipt = await tx.wait();
  console.log("✅ Listing creato! Block:", receipt.blockNumber);
  
  return receipt;
}

// Acquista un listing
export async function buyListing(listingId: string | number, priceInWei: string) {
  const contract = await getMarketplaceContract();
  
  const tx = await contract.buyListing(listingId, { value: priceInWei });
  console.log("⏳ Acquisto in corso:", tx.hash);
  
  const receipt = await tx.wait();
  console.log("✅ Acquisto completato! Block:", receipt.blockNumber);
  
  return receipt;
}

// Conferma consegna
export async function confirmDelivery(listingId: string | number) {
  const contract = await getMarketplaceContract();
  
  const tx = await contract.confirmDelivery(listingId);
  console.log("⏳ Conferma in corso:", tx.hash);
  
  const receipt = await tx.wait();
  console.log("✅ Consegna confermata! Block:", receipt.blockNumber);
  
  return receipt;
}

// Apri disputa
export async function openDispute(listingId: string | number) {
  const contract = await getMarketplaceContract();
  
  const tx = await contract.openDispute(listingId);
  console.log("⏳ Apertura disputa:", tx.hash);
  
  const receipt = await tx.wait();
  console.log("⚠️ Disputa aperta! Block:", receipt.blockNumber);
  
  return receipt;
}

// Cancella listing (solo seller)
export async function cancelListing(listingId: string | number) {
  const contract = await getMarketplaceContract();
  
  const tx = await contract.cancelListing(listingId);
  console.log("⏳ Cancellazione in corso:", tx.hash);
  
  const receipt = await tx.wait();
  console.log("✅ Listing cancellato! Block:", receipt.blockNumber);
  
  return receipt;
}

// Helper: converte il listing dal contratto in formato display
function parseListingForDisplay(listing: Listing): ListingDisplay {
  const isActive = !listing.sold && !listing.cancelled;
  
  return {
    id: listing.id.toString(),
    seller: listing.seller,
    buyer: listing.buyer,
    metadataURI: listing.metadataURI,
    price: ethers.formatEther(listing.price),
    priceWei: listing.price.toString(),
    createdAt: new Date(Number(listing.createdAt) * 1000),
    purchasedAt: listing.purchasedAt > 0n 
      ? new Date(Number(listing.purchasedAt) * 1000) 
      : null,
    timeoutDays: Number(listing.timeoutDuration) / (24 * 60 * 60),
    sold: listing.sold,
    released: listing.released,
    disputed: listing.disputed,
    cancelled: listing.cancelled,
    isActive
  };
}

// Helper: ottieni l'indirizzo dell'utente connesso
export async function getConnectedAddress(): Promise<string> {
  if (!(window as any).ethereum) {
    throw new Error("MetaMask non trovato");
  }

  const provider = new ethers.BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();
  return signer.address;
}