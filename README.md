# Blocky
<p align="center"> 
    <img src="frontend/src/assets/logo.png" alt="Blocky" width="220" height="220">
</p>

A decentralized blockchain-based marketplace enabling secure peer-to-peer transiction of used items without relying on a central platform.

## Features 🚀
- Create and publish new listings on the blockchain (with title, description and price);
- Buyers can purchase items by paying the corresponding amount in ETH;
- Funds are held in escrow — securely locked within the smart contract until the transaction is completed;
- Funds are released only when one of the following conditions is met:
    - the buyer confirms the purchase;
    - a timeout expires, automatically finalizing the sale.
- In case of issues, a dispute can be resolved:
    - with an partial refound by the seller (if the buyer accept this solution, the transiction will be completed)
    - the other idea here is to implement a consensum mechanism, for now there is a simulation of that with a simple timeout (which will simultare the decision) but for now the buyer will recive always the rfount, in future the consensum mechanism will be implemented
 
- Create and publish listings: Users can create new listings with a title, description, and price, all stored on the blockchain.
- Purchase items: Buyers can purchase items by sending the required ETH.
- Escrow system: Funds are securely locked in the smart contract until the transaction is finalized.
- Funds release: Funds are released to the seller only when one of the following conditions is met:
    - The buyer confirms the purchase.
    - A timeout expires, automatically finalizing the sale.
- Dispute resolution: In case of issues, disputes can be resolved through:
    - A partial refund offered by the seller (the buyer must accept the offer to complete the transaction).
    - A simulated consensus mechanism: currently, if no agreement is reached within a timeout, the buyer automatically receives a refund. In future updates, a full consensus mechanism will be implemented to decide outcomes fairly.

## Technologies 🛠️
- Smart Contracts: Solidity (Ethereum)
- Blockchain: HardHat or Polygon
- Frontend: React + TypeScript + Ethers.js
- Wallet Integration: MetaMask

## Installation 📦
1. Download the ZIP file.
2. Extract it, then navigate to the frontend folder and install the dependencies:
     ```bash
    cd frontend
    npm install
3. Next, follow the Hardhat setup steps if you want to use the Hardhat blockchain. Otherwise, follow the Polygon setup instructions.

## Usage with Hardhat Blockchain 🔗
1. Compile the Smartcontract:
   ```bash
   npx hardhat compile
2. Start the blockchain:
   ```bash
   npx hardhat node
3. Deploy the smartcontract on the blockchain:
   ```bash
   npx hardhat ignition deploy ignition/modules/Marketplace.ts --network localhost
4. Start the frontend:
   ```bash
   npm run dev
5. Open your browser and go to: http://127.0.0.1:5173

## Usage with Polygon Blockchain 🧊
...

## Notes
This project was created for the course "Sicurezza dei Dati" at the Università degli Studi di Salerno.

## Future improvements 🧑‍💻
- Implement a true consensus mechanism for dispute resolution.
- Add ratings and reviews for buyers and sellers.

## Contribution 📄
If you'd like to contribute to KeyForge, please follow these steps:
- Fork the repository.
- Create a new branch (git checkout -b feature/YourFeatureName).
- Commit your changes (git commit -m 'Add some feature').
- Push to the branch (git push origin feature/YourFeatureName).
- Open a pull request.

## License 📜
This project is licensed under the MIT License. See the LICENSE file for details.
