async function main() {
    const nftFactory = await ethers.getContractFactory("CatNFT");

    const nft = await nftFactory.deploy();
    console.log('address: ', nft.address);
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.log(err);
        process.exit(1)
    });