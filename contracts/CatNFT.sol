pragma solidity ^0.7.3;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CatNFT is ERC721, Ownable {

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    constructor() public ERC721("CAT", "CAT") {}

    function mint() external returns (uint256) {
        require(msg.sender != address(0), "Invalid address");

        uint256 tokenId = _tokenIds.current();

        _tokenIds.increment();
        _mint(msg.sender, tokenId);
        return tokenId;
    }
}