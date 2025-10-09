// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// @title Decentralized Marketplace with escrow
/// @dev Extended version with title, description, condition, and 3-day timeout
contract Marketplace {
    // --- Enums ---
    enum State {
        Active,     // Listing is available for purchase
        Sold,       // Purchased, funds in escrow
        Released,   // Funds released to seller
        Disputed,   // Dispute opened
        Cancelled   // Listing cancelled by seller
    }

    enum Condition {
        New,        // Thing is brand new
        Good,       // Thing is in perfect condition
        Acceptable, // Thing is in good condition
        Damaged     // Thing is damaged
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
        State state;
    }

    // State variables
    uint256 public listingCount = 0;
    mapping(uint256 => Listing) public listings;
    
    // Timeout period for seller to claim funds if buyer doesn't confirm receipt
    uint256 public constant TIMEOUT_PERIOD = 3 days;

    // Events
    event ListingCreated(
        uint256 indexed id,
        address indexed seller,
        uint256 price,
        string title,
        Condition condition
    );
    event ListingCancelled(uint256 indexed id);
    event ListingPurchased(uint256 indexed id, address indexed buyer);
    event FundsReleased(uint256 indexed id, address indexed seller, uint256 amount);
    event TimeoutClaimed(uint256 indexed id, address indexed seller);
    event RefundIssued(uint256 indexed id, address indexed buyer, uint256 amount);

    // Modifiers for access control and validation
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
    /// @dev Initializes a new `Listing` struct and stores it in the `listings` mapping
    /// @param _price The price of the item in wei (must be greater than 0)
    /// @param _title The title of the listing (cannot be empty)
    /// @param _description A detailed description of the item for sale (cannot be empty)
    /// @param _condition The condition of the item (0=New, 1=Good, 2=Acceptable, 3=Damaged)
    /// @custom:emits ListingCreated emitted when a new listing is successfully created
    function createListing(
        uint256 _price,
        string calldata _title,
        string calldata _description,
        Condition _condition
    ) external {
        require(_price > 0, "Price must be greater than 0!");
        require(bytes(_title).length > 0, "The title is required!");
        require(bytes(_description).length > 0, "The description is required!");
        require(uint8(_condition) <= uint8(Condition.Damaged), "Invalid condition, please select the correct one! (0=New, 1=Good, 2=Acceptable, 3=Damaged)");

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
            state: State.Active
        });

        emit ListingCreated(listingCount, msg.sender, _price, _title, _condition);
        listingCount++;
    }

    /// @notice Allows a buyer to purchase an active listing by sending the exact payment amount
    /// @dev Transfers ownership of the listing to the buyer and marks it as sold.
    /// @dev The listing must exist, be active, and the caller cannot be the seller.
    /// @param _id The unique identifier of the listing to purchase
    /// @custom:emits ListingPurchased Emitted when a listing is successfully purchased
    function purchaseListing(uint256 _id) external payable exists(_id) {
        Listing storage listing = listings[_id];
        
        require(listing.state == State.Active, "Listing must be active!");
        require(msg.sender != listing.seller, "You cannot buy your own listing.");
        require(msg.value == listing.price, "Incorrect payment amount, please send the exact price.");
        
        listing.buyer = payable(msg.sender);
        listing.soldAt = block.timestamp;
        listing.state = State.Sold;
        
        emit ListingPurchased(_id, msg.sender);
    }


    /// @notice Allows the seller to cancel an active listing
    /// @dev Only the seller of the listing can call this function.
    /// @dev The listing must be in the `Active` state to be cancelled.
    /// @dev Once cancelled, the total active listings count is decremented.
    /// @param _id The unique identifier of the listing to cancel
    /// @custom:emits ListingCancelled Emitted when a listing is successfully cancelled
    function cancelListing(uint256 _id) 
        external 
        exists(_id) 
        onlySeller(_id) 
    {
        Listing storage listing = listings[_id];
        require(listing.state == State.Active, "You can only cancel active listings!");
        
        listing.state = State.Cancelled;

        emit ListingCancelled(_id);
    }

    /// @notice Releases the escrowed funds to the seller after a successful purchase
    /// @dev Can only be called by the buyer of the listing.
    /// @dev The listing must be in the `Sold` state (funds held in escrow).
    /// @dev Once released, the seller receives the payment and the listing state is updated.
    /// @param _id The unique identifier of the listing whose funds are to be released
    /// @custom:emits FundsReleased Emitted when the payment is released to the seller
    function releaseFunds(uint256 _id) 
        external 
        exists(_id) 
        onlyBuyer(_id) 
    {
        Listing storage listing = listings[_id];
        require(listing.state == State.Sold, "Funds already released or not in escrow!");
        
        listing.state = State.Released;
        uint256 amount = listing.price;
        
        emit FundsReleased(_id, listing.seller, amount);
        listing.seller.transfer(amount);
    }

    /// @notice Retrieves all active listings in the marketplace
    /// @dev Iterates through the `listings` mapping and collects details of listings in the `Active` state.
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
    /// @dev Iterates through the `listings` mapping and collects details of listings where the caller is the buyer.
    function getMyPurchases()
        external
        view
        returns (
            uint256[] memory ids,
            address[] memory sellers,
            uint256[] memory prices,
            string[] memory titles,
            State[] memory states,
            uint256[] memory soldAts
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
                index++;
            }
        }
    }

    /// @notice Retrieves all sales made by the caller
    /// @dev Iterates through the `listings` mapping and collects details of listings where the caller is the seller.
    function getMySales()
        external
        view
        returns (
            uint256[] memory ids,
            address[] memory buyers,
            uint256[] memory prices,
            string[] memory titles,
            State[] memory states,
            uint256[] memory soldAts
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
                index++;
            }
        }
    }

    // TO-DO: migliorare la gestione delle dispute e timeot (qui sotto una versione semplificata)
    // IDEA: considerare un sistema di arbitrato decentralizzato

    // --- Claim timeout
    function claimTimeout(uint256 _id) 
        external 
        exists(_id) 
        onlySeller(_id) 
    {
        Listing storage listing = listings[_id];
        require(listing.state == State.Sold, "Not in escrow");
        require(
            block.timestamp >= listing.soldAt + TIMEOUT_PERIOD,
            "Timeout period not elapsed"
        );
        
        listing.state = State.Released;
        uint256 amount = listing.price;
        
        emit TimeoutClaimed(_id, listing.seller);
        listing.seller.transfer(amount);
    }

    // --- Open dispute
    function openDispute(uint256 _id) 
        external 
        exists(_id) 
        onlyBuyer(_id) 
    {
        Listing storage listing = listings[_id];
        require(listing.state == State.Sold, "Can only dispute active escrow");
        require(
            block.timestamp < listing.soldAt + TIMEOUT_PERIOD,
            "Timeout period elapsed, contact seller directly"
        );
        
        listing.state = State.Disputed;
        // In una versione più completa, qui si potrebbe integrare un sistema di arbitrato
    }

    // --- Refund (in case of dispute resolution - simplified version) ---
    function issueRefund(uint256 _id) 
        external 
        exists(_id) 
    {
        Listing storage listing = listings[_id];
        require(listing.state == State.Disputed, "Not in disputed state");
        // Nota: in produzione aggiungere controllo ruolo arbitro
        
        uint256 amount = listing.price;
        address payable buyer = listing.buyer;
        
        listing.state = State.Cancelled;
        
        emit RefundIssued(_id, buyer, amount);
        buyer.transfer(amount);
    }
}