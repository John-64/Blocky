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
        VeryGood,   // Thing is in perfect condition
        Good,       // Thing is in good condition
        Damaged     // Thing is damaged
    }

    // --- Struct ---
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

    // --- State ---
    uint256 public listingCount = 0;
    mapping(uint256 => Listing) public listings;

    // --- Events ---
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

    // --- Modifiers ---
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

    // --- Create listing ---
    function createListing(
        uint256 _price,
        string calldata _title,
        string calldata _description,
        Condition _condition
    ) external {
        require(_price > 0, "Price must be > 0");
        require(bytes(_title).length > 0, "Title required");

        listings[listingCount] = Listing({
            idListing: listingCount,
            seller: payable(msg.sender),
            buyer: payable(address(0)),
            price: _price,
            title: _title,
            description: _description,
            condition: _condition,
            createdAt: block.timestamp,
            soldAt: 0,           // ancora non venduto
            state: State.Active
        });

        emit ListingCreated(listingCount, msg.sender, _price, _title, _condition);
        listingCount++;
    }

    // --- Purchase listing ---
    function purchaseListing(uint256 _id, uint256 _amount) external payable exists(_id) {
        Listing storage l = listings[_id];
        require(l.state == State.Active, "Listing not active");
        require(msg.value == _amount, "msg.value != amount"); // il valore inviato deve corrispondere a _amount
        require(_amount == l.price, "Incorrect payment amount"); // il valore inserito deve essere uguale al prezzo

        l.buyer = payable(msg.sender);
        l.state = State.Sold;
        l.soldAt = block.timestamp; // salvo il momento dell'acquisto

        emit ListingPurchased(_id, msg.sender);
    }

    // --- Release funds ---
    function releaseFunds(uint256 _id) external onlySeller(_id) exists(_id) {
        Listing storage l = listings[_id];
        require(l.state == State.Sold, "Funds not in escrow");

        uint256 amount = l.price;
        l.state = State.Released;

        (bool sent, ) = l.seller.call{value: amount}("");
        require(sent, "Failed to send funds");

        emit FundsReleased(_id, l.seller, amount);
    }

    // --- Timeout claim (3 days from purchase) ---
    function claimTimeout(uint256 _id) external onlySeller(_id) exists(_id) {
        Listing storage l = listings[_id];
        require(l.state == State.Sold, "Listing not sold");
        require(block.timestamp >= l.soldAt + 3 days, "Timeout not reached");

        uint256 amount = l.price;
        l.state = State.Released;

        (bool sent, ) = l.seller.call{value: amount}("");
        require(sent, "Failed to send funds");

        emit TimeoutClaimed(_id, l.seller);
    }

    // --- View active listings ---
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
}
