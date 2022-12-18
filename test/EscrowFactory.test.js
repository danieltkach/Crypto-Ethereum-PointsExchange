const EscrowFactory = artifacts.require("../contracts/EscrowFactory.sol")

const {
  BN,           // Big Number support
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

require('chai').use(require('chai-as-promised')).should()

contract("EscrowFactory", ([deployer, buyer, seller]) => {
  let contractClaimDeposit;
  let contractBuyerSellerDeposit;
  let contractReverseBuyerDeposit;
  let contractReverseSellerDeposit;
  let contractSendAmount;
  let contractPaySeller;
  let contractRefundBuyer;
  let depositValue = "10"
  let amountValue = "10"

  before(async() => {
    contractClaimDeposit = await EscrowFactory.new(buyer, seller, amountValue, depositValue, "Some notes", deployer)
    contractBuyerSellerDeposit = await EscrowFactory.new(buyer, seller, amountValue, depositValue, "Some notes", deployer)
    contractReverseBuyerDeposit = await EscrowFactory.new(buyer, seller, amountValue, depositValue, "Some notes", deployer)
    contractReverseSellerDeposit = await EscrowFactory.new(buyer, seller, amountValue, depositValue, "Some notes", deployer)
    contractSendAmount = await EscrowFactory.new(buyer, seller, amountValue, depositValue, "Some notes", deployer)
    contractPaySeller = await EscrowFactory.new(buyer, seller, amountValue, depositValue, "Some notes", deployer)
    contractRefundBuyer = await EscrowFactory.new(buyer, seller, amountValue, depositValue, "Some notes", deployer)
    contractAdminActionComplete = await EscrowFactory.new(buyer, seller, amountValue, depositValue, "Some notes", deployer)
    contractRequestAdminAction = await EscrowFactory.new(buyer, seller, amountValue, depositValue, "Some notes", deployer)
  })

  describe('EscrowFactory BuyerDeposit', async () => {
    it('rejects buyerDeposit with Invalid deposit ', async () => {
      await expectRevert(contractBuyerSellerDeposit.buyerDeposit({from: buyer, value: "1000"}),  "Invalid deposit")
    })

    it('buyer deposits', async() => {
      var buyerDeposit_receipt = await contractBuyerSellerDeposit.buyerDeposit({from: buyer, value: depositValue});
      expectEvent(buyerDeposit_receipt, 'BuyerDeposited', {from: buyer, msg: "deposited", amount: depositValue });
      var buyer_deposit = await contractBuyerSellerDeposit.getIfAddressDeposited(buyer)
      assert.equal(buyer_deposit, 1, "depositCheck[buyer] is 1")
      var new_balance = await web3.eth.getBalance(contractBuyerSellerDeposit.address)
      assert.equal(new_balance, parseInt(depositValue))
    })

    it('rejects buyerDeposit with Buyer already deposited ', async () => {
      await expectRevert(contractBuyerSellerDeposit.buyerDeposit({from: buyer, value: depositValue}),  "Deposited")
    })
  })

  describe('EscrowFactory SellerDeposit', async () => {
    it('rejects sellerDeposit with Invalid deposit ', async () => {
      await expectRevert(contractBuyerSellerDeposit.sellerDeposit({from: seller, value: "1000"}),  "Invalid deposit")
    })

    it('seller deposits', async() => {
      var sellerDeposit_receipt = await contractBuyerSellerDeposit.sellerDeposit({from: seller, value: depositValue});
      expectEvent(sellerDeposit_receipt, 'SellerDeposited', {from: seller, msg: "deposited", amount: depositValue });
      var seller_deposit = await contractBuyerSellerDeposit.getIfAddressDeposited(seller)
      assert.equal(seller_deposit, 1, "depositCheck[seller] is 1")
      var new_balance = await web3.eth.getBalance(contractBuyerSellerDeposit.address)
      assert.equal(new_balance, parseInt(depositValue) + parseInt(depositValue))
    })

    it('rejects SellerDeposit with Seller already deposited ', async () => {
      await expectRevert(contractBuyerSellerDeposit.sellerDeposit({from: seller, value: depositValue}),  "Deposited")
    })
  })

  describe('EscrowFactory ReverseBuyerDeposit', async () => {
    it('rejects ReverseBuyerDeposit with the buyer has not desposited CANNOT reverseDeposit', async () => {
      await expectRevert(contractReverseBuyerDeposit.reverseBuyerDeposit({from: buyer}),  "deposit required")
    })

    it('succeeds', async() => {
      await contractReverseBuyerDeposit.buyerDeposit({from: buyer, value: depositValue});
      var new_balance = await web3.eth.getBalance(contractReverseBuyerDeposit.address)
      assert.equal(new_balance, depositValue)
      var buyerReverseDeposit_receipt = await contractReverseBuyerDeposit.reverseBuyerDeposit({from: buyer})
      expectEvent(buyerReverseDeposit_receipt, 'BuyerDepositReversed', {msg: "buyer reversed deposit"});
      var buyer_reverse_deposit = await contractReverseBuyerDeposit.getIfAddressDeposited(buyer)
      assert.equal(buyer_reverse_deposit, 0, "depositCheck[buyer] is 0")
      var new_balance = await web3.eth.getBalance(contractReverseBuyerDeposit.address)
      assert.equal(new_balance, 0)
      await contractReverseBuyerDeposit.buyerDeposit({from: buyer, value: depositValue});
    })

    it('rejects ReverseBuyerDeposit with the the seller has deposited already CANNOT reverseDeposit', async () => {
      await contractReverseBuyerDeposit.sellerDeposit({from: seller, value: depositValue});
      await expectRevert(contractReverseBuyerDeposit.reverseBuyerDeposit({from: buyer}),  "deposit required")
    })
  })

  describe('EscrowFactory ReverseSellerDeposit', async () => {
    it('rejects ReverseSellerDeposit with the seller has not desposited CANNOT reverseDeposit', async () => {
      await expectRevert(contractReverseSellerDeposit.reverseSellerDeposit({from: seller}),  "deposit required")
    })

    it('succeeds', async() => {
      await contractReverseSellerDeposit.sellerDeposit({from: seller, value: depositValue});
      var new_balance = await web3.eth.getBalance(contractReverseSellerDeposit.address)
      assert.equal(new_balance, depositValue)
      var sellerReverseDeposit_receipt = await contractReverseSellerDeposit.reverseSellerDeposit({from: seller})
      expectEvent(sellerReverseDeposit_receipt, 'SellerDepositReversed', {msg: "seller reversed deposit"});
      var seller_reverse_deposit = await contractReverseSellerDeposit.getIfAddressDeposited(seller)
      assert.equal(seller_reverse_deposit, 0, "depositCheck[seller] is 0")
      var new_balance = await web3.eth.getBalance(contractReverseSellerDeposit.address)
      assert.equal(new_balance, 0)
      await contractReverseSellerDeposit.sellerDeposit({from: seller, value: depositValue});
    })

    it('rejects ReverseSellerDeposit with the the buyer has deposited already CANNOT reverseDeposit', async () => {
      await contractReverseSellerDeposit.buyerDeposit({from: buyer, value: depositValue});
      await expectRevert(contractReverseSellerDeposit.reverseSellerDeposit({from: seller}),  "deposit required")
    })
  })

  describe('EscrowFactory ClaimDeposits', async () => {
    it('rejects claimDeposits with buyer ', async () => {
      await expectRevert(contractClaimDeposit.claimDeposits({from: buyer}),  "deposit required")
      await contractClaimDeposit.buyerDeposit({from: buyer, value: depositValue});
    })

    it('rejects claimDeposits with seller ', async () => {
      await expectRevert(contractClaimDeposit.claimDeposits({from: seller}),  "deposit required")
      await contractClaimDeposit.sellerDeposit({from: seller, value: depositValue});
      var new_balance = await web3.eth.getBalance(contractClaimDeposit.address)
      assert.equal(new_balance, parseInt(depositValue)+parseInt(depositValue))
    })

    it('allows ClaimDeposits for buyer ending with signatureCount = 1', async() => {
      var claimDeposit_receipt = await contractClaimDeposit.claimDeposits({from: buyer});
      expectEvent(claimDeposit_receipt, 'DepositPartialClaim', { msg: "the deposit claim has 1 out of 2 necessary signatures" });
      var buyer_signature = await contractClaimDeposit.getSignature(buyer)
      assert.equal(buyer_signature, 1, "signature[buyer] is 1")  
    })

    it('rejects claimDeposits with buyer signature already signed ', async () => {
      await expectRevert(contractClaimDeposit.claimDeposits({from: buyer}), "already signed")
    })

    it('allows ClaimDeposits for seller ending with signatureCount = 0', async() => {
      var claimDeposit_receipt = await contractClaimDeposit.claimDeposits({from: seller});
      expectEvent(claimDeposit_receipt, 'DepositsClaimed', { msg: "the deposits have been returned" });
      var buyer_deposit = await contractClaimDeposit.getIfAddressDeposited(buyer)
      var seller_deposit = await contractClaimDeposit.getIfAddressDeposited(seller)
      var buyer_signature = await contractClaimDeposit.getSignature(buyer)
      var seller_signature = await contractClaimDeposit.getSignature(seller)
      var signature_count = await contractClaimDeposit.signatureCount()
      var new_balance = await web3.eth.getBalance(contractClaimDeposit.address)
      assert.equal(new_balance, 0)
      assert.equal(buyer_signature, 0, "depositCheck[buyer] is 0")
      assert.equal(seller_signature, 0, "depositCheck[seller] is 0")
      assert.equal(buyer_signature, 0, "signature[buyer] is 0")
      assert.equal(seller_signature, 0, "signature[seller] is 0")
      assert.equal(signature_count, 0, "signatureCount is 0")
      await contractClaimDeposit.buyerDeposit({from: buyer, value: depositValue});
      await contractClaimDeposit.sellerDeposit({from: seller, value: depositValue});
      await contractClaimDeposit.sendAmount({from: buyer, value: amountValue});
    })

    it('rejects claimDeposits with amountCheck ', async () => {
      await expectRevert(contractClaimDeposit.claimDeposits({from: buyer}),  "amount exist")
    })
  })

  describe('EscrowFactory SendAmount', async () => {
    it('rejects with invalid amount', async () => {
      await expectRevert(contractSendAmount.sendAmount({from: buyer, value: "1000"}),  "Invalid amount")
    })

    it('rejects with the buyer has not deposited yet', async () => {
      await expectRevert(contractSendAmount.sendAmount({from: buyer, value: amountValue}),  "deposit required")
    })

    it('rejects with the seller has not deposited yet', async () => {
      await contractSendAmount.buyerDeposit({from: buyer, value: depositValue});
      await expectRevert(contractSendAmount.sendAmount({from: buyer, value: amountValue}),  "deposit required")
    })

    it('succeeds', async() => {
      await contractSendAmount.sellerDeposit({from: seller, value: depositValue});
      var send_amount = await contractSendAmount.sendAmount({from: buyer, value: amountValue})
      var amount_check = await contractSendAmount.getAmountCheck(buyer)
      assert.equal(amount_check, 1, "amountCheck[buyer] is 1")
      expectEvent(send_amount, 'AmountSent', {msg: "Buyer has sent the payment amount to the escrow"});
      var new_balance = await web3.eth.getBalance(contractSendAmount.address)
      assert.equal(new_balance, parseInt(depositValue) + parseInt(depositValue) + parseInt(amountValue))
    })

    it('rejects with the buyer has already send the amount', async () => {
      await expectRevert(contractSendAmount.sendAmount({from: buyer, value: amountValue}),  "amount exist")
    })
  })

  describe('EscrowFactory PaySeller', async () => {
    it('rejects with the buyer has not deposited yet', async () => {
      await expectRevert(contractPaySeller.paySeller({from: buyer}),  "deposit required")
    })

    it('rejects with the seller has not deposited yet', async () => {
      await contractPaySeller.buyerDeposit({from: buyer, value: depositValue});
      await expectRevert(contractPaySeller.paySeller({from: buyer}),  "deposit required")
    })

    it('rejects with the buyer has not sent the amount yet', async () => {
      await contractPaySeller.sellerDeposit({from: seller, value: depositValue});
      await expectRevert(contractPaySeller.paySeller({from: buyer}),  "amount required")
    })

    it('succeeds', async() => {
      await contractPaySeller.sendAmount({from: buyer, value: amountValue})
      var pay_seller = await contractPaySeller.paySeller({from: buyer})
      expectEvent(pay_seller, 'SellerPaid', {msg: "The seller has been paid and all deposits have been returned - transaction complete"});
      var new_balance = await web3.eth.getBalance(contractPaySeller.address)
      var contractComplete = await contractPaySeller.contractComplete()
      var status = await contractPaySeller.getContractStatus()
      assert.equal(new_balance, 0)
      assert.equal(contractComplete, true)
      assert.equal(status, "Closed")
    })
  })

  describe('EscrowFactory RefundBuyer', async () => {
    it('rejects with the buyer has not deposited yet', async () => {
      await expectRevert(contractRefundBuyer.refundBuyer({from: seller}),  "deposit required")
    })

    it('rejects with the seller has not deposited yet', async () => {
      await contractRefundBuyer.buyerDeposit({from: buyer, value: depositValue});
      await expectRevert(contractRefundBuyer.refundBuyer({from: seller}),  "deposit required")
    })

    it('rejects with the buyer has not sent the amount yet', async () => {
      await contractRefundBuyer.sellerDeposit({from: seller, value: depositValue});
      await expectRevert(contractRefundBuyer.refundBuyer({from: seller}),  "amount required")
    })

    it('succeeds', async() => {
      await contractRefundBuyer.sendAmount({from: buyer, value: amountValue})
      var refund_buyer = await contractRefundBuyer.refundBuyer({from: seller})
      expectEvent(refund_buyer, 'BuyerRefunded', {msg: "The buyer has been refunded and all deposits have been returned - transaction cancelled"});
      var new_balance = await web3.eth.getBalance(contractRefundBuyer.address)
      var contractComplete = await contractRefundBuyer.contractComplete()
      var status = await contractRefundBuyer.getContractStatus()
      assert.equal(new_balance, 0)
      assert.equal(contractComplete, true)
      assert.equal(status, "Closed")
    })
  })

  describe('EscrowFactory adminContractTakeAction', async () => {
    it('succeeds refunds', async() => {
      await contractAdminActionComplete.buyerDeposit({from: buyer, value: depositValue});
      await contractAdminActionComplete.sellerDeposit({from: seller, value: depositValue});
      await contractAdminActionComplete.sendAmount({from: buyer, value: amountValue})
      await contractAdminActionComplete.requestAdminAction("Buyer Request: I request a refund", {from: buyer})
      var reversed_contract = await contractAdminActionComplete.adminContractTakeAction(true, 0)
      expectEvent(reversed_contract, 'ContractActionCompletedByAdmin', {msg: "The contract has been completely reverted by admin. All deposits and amounts have been refunded or paid out."});
      var new_balance = await web3.eth.getBalance(contractAdminActionComplete.address)
      var contractComplete = await contractAdminActionComplete.contractComplete()
      var status = await contractAdminActionComplete.getContractStatus()
      assert.equal(new_balance, 0)
      assert.equal(contractComplete, true)
      assert.equal(status, "Closed")
      var buyer_deposit = await contractAdminActionComplete.getIfAddressDeposited(buyer)
      assert.equal(buyer_deposit, 0, "depositCheck[buyer] is 0")
      var seller_deposit = await contractAdminActionComplete.getIfAddressDeposited(seller)
      assert.equal(seller_deposit, 0, "depositCheck[seller] is 0")
      var amount_check = await contractAdminActionComplete.getAmountCheck(buyer)
      assert.equal(amount_check, 0, "amountCheck[buyer] is 0")
      var notes_check = await contractAdminActionComplete.notes()
      assert.equal(notes_check, "Some notes \n Buyer Request: I request a refund", "notes is correct")
    })

    it('succeeds pay seller', async() => {
      await contractAdminActionComplete.buyerDeposit({from: buyer, value: depositValue});
      await contractAdminActionComplete.sellerDeposit({from: seller, value: depositValue});
      await contractAdminActionComplete.sendAmount({from: buyer, value: amountValue})
      await contractAdminActionComplete.requestAdminAction("Seller Request: I request a to be paid", {from: seller})
      var reversed_contract = await contractAdminActionComplete.adminContractTakeAction(true, 1)
      expectEvent(reversed_contract, 'ContractActionCompletedByAdmin', {msg: "The contract has been completely reverted by admin. All deposits and amounts have been refunded or paid out."});
      var new_balance = await web3.eth.getBalance(contractRefundBuyer.address)
      var contractComplete = await contractAdminActionComplete.contractComplete()
      var status = await contractAdminActionComplete.getContractStatus()
      assert.equal(new_balance, 0)
      assert.equal(contractComplete, true)
      assert.equal(status, "Closed")
      var buyer_deposit = await contractAdminActionComplete.getIfAddressDeposited(buyer)
      assert.equal(buyer_deposit, 0, "depositCheck[buyer] is 0")
      var seller_deposit = await contractAdminActionComplete.getIfAddressDeposited(seller)
      assert.equal(seller_deposit, 0, "depositCheck[seller] is 0")
      var amount_check = await contractAdminActionComplete.getAmountCheck(buyer)
      assert.equal(amount_check, 0, "amountCheck[buyer] is 0")
      var notes_check = await contractAdminActionComplete.notes()
      assert.equal(notes_check, "Some notes \n Buyer Request: I request a refund \n Seller Request: I request a to be paid", "notes is correct")
    })

    it('gets the contract owner', async() => {
      var owner = await contractAdminActionComplete.owner()
      assert.equal(owner, deployer, "Owner exists")
    })
  })

  describe('EscrowFactory RequestAdminAction', async () => {
    it('rejects with the buyer has not deposited yet', async () => {
      await expectRevert(contractRequestAdminAction.requestAdminAction("Buyer Request: I request a refund", {from: buyer}),  "deposit required")
    })

    it('rejects with the seller has not deposited yet', async () => {
      await contractRequestAdminAction.buyerDeposit({from: buyer, value: depositValue});
      await expectRevert(contractRequestAdminAction.requestAdminAction("Buyer Request: I request a refund", {from: buyer}),  "deposit required")
    })

    it('rejects with the buyer has not sent the amount yet', async () => {
      await contractRequestAdminAction.sellerDeposit({from: seller, value: depositValue});
      await expectRevert(contractRequestAdminAction.requestAdminAction("Buyer Request: I request a refund", {from: buyer}),  "amount required")
    })

    it('succeeds', async() => {
      await contractRequestAdminAction.sendAmount( {from: buyer, value: amountValue})
      var pay_seller = await contractRequestAdminAction.requestAdminAction("Buyer Request: I request a refund", {from: buyer})
      expectEvent(pay_seller, 'AdminActionRequested', {msg: "An action from admin has been requested."});
      var status = await contractRequestAdminAction.getContractStatus()
      assert.equal(status, "Request Action")
      var notes_check = await contractRequestAdminAction.notes()
      assert.equal(notes_check, "Some notes \n Buyer Request: I request a refund", "notes is correct")
    })
  })
   
})