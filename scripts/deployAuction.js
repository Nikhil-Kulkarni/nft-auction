async function main() {
    const nftFactory = await ethers.getContractFactory("Auction");

    const auction = await nftFactory.deploy();
    console.log('address: ', auction.address);
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.log(err);
        process.exit(1)
    });