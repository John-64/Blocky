import { ethers } from "ethers";
import fs from "fs";

// IMPORTANTE: Sostituisci con l'indirizzo del tuo contratto deployato
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// ABI minimo necessario
const MARKETPLACE_ABI = [
  "function createListing(string calldata _metadataURI, uint256 _price, uint256 _timeoutDuration) external",
  "function buyListing(uint256 _id) external payable",
  "function confirmDelivery(uint256 _id) external",
  "function openDispute(uint256 _id) external",
  "function getListing(uint256 _id) external view returns (tuple(uint256 id, address seller, address buyer, string metadataURI, uint256 price, uint256 createdAt, uint256 purchasedAt, uint256 timeoutDuration, bool sold, bool released, bool disputed, bool cancelled))",
  "function listingCount() external view returns (uint256)",
  "function getActiveListings() external view returns (uint256[] memory)",
  "function collectedFees() external view returns (uint256)"
];

async function main() {
  console.log("🛍️ Interazione con Marketplace\n");

  // Connetti al nodo locale
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  
  // Ottieni gli account
  const seller = await provider.getSigner(0);
  const buyer = await provider.getSigner(1);
  
  console.log("📍 Contratto:", CONTRACT_ADDRESS);
  console.log("👤 Seller:", await seller.getAddress());
  console.log("👤 Buyer:", await buyer.getAddress(), "\n");

  // Connetti al contratto
  const marketplace = new ethers.Contract(CONTRACT_ADDRESS, MARKETPLACE_ABI, seller);

  // ========== 1. CREA LISTING ==========
  console.log("📦 1. Creazione listing...");
  
  const metadataURI = "ipfs://QmTest123";
  const price = ethers.parseEther("0.5");
  const timeout = 7 * 24 * 60 * 60;

  const tx1 = await marketplace.createListing(metadataURI, price, timeout);
  const receipt1 = await tx1.wait();
  console.log("✅ Listing creato! TX:", tx1.hash);

  // Leggi il listing appena creato
  const listingId = await marketplace.listingCount();
  console.log("🆔 Listing ID:", listingId.toString());

  const listing = await marketplace.getListing(listingId);
  console.log("\n📋 Dettagli Listing:");
  console.log("   - Seller:", listing.seller);
  console.log("   - Prezzo:", ethers.formatEther(listing.price), "ETH");
  console.log("   - Metadata:", listing.metadataURI);
  console.log("   - Venduto:", listing.sold);

  // ========== 2. BUYER ACQUISTA ==========
  console.log("\n💳 2. Buyer acquista il listing...");
  
  const marketplaceAsBuyer = marketplace.connect(buyer);
  const tx2 = await marketplaceAsBuyer.buyListing(listingId, { value: price });
  await tx2.wait();
  console.log("✅ Acquisto completato! TX:", tx2.hash);

  // Verifica il balance del contratto
  const contractBalance = await provider.getBalance(CONTRACT_ADDRESS);
  console.log("💰 Balance contratto (escrow):", ethers.formatEther(contractBalance), "ETH");

  // ========== 3. BUYER CONFERMA CONSEGNA ==========
  console.log("\n✅ 3. Buyer conferma la consegna...");
  
  const sellerBalanceBefore = await provider.getBalance(await seller.getAddress());
  
  const tx3 = await marketplaceAsBuyer.confirmDelivery(listingId);
  await tx3.wait();
  console.log("✅ Consegna confermata! TX:", tx3.hash);

  const sellerBalanceAfter = await provider.getBalance(await seller.getAddress());
  const received = sellerBalanceAfter - sellerBalanceBefore;
  
  console.log("💸 Seller ha ricevuto:", ethers.formatEther(received), "ETH");

  // Verifica fee
  const feeCollected = await marketplace.collectedFees();
  console.log("💰 Fee platform raccolta:", ethers.formatEther(feeCollected), "ETH");

  // ========== 4. STATO FINALE ==========
  console.log("\n📊 Stato finale listing #1:");
  const finalListing = await marketplace.getListing(listingId);
  console.log("   - Venduto:", finalListing.sold);
  console.log("   - Rilasciato:", finalListing.released);
  console.log("   - Buyer:", finalListing.buyer);

  // ========== 5. CREA ALTRI LISTING ==========
  console.log("\n📦 5. Creo altri 2 listing...");
  
  await (await marketplace.createListing("ipfs://QmJacket456", ethers.parseEther("0.3"), timeout)).wait();
  console.log("✅ Listing 2 creato (Giacca - 0.3 ETH)");

  await (await marketplace.createListing("ipfs://QmShoes789", ethers.parseEther("0.15"), timeout)).wait();
  console.log("✅ Listing 3 creato (Scarpe - 0.15 ETH)");

  // Mostra tutti i listing attivi
  const activeListings = await marketplace.getActiveListings();
  console.log("\n📋 Listing attivi totali:", activeListings.length);

  const totalListings = await marketplace.listingCount();
  console.log("\n🎉 Test completato!");
  console.log("📊 Listing totali:", totalListings.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Errore:", error);
    process.exit(1);
  });