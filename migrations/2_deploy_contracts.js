var EscrowExchange = artifacts.require("./EscrowExchange.sol");
var AdminEscrowActions = artifacts.require("./AdminEscrowActions.sol");

const ether = (n) => new web3.utils.BN(web3.utils.toWei(n, 'ether'));

module.exports = function(deployer, network, accounts) {
  deployer.deploy(EscrowExchange)
  deployer.deploy(AdminEscrowActions)
};
