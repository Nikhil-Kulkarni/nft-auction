/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require('dotenv').config();
require('@nomiclabs/hardhat-ethers');
module.exports = {
  solidity: "0.7.3",
  defaultNetwork: 'ropsten',
  networks: {
    ropsten: {
      url: process.env.INFURA_URL,
      accounts: [`${process.env.PRIVATE_KEY}`]
    }
  }
};
