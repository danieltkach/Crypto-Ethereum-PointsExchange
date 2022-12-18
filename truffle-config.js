const HDWalletProvider = require('@truffle/hdwallet-provider');
require("dotenv").config()

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*", // Match any network id
      websockets: true
    },
    kovan: {
      provider: function() {
        return new HDWalletProvider(
          //private keys array
          [process.env.PRIVATE_KEY],
          //url to ethereum node
          process.env.RPC_URL
        )
      },
      network_id: "42"
    },
    compilers: {
      solc: { 
        version: "^0.5.16",
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    },
    plugins: [
      'truffle-contract-size'
    ]
  }
};