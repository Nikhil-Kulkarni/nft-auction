pragma solidity ^0.7.3;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract Auction is IERC721Receiver {

    struct auctionDetails {
        address seller;
        uint256 minimumPrice;
        uint256 endTimestamp;
        uint256 maxBid;
        address maxBidAddress;
        uint256[] bids;
        address[] users;
        bool active;
    }

    event AuctionStarted(address indexed from, uint256 indexed tokenId);
    event BidPlaced(address indexed from, uint256 indexed tokenId, uint256 price);
    event SaleExecuted(address indexed soldTo, uint256 indexed tokenId);
    event SaleEnded(uint256 indexed tokenId);

    mapping(address => mapping (uint256 => auctionDetails)) public tokenToAuctionMap;

    constructor() {}

    /**
     * Start the auction
     */
    function startAuction(address nftAddress, uint256 tokenId, uint256 price, uint256 endTimestamp) external {
        require(msg.sender != address(0), "Invalid Sender");
        require(nftAddress != address(0), "Invalid address");
        require(price > 0, "Price must be greater than 0");
        require(endTimestamp > 0, "Invalid end timestamp");
        auctionDetails memory auction = auctionDetails({
            seller: msg.sender,
            minimumPrice: price,
            endTimestamp: endTimestamp,
            maxBid: 0,
            maxBidAddress: address(0),
            bids: new uint256[](0),
            users: new address[](0),
            active: true
        });
        ERC721(nftAddress).safeTransferFrom(msg.sender, address(this), tokenId);
        tokenToAuctionMap[nftAddress][tokenId] = auction;

        emit AuctionStarted(msg.sender, tokenId);
    }

    /**
     * Place a bid on an NFT. If bid > current max bid, withdraw ETH, pass ETH back to previous high bid
     */
    function bid(address nftAddress, uint256 tokenId) external payable {
        require(msg.sender != address(0), "Invalid sender");
        auctionDetails storage auction = tokenToAuctionMap[nftAddress][tokenId];
        require(auction.endTimestamp > block.timestamp, "Auction is over");
        require(msg.value >= auction.minimumPrice, "Bid doesn't exceed minimum price");
        require(msg.value >= auction.maxBid, "Bid doesn't exceed current max bid");
        require(auction.active, "Auction is not active");
        uint256 previousMaxBid = auction.maxBid;
        address previousMaxBidAddress = auction.maxBidAddress;
        auction.maxBid = msg.value;
        auction.maxBidAddress = msg.sender;
        auction.bids.push(msg.value);
        auction.users.push(msg.sender);
        (bool success,) = previousMaxBidAddress.call{value: previousMaxBid}("");
        require(success, "Failed to send back eth");

        emit BidPlaced(msg.sender, tokenId, msg.value);
    }

    /**
     * Execute the sale. Transfers NFT to highest bidder
     */
    function executeSale(address nftAddress, uint256 tokenId) external {
        require(msg.sender != address(0), "Invalid address");
        auctionDetails storage auction = tokenToAuctionMap[nftAddress][tokenId];
        require(auction.seller == msg.sender, "Not seller");
        require(auction.endTimestamp > block.timestamp, "Auction has ended");
        require(auction.active, "Auction is not active");
        require(auction.maxBidAddress != address(0), "Not bids placed yet");
        ERC721(nftAddress).safeTransferFrom(address(this), auction.maxBidAddress, tokenId);
        (bool success,) = auction.seller.call{value: auction.maxBid}("");
        require(success, "Failed to transfer eth");

        emit SaleExecuted(msg.sender, tokenId);
    }

    /**
     * End sale and transfer NFT back to original owner
     */
    function endSale(address nftAddress, uint256 tokenId) external {
        require(msg.sender != address(0), "Invalid address");
        auctionDetails storage auction = tokenToAuctionMap[nftAddress][tokenId];
        require(auction.seller == msg.sender, "Not seller");
        require(auction.active, "Auction is not active");
        auction.active = false;
        ERC721(nftAddress).safeTransferFrom(address(this), auction.seller, tokenId);
        (bool success,) = auction.maxBidAddress.call{value: auction.maxBid}("");
        require(success, "Failed to transfer eth");

        emit SaleEnded(tokenId);
    }

    function onERC721Received(address operator, address from, uint256 tokenId, bytes memory data) external override returns (bytes4) {
        return bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"));
    }
}