# Blocky
Blocky is a decentralized, blockchain-based marketplace for securely buying and selling second-hand items through peer-to-peer transactions, without relying on a centralized platform.

## Features
- **Create and publish listings:** Users can create listings with a title, description and price. Listing data is stored on the blockchain.
- **Purchase items:** Buyers can purchase listed items by sending the required amount of ETH.
- **Escrow system:** Funds are locked in a smart contract until the transaction is finalized, providing security for both parties.
- **Funds release:** Funds are transferred to the seller when either of the following conditions is met:
  - The buyer confirms receipt of the item.
  - A predefined timeout expires, automatically finalizing the transaction.
- **Dispute resolution:** Disputes can be handled through two mechanisms:
  - **Partial refund:** The seller can offer a partial refund, which the buyer must accept to finalize the transaction.
  - **Simulated consensus:** If no agreement is reached before the timeout expires, the buyer automatically receives a refund. This is a simplified mechanism; a fully-fledged consensus-based dispute resolution system is planned for future development.

## Screenshots
<p align="center">
  <img src="media/7. Screenshot.png" alt="Marketplace listings" width="45%">
  <img src="media/1. Screenshot.png" alt="Create a listing" width="45%">
</p>

<p align="center">
  <img src="media/5. Screenshot.png" alt="My listings" width="45%">
  <img src="media/2. Screenshot.png" alt="Partial refund" width="45%">
</p>

## Technologies
| Component | Technologies |
|---|---|
| Blockchain | Hardhat, Polygon |
| Smart contracts | Solidity |
| Backend | Node.js, TypeScript |
| Frontend | React, Tailwind CSS, TypeScript |
| Wallet integration | MetaMask |

## Installation
1. Download or clone the repository.
2. Navigate to the frontend directory and install the dependencies:

   ```bash
   cd frontend
   npm install
   ```

3. Configure the blockchain environment using one of the following options:
   - **Local development:** Follow the [Usage with Hardhat Blockchain](#usage-with-hardhat-blockchain) instructions.
   - **Polygon testnet:** Follow the [Usage with Polygon Blockchain](#usage-with-polygon-blockchain) instructions.

## Usage with Hardhat Blockchain
1. From the project root, compile the smart contracts:
   ```bash
   npx hardhat compile
   ```
2. Start a local Hardhat blockchain in a separate terminal:
   ```bash
   npx hardhat node
   ```
3. Deploy the smart contract to the local blockchain:
   ```bash
   npx hardhat ignition deploy ignition/modules/Marketplace.ts --network localhost
   ```
4. In another terminal, navigate to the frontend directory and start the application:
   ```bash
   cd frontend
   npm run dev
   ```
5. Open your browser and visit:
   ```text
   http://127.0.0.1:5173
   ```

## Usage with Polygon Blockchain
1. Configure the frontend blockchain connection:
   - Open `app.tsx`.
   - Uncomment lines 9 and 14.
   - Comment out lines 10 and 15.
2. Configure the `.env` file with your personal settings, including the RPC URL and private key.
3. Compile the smart contracts:
   ```bash
   npx hardhat compile
   ```
4. Deploy the smart contract to the Polygon Amoy testnet:
   ```bash
   npx hardhat ignition deploy ignition/modules/Marketplace.ts --network polygonAmoy
   ```
5. Start the frontend application:
   ```bash
   cd frontend
   npm run dev
   ```
6. Open your browser and visit:
   ```text
   http://127.0.0.1:5173
   ```

### Notes
- **Test POL tokens:** You will need test POL to interact with the Polygon Amoy network. You can request free tokens from either [StakePool Faucet](https://faucet.stakepool.dev.br/amoy) or the [Polygon Faucet](https://faucet.polygon.technology/).
- **MetaMask:** A MetaMask wallet is required to connect to the blockchain. You can install it from the [official MetaMask website](https://metamask.io/).

**Security note:** Never commit your private key or `.env` file to the repository. Use a dedicated test wallet and testnet funds for development.

## Future Improvements
- Implement a fully-fledged consensus mechanism for dispute resolution.
- Introduce ratings and reviews for buyers and sellers.

## Info
This project was developed as part of the *Data Security* course at the University of Salerno.

## Contributing
To contribute:
1. fork the repository;
2. create a new branch (`git checkout -b feature/YourFeatureName`);
3. commit your changes (`git commit -m 'Add some feature'`);
4. push the branch (`git push origin feature/YourFeatureName`);
5. open a pull request.

## License
This project is licensed under the MIT License, except where a different license is stated in a subfolder. See the `LICENSE` file for details.
