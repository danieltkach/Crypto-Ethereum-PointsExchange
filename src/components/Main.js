import React, { Component } from 'react';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Table from 'react-bootstrap/Table';
import styles from '../css/pointsexchange.module.css';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import ToggleButton from 'react-bootstrap/ToggleButton';
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup';

class Main extends Component {

  constructor(props) {
    super(props)
    this.state = { notesForAdmin: "", notesAdminTextCount: 0, showCompleted: false, showDepositError: false };
  }

  notesForAdminHandler = (e) => {
    this.setState({notesForAdmin: e.target.value, notesAdminTextCount: e.target.value.length});
  }

  onClickHandler = (e) => {
    const hiddenElement = e.currentTarget.nextSibling;
    hiddenElement.className.indexOf("collapse show") > -1 ? hiddenElement.classList.remove("show") : hiddenElement.classList.add("show");
  };

  amountSent(amount){
    if(Boolean(Number(amount))) {
      return(<p>The amount requested of the contract <b>has been</b> filled.</p>)
    } else {
      return(<p>The amount requested of the contract <b>has not</b> been filled.</p>)
    }
  }

  showDepositButton(depositMade, contractDetails, key) {
    if (!Boolean(Number(depositMade))) {
      var contract = this.props.contractObjects[key]
      return(<Button href="#" className={styles.actionButtons} onClick={ () => this.sendDepositByBuyerOrSeller(contract, contractDetails)}>Send Deposit</Button>)
    }
  }

  sendDepositByBuyerOrSeller(contract, contractDetails) {
    if (this.props.account === contractDetails[1]) {
      this.props.buyerDeposit(contract, contractDetails[4])
    } else {
      this.props.sellerDeposit(contract, contractDetails[4])
    }
  }

  reverseDepositButton(contractDetails, key) {
    var sellerDepositCheck = contractDetails[12]
    var buyerDepositCheck = contractDetails[13]
    var buyerCanReverseDeposit = this.props.account === contractDetails[1] && Boolean(Number(buyerDepositCheck)) === true && Boolean(Number(sellerDepositCheck)) === false
    var sellerCanReverseDeposit = this.props.account === contractDetails[2] &&Boolean(Number(buyerDepositCheck)) === false && Boolean(Number(sellerDepositCheck)) === true
    if (buyerCanReverseDeposit || sellerCanReverseDeposit) {
      var contract = this.props.contractObjects[key]
      return(<Button href="#" className={styles.actionButtons} onClick={ () => this.reverseDepositByBuyerOrSeller(contract, contractDetails)}>Reverse Deposit</Button>)
    }
  }

  reverseDepositByBuyerOrSeller(contract, contractDetails) {
    if (this.props.account === contractDetails[1]) {
      this.props.reverseBuyerDeposit(contract)
    } else {
      this.props.reverseSellerDeposit(contract)
    }
  }

  showClaimDepositsButton(signatureCount, buyerDepositCheck, sellerDepositCheck, amountCheck, signed, contractComplete, key) {
    if (Boolean(Number(buyerDepositCheck)) === true && Boolean(Number(sellerDepositCheck)) === true &&  Boolean(Number(amountCheck)) === false && Boolean(Number(signed)) === false && contractComplete === false) {
      var contract = this.props.contractObjects[key]
      return(
        <div className={styles.claimDepositsButton}>
          <p>The Signature Count is <strong>{signatureCount}</strong> <i>(2 is required to reclaim Deposit)</i>.</p>
          <Button href="#" className={styles.actionButtons} onClick={ () => this.claimDeposits(contract)}>Claim Deposit</Button>
        </div>
      )
    }
  }

  claimDeposits(contract) {
    this.props.claimDeposits(contract)
  }

  showSendAmountButton(buyer, buyerDepositCheck, sellerDepositCheck, amountCheck, amount, contractComplete, key) {
    var contract = this.props.contractObjects[key]
    if (this.props.account === buyer && Boolean(Number(buyerDepositCheck)) === true && Boolean(Number(sellerDepositCheck)) === true && Boolean(Number(amountCheck)) === false && contractComplete === false){
      return(<Button href="#" className={styles.actionButtons} onClick={ () => this.sendAmount(contract, amount) }>Send Amount Requested</Button>)
    }
  }

