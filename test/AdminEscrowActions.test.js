const AdminEscrowActions = artifacts.require("../contracts/AdminEscrowActions.sol")
const EscrowFactory = artifacts.require("../contracts/EscrowFactory.sol")

const {
  BN,           // Big Number support
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

require('chai').use(require('chai-as-promised')).should()

contract("AdminEscrowActions", ([deployer, buyer, seller]) => {
  let adminEscrowActions;
  let depositValue = "10";
  let amountValue = "10";

  before(async() => {
    adminEscrowAction = await AdminEscrowActions.deployed()
    retrievedContract = await EscrowFactory.new(buyer, seller, amountValue, depositValue, "Some notes", deployer)
    retrievedContract2 = await EscrowFactory.new(buyer, seller, amountValue, depositValue, "Some notes", deployer)
    await retrievedContract.buyerDeposit({from: buyer, value: depositValue});
    await retrievedContract.sellerDeposit({from: seller, value: depositValue});
    await retrievedContract.sendAmount({from: buyer, value: amountValue});
    await retrievedContract2.buyerDeposit({from: buyer, value: depositValue});
    await retrievedContract2.sellerDeposit({from: seller, value: depositValue});
    await retrievedContract2.sendAmount({from: buyer, value: amountValue});
  })

  describe('contract', async () => {
    it('creates contractInterventionRequest and fills in adminNeededContracts and RequestedHelpContractExists', async () => {
      return AdminEscrowActions.deployed().then(function(instance) {
        adminEscrowInstance = instance
        admin_request = adminEscrowAction.contractInterventionRequest(0, "some notes", retrievedContract.address);
        return admin_request
      }).then(function(receipt){
        expectEvent(receipt, 'ContractInterventionRequestMade', {msg: "Admin Intervention Requested!"});
        return adminEscrowInstance.adminNeededContractCount();
      }).then(function(returned_count){
        assert.equal(returned_count, 1, "The adminNeededContractCount is increased to 1");
        return adminEscrowInstance.adminNeededContracts(0);
      }).then(function(admin_needed_contracts_receipt) {
        assert.equal(admin_needed_contracts_receipt.contractIndexOnEscrowExchange, 0, 'index is correct');
        assert.equal(admin_needed_contracts_receipt.completed, 0, 'false is correct');
        assert.equal(admin_needed_contracts_receipt.contractAddress, retrievedContract.address, 'address is correct');
        return adminEscrowInstance.RequestedHelpContractExists(admin_needed_contracts_receipt.contractAddress);
      }).then(function(contract_exists_receipts){
        assert.equal(contract_exists_receipts, true, "requested contract help exists");
        admin_request2 = adminEscrowInstance.contractInterventionRequest(0, "some notes 2", retrievedContract.address);
        return admin_request2;
      }).then(function(receipt2){
        expectEvent(receipt2, 'ContractInterventionRequestMade', {msg: "Admin Intervention Requested!"});
        return adminEscrowInstance.adminNeededContractCount();
      }).then(function(returned_count){
        assert.equal(returned_count, 1, "The adminNeededContractCount remained at 1");
      })
    })

    it("resolves the contract with adminContractTakeAction", async () => {
      return AdminEscrowActions.deployed().then(function(instance) {
        adminEscrowInstance = instance
        adminEscrowInstance.contractInterventionRequest(0, "some notes", retrievedContract.address);
        return adminEscrowInstance.adminContractTakeAction(0, 0, retrievedContract.address);
      }).then(function(admin_complete_receipt){
        expectEvent(admin_complete_receipt, 'AdminContractActionTaken', {msg: "Admin has taken an action."});
        return adminEscrowInstance.adminNeededContracts(0);
      }).then(function(contract_receipt) {
        assert.equal(contract_receipt.completed, 1, 'true is correct');
      })
    })

    it("getRetrievedContract and its attributes", async () => {
      return AdminEscrowActions.deployed().then(function(instance) {
        adminEscrowInstance = instance
        const event_receipt = adminEscrowInstance.contractInterventionRequest(0, "some notes", retrievedContract2.address);
        return event_receipt;
      }).then(function(event_receipt){
        expectEvent(event_receipt, 'ContractInterventionRequestMade', {msg: "Admin Intervention Requested!"});
        const returned_contract2 = adminEscrowInstance.getRetrievedContract(retrievedContract2.address);
        return returned_contract2
      }).then(function(returned_contract2){
        assert.equal(returned_contract2[0], buyer, 'buyer is correct')
        assert.equal(returned_contract2[1], seller, 'seller is correct')
        assert.equal(returned_contract2[2].toString(), amountValue, 'amount is correct')
        assert.equal(returned_contract2[3].toString(), depositValue, 'deposit is correct')
        assert.equal(returned_contract2[4], "Request Action", 'status is correct')
        assert.equal(returned_contract2[5], "Some notes \n some notes", 'notes is correct')
      })
    })

    it("setsAdmin and getsAdmin", async() => {
      return AdminEscrowActions.deployed().then(function(instance) {
        adminEscrowInstance = instance
        const receipt = adminEscrowInstance.setAdmin(true, buyer, {from: deployer})
        return receipt
      }).then(function(receipt){
        const admin_result = adminEscrowInstance.getAdmin(buyer)
        return admin_result
      }).then(function(admin_result){
        assert.equal(admin_result, true, "address is an admin");
      })
    })
  })
})