// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// @title Decentralized Marketplace with Escrow
/// @notice Marketplace stile Vinted ma decentralizzato con sistema di escrow e arbitraggio
/// @dev Designed for Hardhat v3.0.6
contract Marketplace {
    struct Listing {
        uint256 id;
        address payable seller;
        address payable buyer;
        string metadataURI; // IPFS hash invece di salvare tutto in storage
        uint256 price;
        uint256 createdAt;
        uint256 purchasedAt;
        uint256 timeoutDuration; // durata timeout in secondi
        bool sold;
        bool released;
        bool disputed;
        bool cancelled;
    }

    uint256 public listingCount;
    mapping(uint256 => Listing) public listings;
    
    // Sistema di arbitraggio
    address public arbiter;
    uint256 public platformFeePercent = 25; // 2.5% (diviso per 1000)
    uint256 public collectedFees;
    
    // Costanti
    uint256 public constant MIN_TIMEOUT = 1 days;
    uint256 public constant MAX_TIMEOUT = 90 days;

    // Events
    event ListingCreated(uint256 indexed id, address indexed seller, uint256 price);
    event ListingCancelled(uint256 indexed id);
    event ListingPurchased(uint256 indexed id, address indexed buyer);
    event FundsReleased(uint256 indexed id, address indexed seller, uint256 amount);
    event DisputeOpened(uint256 indexed id, address indexed opener);
    event DisputeResolved(uint256 indexed id, address indexed winner, uint256 amount);
    event TimeoutClaimed(uint256 indexed id, address indexed seller);

    // Modifiers
    modifier onlySeller(uint256 _id) {
        require(msg.sender == listings[_id].seller, "Not the seller");
        _;
    }

    modifier onlyBuyer(uint256 _id) {
        require(msg.sender == listings[_id].buyer, "Not the buyer");
        _;
    }

    modifier onlyArbiter() {
        require(msg.sender == arbiter, "Not the arbiter");
        _;
    }

    modifier exists(uint256 _id) {
        require(_id > 0 && _id <= listingCount, "Listing does not exist");
        _;
    }

    constructor(address _arbiter) {
        require(_arbiter != address(0), "Invalid arbiter");
        arbiter = _arbiter;
    }

    /// @notice Crea un nuovo annuncio
    /// @param _metadataURI Hash IPFS con metadati (title, description, images)
    /// @param _price Prezzo in wei
    /// @param _timeoutDuration Durata timeout in secondi
    function createListing(
        string calldata _metadataURI,
        uint256 _price,
        uint256 _timeoutDuration
    ) external {
        require(_price > 0, "Price must be > 0");
        require(
            _timeoutDuration >= MIN_TIMEOUT && _timeoutDuration <= MAX_TIMEOUT,
            "Invalid timeout"
        );
        require(bytes(_metadataURI).length > 0, "Empty metadata");

        listingCount++;
        listings[listingCount] = Listing({
            id: listingCount,
            seller: payable(msg.sender),
            buyer: payable(address(0)),
            metadataURI: _metadataURI,
            price: _price,
            createdAt: block.timestamp,
            purchasedAt: 0,
            timeoutDuration: _timeoutDuration,
            sold: false,
            released: false,
            disputed: false,
            cancelled: false
        });

        emit ListingCreated(listingCount, msg.sender, _price);
    }

    /// @notice Cancella un annuncio non venduto
    function cancelListing(uint256 _id) external exists(_id) onlySeller(_id) {
        Listing storage listing = listings[_id];
        require(!listing.sold, "Cannot cancel sold item");
        require(!listing.cancelled, "Already cancelled");

        listing.cancelled = true;
        emit ListingCancelled(_id);
    }

    /// @notice Acquista un articolo (fondi vanno in escrow)
    function buyListing(uint256 _id) external payable exists(_id) {
        Listing storage listing = listings[_id];
        require(!listing.sold, "Already sold");
        require(!listing.cancelled, "Listing cancelled");
        require(msg.value == listing.price, "Incorrect payment");
        require(msg.sender != listing.seller, "Cannot buy own item");

        listing.sold = true;
        listing.buyer = payable(msg.sender);
        listing.purchasedAt = block.timestamp;

        emit ListingPurchased(_id, msg.sender);
    }

    /// @notice Buyer conferma la consegna e rilascia i fondi
    function confirmDelivery(uint256 _id) external exists(_id) onlyBuyer(_id) {
        Listing storage listing = listings[_id];
        require(listing.sold, "Item not sold");
        require(!listing.released, "Already released");
        require(!listing.disputed, "Item disputed");

        listing.released = true;
        
        // Calcola fee e importo per seller
        uint256 fee = (listing.price * platformFeePercent) / 1000;
        uint256 sellerAmount = listing.price - fee;
        
        collectedFees += fee;

        // Pattern Checks-Effects-Interactions
        (bool success, ) = listing.seller.call{value: sellerAmount}("");
        require(success, "Transfer failed");

        emit FundsReleased(_id, listing.seller, sellerAmount);
    }

    /// @notice Apri una disputa (solo buyer o seller)
    function openDispute(uint256 _id) external exists(_id) {
        Listing storage listing = listings[_id];
        require(listing.sold, "Item not sold");
        require(!listing.released, "Already released");
        require(!listing.disputed, "Already disputed");
        require(
            msg.sender == listing.buyer || msg.sender == listing.seller,
            "Not involved in transaction"
        );

        listing.disputed = true;
        emit DisputeOpened(_id, msg.sender);
    }

    /// @notice Risolvi una disputa (solo arbiter)
    /// @param _id ID del listing
    /// @param _favorBuyer true = rimborsa buyer, false = paga seller
    function resolveDispute(uint256 _id, bool _favorBuyer) 
        external 
        exists(_id) 
        onlyArbiter 
    {
        Listing storage listing = listings[_id];
        require(listing.disputed, "Not disputed");
        require(!listing.released, "Already released");

        listing.released = true;
        address payable winner = _favorBuyer ? listing.buyer : listing.seller;
        uint256 amount = listing.price;

        if (!_favorBuyer) {
            // Se vince il seller, sottrai la fee
            uint256 fee = (amount * platformFeePercent) / 1000;
            amount -= fee;
            collectedFees += fee;
        }

        (bool success, ) = winner.call{value: amount}("");
        require(success, "Transfer failed");

        emit DisputeResolved(_id, winner, amount);
    }

    /// @notice Seller può reclamare i fondi dopo il timeout se buyer non conferma
    function claimTimeout(uint256 _id) external exists(_id) onlySeller(_id) {
        Listing storage listing = listings[_id];
        require(listing.sold, "Item not sold");
        require(!listing.released, "Already released");
        require(!listing.disputed, "Item disputed");
        require(
            block.timestamp >= listing.purchasedAt + listing.timeoutDuration,
            "Timeout not reached"
        );

        listing.released = true;
        
        uint256 fee = (listing.price * platformFeePercent) / 1000;
        uint256 sellerAmount = listing.price - fee;
        
        collectedFees += fee;

        (bool success, ) = listing.seller.call{value: sellerAmount}("");
        require(success, "Transfer failed");

        emit TimeoutClaimed(_id, listing.seller);
    }

    /// @notice Ottieni tutti gli ID dei listing attivi (non venduti, non cancellati)
    function getActiveListings() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        
        // Prima conta quanti sono attivi
        for (uint256 i = 1; i <= listingCount; i++) {
            if (!listings[i].sold && !listings[i].cancelled) {
                activeCount++;
            }
        }
        
        // Poi crea l'array con la dimensione corretta
        uint256[] memory activeIds = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= listingCount; i++) {
            if (!listings[i].sold && !listings[i].cancelled) {
                activeIds[index] = i;
                index++;
            }
        }
        
        return activeIds;
    }

    /// @notice Cambia l'arbiter (solo arbiter corrente)
    function changeArbiter(address _newArbiter) external onlyArbiter {
        require(_newArbiter != address(0), "Invalid address");
        arbiter = _newArbiter;
    }

    /// @notice Preleva le fee accumulate (solo arbiter)
    function withdrawFees() external onlyArbiter {
        uint256 amount = collectedFees;
        require(amount > 0, "No fees to withdraw");
        
        collectedFees = 0;
        
        (bool success, ) = arbiter.call{value: amount}("");
        require(success, "Transfer failed");
    }

    /// @notice Ottieni dettagli di un listing
    function getListing(uint256 _id) external view exists(_id) returns (Listing memory) {
        return listings[_id];
    }
}