  sendAmount(contract, amount) {
    this.props.sendAmount(contract, amount)
  }

  // Shown to the Buyer to pay seller and end the contract
  showPaySellerButton(buyer, buyerDepositCheck, sellerDepositCheck, amountCheck, contractAddress, contractComplete, key) {
    var contract = this.props.contractObjects[key]
    if (this.props.account === buyer && Boolean(Number(buyerDepositCheck)) === true && Boolean(Number(sellerDepositCheck)) === true && Boolean(Number(amountCheck)) === true && contractComplete === false) {
      return(
        <div>
           <form onSubmit={(event) => {
            event.preventDefault();
            this.contractInterventionRequest(key, contractAddress)
          }}>
            <div className="form-group mr-sm-2">
              <b>Request Admin Intervention To Refund Buyer Notes:</b>
              <textarea id="notes" type="text" onChange={this.notesForAdminHandler} className="form-control" placeholder="I'm requesting admin intervention to refund the buyer and complete this contract because..." maxLength="100" required />
              <i className={styles.notesAdminTextCount}>{ this.state.notesAdminTextCount }/100</i>
            </div>
            <Button href="#" className={styles.actionButtons} onClick={ () => this.paySeller(contract)}>Pay Seller Requested</Button>
            <button type="submit" className="btn btn-primary">Request Admin Intervention To Refund Buyer</button>
          </form>
          <div><i><b>Warning:</b> Please be aware that paying the seller is an <b>irreversible action</b> and will complete the contract.</i></div>
          <div><i><b>Admin Intervention:</b> Please be aware that admin intervention will incur a fee of <b>1.5% of the TOTAL DEPOSIT</b> to pay for the gas fee and admin processing. You can avoid this fee by resolving your problem with the other party directly.</i></div>
        </div>
      )
    }
  }

  paySeller(contract) {
    this.props.paySeller(contract)
  }

  // Shown to the Seller to refund buyer and end the contract
  showRefundBuyerButton(seller, buyerDepositCheck, sellerDepositCheck, amountCheck, contractAddress, contractComplete, key) {
    var contract = this.props.contractObjects[key]
    if (this.props.account === seller && Boolean(Number(buyerDepositCheck)) === true && Boolean(Number(sellerDepositCheck)) === true && Boolean(Number(amountCheck)) === true && contractComplete === false ) {
      return(
        <div>
          <form onSubmit={(event) => {
            event.preventDefault();
            this.contractInterventionRequest(key, contractAddress)
          }}>
            <div className="form-group mr-sm-2">
              <b>Request Admin Intervention To Pay Seller Notes:</b>
              <textarea id="notes" type="text" onChange={this.notesForAdminHandler} className="form-control" placeholder="I'm requesting admin intervention to pay the seller and complete this contract because..." required />
              <i className={styles.notesAdminTextCount}>{ this.state.notesAdminTextCount }/100</i>
            </div>
            <Button href="#" className={styles.actionButtons} onClick={ () => this.refundBuyer(contract)}>Refund Buyer Requested</Button>
            <button type="submit" className="btn btn-primary">Request Admin Intervention To Pay Seller</button>
          </form>
          <div><i><b>Warning:</b> Please be aware that the refunding the buyer is an <b>irreversible action</b> and will complete the contract.</i></div>
          <div><i><b>Admin Intervention:</b> Please be aware that admin intervention will incur a fee of <b>1.5% of the TOTAL DEPOSIT</b> to pay for the gas fee and admin processing. You can avoid this fee by resolving your problem with the other party directly.</i></div>
        </div>
      )
    }
  }

  refundBuyer(contract) {
    this.props.refundBuyer(contract)
  }

  contractInterventionRequest(key, contractAddress) {
    this.props.contractInterventionRequest(key, this.state.notesForAdmin, contractAddress)
  }

  showAdminContractTakeActionButtons(index, address) {
    if (this.props.isAdmin === true) {
      return(
        <div>
          <Button href="#" className={styles.actionButtons} onClick={ () => this.adminContractTakeAction(index, 0, address)}>Admin Refund Buyer</Button>
          <Button href="#" className={styles.actionButtons} onClick={ () => this.adminContractTakeAction(index, 1, address)}>Admin Pay Seller</Button>
          <div><i><b>Warning:</b> Please be aware that these are <b>irreversible actions</b> and will refund <b>all deposits</b> and either refund the buyer or pay the seller the <b>amount</b>.</i> This will <b>COMPLETE</b> the contract.</div>
        </div>
      )
    }
  }

