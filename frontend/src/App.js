import "./App.css";

import { useEffect, useState } from "react";

import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import WalletConnectProvider from "@walletconnect/web3-provider";
import Web3 from "web3";
import Web3Modal from "web3modal";

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      infuraId: process.env.REACT_APP_INFURA_ID,
    },
  },
};

const modal = new Web3Modal({
  network: "ropsten",
  providerOptions: providerOptions,
  cacheProvider: true,
});

const App = () => {
  const [web3, setWeb3] = useState();
  const [account, setAccount] = useState(null);
  const [nft, setNft] = useState(null);
  const [auction, setAuction] = useState(null);
  const [auctionList, setAuctionList] = useState([]);
  const [tokenId, setTokenId] = useState(null);

  useEffect(() => {
    loadWeb3();
  }, []);

  useEffect(() => {
    if (account == null) {
      return;
    }
    const web3Socket = new Web3(new Web3.providers.WebsocketProvider(process.env.REACT_APP_INFURA_WS_URL));
    const nftContract = new web3Socket.eth.Contract(
      require("./contracts/CatNFT.json").abi,
      process.env.REACT_APP_NFT_ADDRESS
    );
    nftContract.events
      .Transfer({
        filter: {
          to: account,
        },
      })
      .on("data", async function (event) {
        setTokenId(event.returnValues.tokenId);
      });
  }, [account]);

  const loadWeb3 = async () => {
    const web3 = new Web3(Web3.givenProvider || process.env.REACT_APP_INFURA_URL);
    setWeb3(web3);
    const accounts = await web3.eth.getAccounts();
    if (accounts.length !== 0) {
      setAccount(accounts[0]);
    }
    const nftContract = new web3.eth.Contract(
      require("./contracts/CatNFT.json").abi,
      process.env.REACT_APP_NFT_ADDRESS
    );
    setNft(nftContract);
    const auctionContract = new web3.eth.Contract(
      require("./contracts/Auction.json").abi,
      process.env.REACT_APP_AUCTION_ADDRESS
    );
    setAuction(auctionContract);

    const auction1 = await auctionContract.methods.tokenToAuctionMap(process.env.REACT_APP_NFT_ADDRESS, 1).call();
    const auction2 = await auctionContract.methods.tokenToAuctionMap(process.env.REACT_APP_NFT_ADDRESS, 2).call();
    const auction3 = await auctionContract.methods.tokenToAuctionMap(process.env.REACT_APP_NFT_ADDRESS, 3).call();

    const auctions = [];
    if (auction1) {
      auctions.push(auction1);
    }
    if (auction2) {
      auctions.push(auction2);
    }
    if (auction3) {
      auctions.push(auction3);
    }
    setAuctionList(auctions);
  };

  const connectWallet = async () => {
    await modal.connect();
    const accounts = await web3.eth.getAccounts();
    setAccount(accounts[0]);
  };

  const mint = async () => {
    nft.methods.mint().send({ from: account, gas: 500000 });
  };

  const approve = async () => {
    nft.methods.approve(process.env.REACT_APP_AUCTION_ADDRESS, 2).send({ from: account });
  };

  const newListing = async () => {
    auction.methods
      .startAuction(process.env.REACT_APP_NFT_ADDRESS, 2, 1200000, Math.floor(new Date().getTime() / 1000) + 86400)
      .send({ from: account, gas: 620000 });
  };

  const placeBid = async (tokenId, value) => {
    auction.methods.bid(
      process.env.REACT_APP_NFT_ADDRESS,
      tokenId
    ).send({ from: account, gas: 620000, value: value });
  }

  const endSale = async (tokenId) => {
    auction.methods.endSale(
      process.env.REACT_APP_NFT_ADDRESS,
      tokenId
    ).send({ from: account, gas: 620000 });
  }

  const executeSale = async (tokenId) => {
    auction.methods.executeSale(
      process.env.REACT_APP_NFT_ADDRESS,
      tokenId
    ).send({ from: account, gas: 620000 });
  }

  return (
    <div className="App">
      <Container style={{ marginTop: "1rem" }}>
        <h1>Mint an NFT</h1>
        {tokenId != null ? <h3>Your NFT's token id: {tokenId}</h3> : <></>}
        <Container>
          <Button variant="primary" onClick={mint}>
            Mint
          </Button>
          <Button variant="secondary" onClick={approve} style={{ marginLeft: "1rem" }}>
            Approve
          </Button>
          <Button variant="secondary" onClick={newListing} style={{ marginLeft: "1rem" }}>
            Create a listing
          </Button>
        </Container>
        <Row style={{ marginTop: "1rem" }}>
          {auctionList.map((auction, index) => 
            <Col key={index}>
              <Card style={{ width: "24rem" }}>
                <Card.Body>
                  <Card.Title>Token Id: {index + 1}</Card.Title>
                  <Card.Text>Current Bid: {auction.maxBid}</Card.Text>
                  <Card.Text>Minimum Bid: {web3.utils.fromWei(auction.minimumPrice)}</Card.Text>
                  <Button variant="primary" onClick={() => placeBid(index + 1, auction.minimumPrice + 100000000)}>Place Bid</Button>
                  <Button variant="primary" style={{marginLeft: '1rem'}} onClick={() => endSale(index + 1)}>End Sale</Button>
                  <Button variant="primary" style={{marginLeft: '1rem'}} onClick={() => executeSale(index + 1)}>Execute Sale</Button>
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>
      </Container>
      {account == null ? (
        <Container>
          <Button variant="secondary" onClick={connectWallet}>
            Connect Wallet
          </Button>
        </Container>
      ) : (
        <></>
      )}
    </div>
  );
};

export default App;
