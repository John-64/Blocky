import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MarketplaceModule", (m) => {
  // Ottieni l'account che sta facendo il deploy
  const deployer = m.getAccount(0);
  
  // Deploy del contratto Marketplace usando il deployer come arbiter
  const marketplace = m.contract("Marketplace", [deployer]);
  
  return { marketplace };
});