  adminContractTakeAction(index, action, address) {
    this.props.adminContractTakeAction(index, action, address)
  }

  showHideCompletedContracts(key) {
    if (parseInt(this.props.adminContractStructs[key].completed) === 0) {
      return null
    } else if (parseInt(this.props.adminContractStructs[key].completed) === 1 && this.state.showCompleted) {
      return null
    } else {
      return styles.hideCompletedContracts
    }
  }

  toggleCompleted() {
    this.setState({showCompleted: !this.state.showCompleted})
  }

  toggleButton() {
    return(
      <ToggleButtonGroup name="toggleCompleted" type="checkbox">
        <ToggleButton className="mb-2" id="toggle-check" variant="outline-primary" checked={this.state.showCompleted} onChange={() => this.toggleCompleted()}>Show Completed Contracts</ToggleButton>
      </ToggleButtonGroup>
    )
  }

  showAdminActionContractsTab() {
    if (this.props.isAdmin === true) {
      return(
        <Tab eventKey="admin-contracts" title="Admin Action Required Contracts">
          <h1><center>Admin Action Required Contracts</center></h1>
          {this.toggleButton()}
          <Table size="sm" responsive="sm" hover>
            <thead>
              <tr>
                <th>Contract Addresses:</th>
                <th>Amount</th>
                <th>Deposit</th>
                <th>Notes</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              { this.props.adminContracts.map((adminContract, key) => {
                var buyer = adminContract[0]
                var seller = adminContract[1]
                var amount = adminContract[2]
                var deposit = adminContract[3]
                var status = adminContract[4]
                var notes = adminContract[5]
                var contractAddress = adminContract[6]
                return(
                  <React.Fragment key={key}>
                    <tr key={key} onClick={this.onClickHandler} className={this.showHideCompletedContracts(key)}>
                      <td className={styles.contractIndexKey}>
                        <Button className={styles.contractIndexKeyButton} variant="link">Contract Address:{contractAddress}</Button>
                        <p className={styles.address}><b>Buyer Address:</b> {buyer}</p>
                        <p className={styles.address}><b>Seller Address:</b> {seller}</p>
                      </td>
                      <td>{window.web3.utils.fromWei((amount).toString(), 'Ether')} ETH</td>
                      <td>{window.web3.utils.fromWei((deposit).toString(), 'Ether')} ETH</td>
                      <td>{notes}</td>
                      <td>{status}</td>
                    </tr>
                    <tr className="collapse">
                      <td colSpan="7">
                        <div>
                          { (status !== "Closed") ? this.showAdminContractTakeActionButtons(key, contractAddress) : null}
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                )
              })}
            </tbody>
          </Table>
        </Tab>
      )
    }
  }

  showDepositError() {
    if (this.state.showDepositError) {
      return(
        <Alert variant="danger" onClose={() => this.setState({showDepositError: false})} dismissible>
          <Alert.Heading>Your Deposit is Too Low</Alert.Heading>
          <p>The <b>deposit</b> must be <i>at least 25%</i> of the <b>amount</b> set.</p>
        </Alert>
      )
    }
  }

