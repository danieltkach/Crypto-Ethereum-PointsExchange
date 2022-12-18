pragma solidity ^0.5.16;

contract EscrowFactory {
    enum Status { OPEN, PENDING, CLOSED, REQUESTADMINACTION }
    enum AdminAction { REFUNDBUYER, PAYSELLER}

    //storage
    
    address payable public buyer;
    address payable public seller;
    address payable public owner;
    address[] public party;
    uint public amount;
    uint public deposit;
    uint8 public signatureCount;
    Status public status;
    string public notes;
    bool public contractComplete;
    mapping (address => bool) isAParty;
    mapping (address => uint) public signatures;
    mapping (address => uint) public depositCheck;
    mapping (address => uint) public amountCheck;

    //modifiers
    //only buyer can access
    modifier isBuyer() {
        require(msg.sender == buyer);
        _;
    }

    //only seller can access
    modifier isSeller() {
        require(msg.sender == seller);
        _;
    }

    //only the parties involved in the transaction can access.
    modifier ifIsAParty(address aParty) {
        require(isAParty[aParty]);
        _;
    }

    modifier isAdminCalled(bool admin) {
        require(admin == true);
        _;
    }

     //events
    event BuyerDeposited(address from, string msg, uint amount);
    event SellerDeposited(address from, string msg, uint amount);
    event BuyerDepositReversed(string msg);
    event SellerDepositReversed(string msg);
    event DepositPartialClaim(string msg);
    event DepositsClaimed(string msg);
    event AmountSent(string msg);
    event SellerPaid(string msg);
    event BuyerRefunded(string msg);
    event ContractActionCompletedByAdmin(string msg);
    event AdminActionRequested(string msg);

    constructor(address payable _buyer, address payable _seller, uint _amount, uint _deposit, string memory _notes, address payable _owner) public {
        buyer = _buyer;
        seller = _seller;
        amount = _amount;
        deposit = _deposit;
        notes = _notes;
        status = Status.OPEN;
        contractComplete = false;
        party.push(_buyer);
        party.push(_seller);
        isAParty[_buyer] = true;
        isAParty[_seller] = true;
        owner = _owner;
    }

    /* Deposit function for the buyer - checks that the message sender
    is the buyer, the amount being sent is equal to the deposit amount
    and restricts the buyer from depositing more than once - TESTED*/
    function buyerDeposit() public payable isBuyer {
        require(msg.value == deposit, "Invalid deposit"); // Require value submitted is equal to the deposit in the contract.
        require(depositCheck[msg.sender] == 0, "Deposited"); // Require buyer has not deposited yet
        depositCheck[msg.sender] = 1; // Set buyer deposited to true
        emit BuyerDeposited(msg.sender, "deposited", msg.value);
    }

    /* Deposit function for the seller - checks that the message sender
    is the seller, the amount being sent is equal to the deposit amount
    and restricts the seller from depositing more than once - TESTED*/
    function sellerDeposit() public payable isSeller {
        require(msg.value == deposit, "Invalid deposit"); // Require value submitted is equal to the deposit in the contract.
        require(depositCheck[msg.sender] == 0,  "Deposited"); // Require seller has not deposited yet
        depositCheck[msg.sender] = 1;// Set seller deposited to true
        emit SellerDeposited(msg.sender, "deposited", msg.value);
    }

    /* Function for buyer to retrieve deposit in the scenario where only the
    buyer has interacted with the contract and the transaction is no longer
    going ahead.*/

    function reverseBuyerDeposit() public isBuyer {
        require(depositCheck[buyer] == 1, "deposit required");
        require(depositCheck[seller] == 0, "deposit required");
        depositCheck[buyer] = 0;
        buyer.transfer(deposit);
        emit BuyerDepositReversed("buyer reversed deposit");
    }

    /* Function for seller to retrieve deposit in the scenario where only the
    seller has interacted with the contract and the transaction is no longer
    going ahead.*/

    function reverseSellerDeposit() public isSeller {
        require(depositCheck[seller] == 1, "deposit required");
        require(depositCheck[buyer] == 0, "deposit required");
        depositCheck[seller] = 0;
        seller.transfer(deposit);
        emit SellerDepositReversed("seller reversed deposit");
    }

    /* Function for both parties to reverse their deposits when both the buyer
    and seller have made their deposits but no longer wish to proceed, both must
    sign off on this by calling this function - TESTED*/

    function claimDeposits() public ifIsAParty(msg.sender) {
        require(depositCheck[buyer] == 1, "deposit required");
        require(depositCheck[seller] == 1, "deposit required");
        require(amountCheck[buyer] == 0, "amount exist");
        require(signatures[msg.sender] == 0, "already signed");
        signatures[msg.sender] = 1;
        signatureCount ++;

        if (signatureCount == 1) {
            emit DepositPartialClaim("the deposit claim has 1 out of 2 necessary signatures");
        } else if (signatureCount == 2) {
            buyer.transfer(deposit);
            seller.transfer(deposit);
            depositCheck[buyer] = 0;
            depositCheck[seller] = 0;
            signatures[buyer] = 0;
            signatures[seller] = 0;
            signatureCount = 0;
            emit DepositsClaimed("the deposits have been returned");
        }
    }

    /* Function to allow the buyer to send the amount which is to eventually
    be transferred to the seller. Checks that the buyer is sending the correct
    amount, checks that both seller and buyer have made the required deposits 
    and restricts the buyer from making multiple payments */

    function sendAmount() public payable isBuyer {
        require(msg.value == amount, "Invalid amount"); // Check to see correct amount is sent.
        require(depositCheck[buyer] == 1, "deposit required");
        require(depositCheck[seller] == 1, "deposit required");
        require(amountCheck[msg.sender] == 0, "amount exist");
        amountCheck[msg.sender] = 1;
        emit AmountSent("Buyer has sent the payment amount to the escrow");
    }

    /* complete transaction: transferring specified amount to the seller and 
    returning deposits to both parties */
    /* NEW FUNCTION EXTRA: This should automatically pay seller when it passes expiry time (i.e. the flight time) and then automatically return deposits. Developer fee should be collected here */
    function paySeller() public isBuyer {
        require(depositCheck[buyer] == 1, "deposit required");
        require(depositCheck[seller] == 1, "deposit required");
        require(amountCheck[buyer] == 1, "amount required");
        contractComplete = true;
        status = Status.CLOSED;
        seller.transfer(amount);
        buyer.transfer(deposit);
        seller.transfer(deposit);
        emit SellerPaid("The seller has been paid and all deposits have been returned - transaction complete");
    }

    /*cancel transaction: refunding the specified amount to the buyer and 
    returning deposits to both parties */
    /* NEW FUNCTION EXTRA: This can only be called before the expiry time. (i.e. 1 or 2 days before flight time) and then automatically return deposits. Developer fee should be collected here */
    function refundBuyer() public isSeller {
        require(depositCheck[buyer] == 1, "deposit required");
        require(depositCheck[seller] == 1, "deposit required");
        require(amountCheck[buyer] == 1, "amount required");
        contractComplete = true;
        status = Status.CLOSED;
        buyer.transfer(amount);
        seller.transfer(deposit);
        buyer.transfer(deposit);
        emit BuyerRefunded("The buyer has been refunded and all deposits have been returned - transaction cancelled");
    }

    function requestAdminAction(string memory _notes) public {
        require(depositCheck[buyer] == 1, "deposit required");
        require(depositCheck[seller] == 1, "deposit required");
        require(amountCheck[buyer] == 1, "amount required");
        status = Status.REQUESTADMINACTION;
        notes = append(notes, " \n ", _notes);
        emit AdminActionRequested("An action from admin has been requested.");
    }

    function adminContractTakeAction(bool isAdmin, uint8 _action) public isAdminCalled(isAdmin) {
        // Charge a fee (i.e. 1-2%) for reversing the contract. Send this fee to me. And I will reimburse our employees/admins. And keep the difference.
        uint ownerReverseFee = deposit * 15 / 1000; // 1.5% fee for reversing contract.
        uint depositAfterFees = (deposit / 2) - ownerReverseFee ;
        uint adminFees = deposit - ownerReverseFee;
        owner.transfer(adminFees);
        if (depositCheck[buyer] == 1) {
            buyer.transfer(depositAfterFees);
            depositCheck[buyer] = 0;
        }
        if (depositCheck[seller] == 1) {
            seller.transfer(depositAfterFees);
            depositCheck[seller] = 0;
        }
        if (amountCheck[buyer] == 1 && status == Status.REQUESTADMINACTION && _action == uint8(AdminAction.REFUNDBUYER)) {
            buyer.transfer(amount);
            amountCheck[buyer] = 0;
        } else if (amountCheck[buyer] == 1 && status == Status.REQUESTADMINACTION && _action == uint8(AdminAction.PAYSELLER)) {
            seller.transfer(amount);
            amountCheck[buyer] = 0;
        }
        contractComplete = true;
        status = Status.CLOSED;
        emit ContractActionCompletedByAdmin("The contract has been completely reverted by admin. All deposits and amounts have been refunded or paid out.");
    }

    function getIfAddressDeposited(address a) public view returns (uint){
        return depositCheck[a];
    }

    function getContractStatus() public view returns (string memory) {
        if (status == Status.OPEN){
            return "Open";
        } else if (status == Status.PENDING){
            return "Pending";
        } else if (status == Status.REQUESTADMINACTION) {
            return "Request Action";
        } else{
            return "Closed";
        }
    }

    function getSignature(address a) public view returns (uint) {
        return signatures[a];
    }

    function getAmountCheck(address a) public view returns (uint){
        return amountCheck[a];
    }

    function append(string memory a, string memory b, string memory c) internal pure returns (string memory) {
        return string(abi.encodePacked(a, b, c));
    }
}