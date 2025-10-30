// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// @title Decentralized Marketplace with escrow and dispute resolution
/// @dev Extended version with dispute mechanism, partial refunds, and timeouts.
contract Marketplace {
    // --- Enums ---
    enum State {
        Active,
        Sold,
        Released,
        Disputed,
        Resolved,
        Cancelled
    }

    enum Condition {
        New,
        Good,
        Acceptable,
        Damaged
    }

    // Struct for a listing
    struct Listing {
        uint256 idListing;
        address payable seller;
        address payable buyer;
        uint256 price;
        string title;
        string description;
        Condition condition;
        uint256 createdAt;
        uint256 soldAt;
        uint256 disputeOpenedAt;
        uint256 partialRefundOffer;
        State state;
    }

    // State variables
    uint256 public listingCount = 0;
    mapping(uint256 => Listing) public listings;
    
    // Time constants
    uint256 public constant DISPUTE_WINDOW = 1 days;
    // The idea here is to have a consensus algorithm off-chain, but for simplicity, we simulate it with a timeout.
    uint256 public constant DISPUTE_RESOLUTION_PERIOD = 30 minutes;

    // Events
    event ListingCreated(uint256 indexed id, address indexed seller, uint256 price, string title, Condition condition);
    event ListingCancelled(uint256 indexed id);
    event ListingPurchased(uint256 indexed id, address indexed buyer);
    event FundsReleased(uint256 indexed id, address indexed seller, uint256 amount);
    event TimeoutClaimed(uint256 indexed id, address indexed seller, uint256 amount);
    event RefundIssued(uint256 indexed id, address indexed buyer, uint256 amount);
    event DisputeOpened(uint256 indexed id, address indexed buyer);
    event PartialRefundOffered(uint256 indexed id, uint256 amount);
    event PartialRefundAccepted(uint256 indexed id, uint256 buyerAmount, uint256 sellerAmount);
    event DisputeResolved(uint256 indexed id, address indexed winner, uint256 amount);


    // Modifiers
    modifier onlySeller(uint256 _id) {
        require(msg.sender == listings[_id].seller, "Not the seller");
        _;
    }

    modifier onlyBuyer(uint256 _id) {
        require(msg.sender == listings[_id].buyer, "Not the buyer");
        _;
    }

    modifier exists(uint256 _id) {
        require(_id < listingCount, "Listing does not exist");
        _;
    }

    /// @notice Creates a new listing in the marketplace
    function createListing(
        uint256 _price,
        string calldata _title,
        string calldata _description,
        Condition _condition
    ) external {
        require(_price > 0, "Price must be greater than 0!");
        require(bytes(_title).length > 0, "The title is required!");
        require(bytes(_description).length > 0, "The description is required!");
        require(uint8(_condition) <= uint8(Condition.Damaged), "Invalid condition!");

        listings[listingCount] = Listing({
            idListing: listingCount,
            seller: payable(msg.sender),
            buyer: payable(address(0)),
            price: _price,
            title: _title,
            description: _description,
            condition: _condition,
            createdAt: block.timestamp,
            soldAt: 0,
            disputeOpenedAt: 0,
            partialRefundOffer: 0,
            state: State.Active
        });

        emit ListingCreated(listingCount, msg.sender, _price, _title, _condition);
        listingCount++;
    }

    /// @notice Retrieves all active listings in the marketplace
    function getActiveListings()
        external
        view
        returns (
            uint256[] memory ids,
            address[] memory sellers,
            address[] memory buyers,
            uint256[] memory prices,
            string[] memory titles,
            string[] memory descriptions,
            Condition[] memory conditions,
            uint256[] memory createdAts,
            uint256[] memory soldAts,
            State[] memory states
        )
    {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < listingCount; i++) {
            if (listings[i].state == State.Active) {
                activeCount++;
            }
        }

        ids = new uint256[](activeCount);
        sellers = new address[](activeCount);
        buyers = new address[](activeCount);
        prices = new uint256[](activeCount);
        titles = new string[](activeCount);
        descriptions = new string[](activeCount);
        conditions = new Condition[](activeCount);
        createdAts = new uint256[](activeCount);
        soldAts = new uint256[](activeCount);
        states = new State[](activeCount);

        uint256 index = 0;
        for (uint256 i = 0; i < listingCount; i++) {
            Listing storage l = listings[i];
            if (l.state == State.Active) {
                ids[index] = l.idListing;
                sellers[index] = l.seller;
                buyers[index] = l.buyer;
                prices[index] = l.price;
                titles[index] = l.title;
                descriptions[index] = l.description;
                conditions[index] = l.condition;
                createdAts[index] = l.createdAt;
                soldAts[index] = l.soldAt;
                states[index] = l.state;
                index++;
            }
        }
    }

    /// @notice Retrieves all purchases made by the caller
    function getMyPurchases()
        external
        view
        returns (
            uint256[] memory ids,
            address[] memory sellers,
            uint256[] memory prices,
            string[] memory titles,
            State[] memory states,
            uint256[] memory soldAts,
            uint256[] memory disputeOpenedAts,
            uint256[] memory partialRefundOffers
        )
    {
        uint256 purchaseCount = 0;
        for (uint256 i = 0; i < listingCount; i++) {
            if (listings[i].buyer == msg.sender) {
                purchaseCount++;
            }
        }

        ids = new uint256[](purchaseCount);
        sellers = new address[](purchaseCount);
        prices = new uint256[](purchaseCount);
        titles = new string[](purchaseCount);
        states = new State[](purchaseCount);
        soldAts = new uint256[](purchaseCount);
        disputeOpenedAts = new uint256[](purchaseCount);
        partialRefundOffers = new uint256[](purchaseCount);

        uint256 index = 0;
        for (uint256 i = 0; i < listingCount; i++) {
            if (listings[i].buyer == msg.sender) {
                Listing storage l = listings[i];
                ids[index] = l.idListing;
                sellers[index] = l.seller;
                prices[index] = l.price;
                titles[index] = l.title;
                states[index] = l.state;
                soldAts[index] = l.soldAt;
                disputeOpenedAts[index] = l.disputeOpenedAt;
                partialRefundOffers[index] = l.partialRefundOffer;
                index++;
            }
        }
    }

    /// @notice Retrieves all sales made by the caller
    function getMySales()
        external
        view
        returns (
            uint256[] memory ids,
            address[] memory buyers,
            uint256[] memory prices,
            string[] memory titles,
            State[] memory states,
            uint256[] memory soldAts,
            uint256[] memory disputeOpenedAts,
            uint256[] memory partialRefundOffers
        )
    {
        uint256 salesCount = 0;
        for (uint256 i = 0; i < listingCount; i++) {
            if (listings[i].seller == msg.sender) {
                salesCount++;
            }
        }

        ids = new uint256[](salesCount);
        buyers = new address[](salesCount);
        prices = new uint256[](salesCount);
        titles = new string[](salesCount);
        states = new State[](salesCount);
        soldAts = new uint256[](salesCount);
        disputeOpenedAts = new uint256[](salesCount);
        partialRefundOffers = new uint256[](salesCount);

        uint256 index = 0;
        for (uint256 i = 0; i < listingCount; i++) {
            if (listings[i].seller == msg.sender) {
                Listing storage l = listings[i];
                ids[index] = l.idListing;
                buyers[index] = l.buyer;
                prices[index] = l.price;
                titles[index] = l.title;
                states[index] = l.state;
                soldAts[index] = l.soldAt;
                disputeOpenedAts[index] = l.disputeOpenedAt;
                partialRefundOffers[index] = l.partialRefundOffer;
                index++;
            }
        }
    }

    /// @notice Allows a buyer to purchase an active listing
    function purchaseListing(uint256 _id) external payable exists(_id) {
        Listing storage listing = listings[_id];
        
        require(listing.state == State.Active, "Listing must be active!");
        require(msg.sender != listing.seller, "You cannot buy your own listing.");
        require(msg.value == listing.price, "Incorrect payment amount.");
        
        listing.buyer = payable(msg.sender);
        listing.soldAt = block.timestamp;
        listing.state = State.Sold;
        
        emit ListingPurchased(_id, msg.sender);
    }

    /// @notice Allows the seller to cancel an active listing
    function cancelListing(uint256 _id) external exists(_id) onlySeller(_id) {
        Listing storage listing = listings[_id];
        require(listing.state == State.Active, "You can only cancel active listings!");
        
        listing.state = State.Cancelled;
        emit ListingCancelled(_id);
    }

    /// @notice Releases the escrowed funds to the seller
    /// @dev Can only be called by the buyer before the dispute window closes.
    function releaseFunds(uint256 _id) external exists(_id) onlyBuyer(_id) {
        Listing storage listing = listings[_id];
        require(listing.state == State.Sold, "Funds can only be released for sold items.");
        require(block.timestamp < listing.soldAt + DISPUTE_WINDOW, "Dispute window has passed. Seller must claim.");
        
        listing.state = State.Released;
        uint256 amount = listing.price;
        
        emit FundsReleased(_id, listing.seller, amount);
        listing.seller.transfer(amount);
    }

    /// @notice Allows the seller to claim funds if the buyer is inactive for the dispute window period.
    function claimFundsAfterTimeout(uint256 _id) external exists(_id) onlySeller(_id) {
        Listing storage listing = listings[_id];
        require(listing.state == State.Sold, "Listing not in sold state.");
        require(block.timestamp >= listing.soldAt + DISPUTE_WINDOW, "Dispute window has not yet passed.");

        listing.state = State.Released;
        uint256 amount = listing.price;

        emit TimeoutClaimed(_id, listing.seller, amount);
        listing.seller.transfer(amount);
    }

    /// @notice Opens a dispute for a purchased item.
    /// @dev Can only be called by the buyer within the DISPUTE_WINDOW.
    function openDispute(uint256 _id) external exists(_id) onlyBuyer(_id) {
        Listing storage listing = listings[_id];
        require(listing.state == State.Sold, "Can only open a dispute for a sold item.");
        require(block.timestamp < listing.soldAt + DISPUTE_WINDOW, "Dispute window has passed.");

        listing.state = State.Disputed;
        listing.disputeOpenedAt = block.timestamp;

        emit DisputeOpened(_id, msg.sender);
    }

    /// @notice Seller offers a partial refund to the buyer.
    /// @dev Can only be called by the seller when a dispute is active.
    function offerPartialRefund(uint256 _id, uint256 _amount) external exists(_id) onlySeller(_id) {
        Listing storage listing = listings[_id];
        require(listing.state == State.Disputed, "Listing is not in dispute.");
        require(_amount < listing.price && _amount > 0, "Invalid refund amount.");

        listing.partialRefundOffer = _amount;
        emit PartialRefundOffered(_id, _amount);
    }

    /// @notice Buyer accepts the seller's partial refund offer.
    /// @dev Funds are split: refund to buyer, remainder to seller.
    function acceptPartialRefund(uint256 _id) external exists(_id) onlyBuyer(_id) {
        Listing storage listing = listings[_id];
        require(listing.state == State.Disputed, "Listing is not in dispute.");
        require(listing.partialRefundOffer > 0, "No partial refund has been offered.");

        listing.state = State.Resolved;
        uint256 refundAmount = listing.partialRefundOffer;
        uint256 sellerAmount = listing.price - refundAmount;

        emit PartialRefundAccepted(_id, refundAmount, sellerAmount);
        
        listing.buyer.transfer(refundAmount);
        listing.seller.transfer(sellerAmount);
    }

    /// @notice Resolves the dispute automatically after a set period.
    /// @dev In this simulation, it always favors the buyer with a full refund.
    function resolveDispute(uint256 _id) external exists(_id) onlyBuyer(_id) {
        Listing storage listing = listings[_id];
        require(listing.state == State.Disputed, "Listing is not in dispute.");
        require(block.timestamp >= listing.disputeOpenedAt + DISPUTE_RESOLUTION_PERIOD, "Dispute resolution period not over yet.");
        
        listing.state = State.Resolved;
        uint256 amount = listing.price;

        emit DisputeResolved(_id, listing.buyer, amount);
        // As per requirements, simulated resolution refunds the buyer fully.
        listing.buyer.transfer(amount);
    }
}