  render() {
    return (
      <Container fluid>
        <Row className="justify-content-md-center">
          <Col md="auto">
          {this.showDepositError()}
            <Tabs fill justify defaultActiveKey="create-contract" id="uncontrolled-contract-template" variant="pills">
              <Tab eventKey="create-contract" title="Create Contract">
                <h1>Start a New Contract</h1>
                <form onSubmit={(event) => {
                  event.preventDefault()
                  const buyer = this.buyerAddress.value
                  const seller = this.sellerAddress.value
                  const amount = window.web3.utils.toWei(this.amount.value.toString(), 'Ether')
                  const deposit = window.web3.utils.toWei(this.deposit.value.toString(), 'Ether')
                  const notes = this.notes.value
                  if(deposit < (amount * 0.25)) {
                    {this.setState({showDepositError: true})}
                  } else {
                    this.props.createContract(buyer, seller, amount, deposit, notes)
                  }
                }}>
                  <div className="form-group mr-sm-2">
                    <input
                      id="buyerAddress"
                      type="text"
                      ref={(input) => { this.buyerAddress = input }}
                      className="form-control"
                      placeholder="Buyer Address"
                      required />
                  </div>
                  <div className="form-group mr-sm-2">
                    <input
                      id="sellerAddress"
                      type="text"
                      ref={(input) => { this.sellerAddress = input }}
                      className="form-control"
                      placeholder="Seller Address"
                      required />
                  </div>
                  <div className="form-group mr-sm-2">
                    <input
                      id="amount"
                      type="text"
                      ref={(input) => { this.amount = input }}
                      className="form-control"
                      placeholder="Amount"
                      required />
                  </div>
                  <div className="form-group mr-sm-2">
                    <input
                      id="deposit"
                      type="text"
                      ref={(input) => { this.deposit = input }}
                      className="form-control"
                      placeholder="Deposit"
                      required />
                  </div>
                   <div className="form-group mr-sm-2">
                    <textarea
                      id="notes"
                      type="text"
                      ref={(input) => { this.notes = input }}
                      className="form-control"
                      placeholder="Notes"
                      required />
                  </div>
                  <button type="submit" className="btn btn-primary">Create Contract</button>
                </form>
              </Tab>
              <Tab eventKey="my-contracts" title="My Contracts">
                <h1><center>My Contracts</center></h1>
                <Table size="sm" responsive="sm" hover>
                  <thead>
                    <tr>
                      <th>Contract Addresses:</th>
                      <th>Amount</th>
                      <th>Deposit</th>
                      <th>Notes</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    { this.props.myContractsDetails.map((contractDetails, key) => {
                      var buyer = contractDetails[1]
                      var seller = contractDetails[2]
                      var amount = contractDetails[3]
                      var deposit = contractDetails[4]
                      var signatureCount = contractDetails[5]
                      var status = contractDetails[6]
                      var notes = contractDetails[7]
                      var depositCheck = contractDetails[8]
                      var amountCheck = contractDetails[9]
                      var currentUserSignature = contractDetails[10]
                      var contractAddress = contractDetails[11]
                      var sellerDepositCheck = contractDetails[12]
                      var buyerDepositCheck = contractDetails[13]
                      var contractComplete = contractDetails[14]
                      return(
                        <React.Fragment key={key}>
                          <tr key={key} onClick={this.onClickHandler}>
                            <td className={styles.contractIndexKey}>
                              <Button className={styles.contractIndexKeyButton} variant="link">Contract Address:{contractAddress}</Button>
                              <p className={styles.address}><b>Buyer Address:</b> {buyer}</p>
                              <p className={styles.address}><b>Seller Address:</b> {seller}</p>
                            </td>
                            <td>{window.web3.utils.fromWei((amount).toString(), 'Ether')} ETH</td>
                            <td>{window.web3.utils.fromWei((deposit).toString(), 'Ether')} ETH</td>
                            <td>{notes}</td>
                            <td>{status}</td>
                          </tr>
                          <tr className="collapse">
                            <td colSpan="7">
                              <div>
                              <p>The Signature Count is <strong>{signatureCount}</strong> <i>(2 is required to reclaim Deposit)</i>.</p>
                              {(status !== "Closed") ? this.showDepositButton(depositCheck, contractDetails, key) : null}
                              {(status !== "Closed") ? this.reverseDepositButton(contractDetails, key) : null}
                              {(status !== "Closed") ? this.showClaimDepositsButton(signatureCount, buyerDepositCheck, sellerDepositCheck, amountCheck, currentUserSignature, contractComplete, key) : null}
                              {(status !== "Closed") ? this.showSendAmountButton(buyer, buyerDepositCheck, sellerDepositCheck, amountCheck, amount, contractComplete, key) : null}
                              {(status !== "Closed") ? this.showPaySellerButton(buyer, buyerDepositCheck, sellerDepositCheck, amountCheck, contractAddress, contractComplete, key) : null}
                              {(status !== "Closed") ? this.showRefundBuyerButton(seller, buyerDepositCheck, sellerDepositCheck, amountCheck, contractAddress, contractComplete, key) : null}
                              </div>
                            </td>
                          </tr>
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </Table>
              </Tab>
              {this.showAdminActionContractsTab()}
            </Tabs>   
          </Col>
        </Row>
      </Container>
    );
  }
}

export default Main;