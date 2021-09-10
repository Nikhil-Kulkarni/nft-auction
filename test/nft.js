const { expect } = require("chai");

describe("CatNFT", function() {
    it("Should return the right name and symbol", async function() {
        const nftFactory = await hre.ethers.getContractFactory("CatNFT");
        const nft = await nftFactory.deploy();

        await nft.deployed();
        expect(await nft.name()).to.equal("CAT");
        expect(await nft.symbol()).to.equal("CAT");
    });

    it("Should mint and return 1 tokenid", async function() {
        const nftFactory = await hre.ethers.getContractFactory("CatNFT");
        const nft = await nftFactory.deploy();

        await nft.deployed();
        const tokenId = await nft.mint();
        expect(tokenId).to.equal(1);
    })
});