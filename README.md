# Blocky
<p align="center"> 
    <img src="frontend/src/assets/logo.png" alt="Blocky" width="220" height="220">
</p>

A decentralized blockchain-based marketplace enabling secure peer-to-peer transiction of used items without relying on a central platform.

## Features
- **Create and publish listings:** Users can create new listings with a title, description, and price, all stored on the blockchain.
- **Purchase items:** Buyers can purchase items by sending the required ETH.
- **Escrow system:** Funds are securely locked in the smart contract until the transaction is finalized.
- **Funds release:** Funds are released to the seller only when one of the following conditions is met:
    - The buyer confirms the purchase.
    - A timeout expires, automatically finalizing the sale.
- **Dispute resolution:** In case of issues, disputes can be resolved through:
    - A partial refund offered by the seller (the buyer must accept the offer to complete the transaction).
    - A simulated consensus mechanism: currently, if no agreement is reached within a timeout, the buyer automatically receives a refund. In future updates, a full consensus mechanism will be implemented to decide outcomes fairly.
 
## Screenshots
<p align="center"> 
    <img src="media/2. Screenshot.png" alt="Listings list" height="200">
    <img src="media/1. Screenshot.png" alt="Create listing" height="200">
</p>

<p align="center"> 
    <img src="media/3. Screenshot.png" alt="My listings" height="200">
    <img src="media/7. Screenshot.png" alt="Partial refund" height="200">
</p>


## Technologies
- **Blockchain:** HardHat / Polygon
- **Backend:** Node.js + Solidity + TypeScript
- **Frontend:** React + Tailwind + TypeScript
- **Wallet:** MetaMask

## Installation
1. Download the ZIP file.
2. Extract it, then navigate to the frontend folder and install the dependencies:
    ```bash
    npm install
3. Set up the blockchain environment:
- If you want to use a local Hardhat blockchain, follow the steps in the Usage with Hardhat Blockchain section.
- Otherwise, follow the Polygon setup instructions. 

## Usage with Hardhat Blockchain
1. Compile the smart contract:
    ```bash
    npx hardhat compile
2. Start a local Hardhat blockchain:
    ```bash
    npx hardhat node
3. In a new terminal window, deploy the smart contract to the local blockchain:
    ```bash
    npx hardhat ignition deploy ignition/modules/Marketplace.ts --network localhost
4. Start the application:
     ```bash
    cd frontend
    npm run dev
5. Open your browser and visit:
     ```bash
     http://127.0.0.1:5173

 ### Notes
 - You won’t have an account with test POL tokens by default, so you’ll need to request some from a Polygon faucet. You can easily get free POL from [here](https://faucet.stakepool.dev.br/amoy) or [here](https://faucet.polygon.technology/);
 - You’ll also need a MetaMask account to connect to the Polygon network. If you don’t have one yet, you can create it [here](https://developer.metamask.io/).

## Usage with Polygon Blockchain
1. Configure the frontend connection:
- Open app.tsx.
- Uncomment lines 9 and 14.
- Comment out lines 10 and 15.
2. Open the .env file and fill in your personal configuration details (RPC URL and PRIVATE KEY).
3. Compile the smart contract:
    ```bash
    npx hardhat compile
4. In a new terminal window, deploy the smart contract to the blockchain:
    ```bash
    npx hardhat ignition deploy ignition/modules/Marketplace.ts --network polygonAmoy
5. Start the application:
     ```bash
    cd frontend
    npm run dev
6. Open your browser and visit:
     ```bash
     http://127.0.0.1:5173
- In this case you don't have account with balance, so you have to retrive some POL, i suggest you to use this site for easly get POL: https://faucet.stakepool.dev.br/amoy or https://faucet.polygon.technology/
- You also need to create and https://developer.metamask.io/

## Future improvements
- Implement a true consensus mechanism for dispute resolution;
- Add ratings and reviews for buyers and sellers.

## Info
This project was created for the course "Sicurezza dei Dati" at the Università degli Studi di Salerno.

## Contribution
If you'd like to contribute to Bloky, please follow these steps:
- Fork the repository.
- Create a new branch (git checkout -b feature/YourFeatureName).
- Commit your changes (git commit -m 'Add some feature').
- Push to the branch (git push origin feature/YourFeatureName).
- Open a pull request.

## License
This project is licensed under the MIT License. See the LICENSE file for details.
