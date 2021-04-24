require("dotenv").config();
const express = require("express");

const router = express.Router();

const algosdk = require("algosdk");

/**
 * utility function to wait on a transaction to be confirmed
 * the timeout parameter indicates how many rounds do you wish to check pending transactions for
 */
const waitForConfirmation = async function (algodclient, txId, timeout) {
  // Wait until the transaction is confirmed or rejected, or until 'timeout'
  // number of rounds have passed.
  //     Args:
  // txId(str): the transaction to wait for
  // timeout(int): maximum number of rounds to wait
  // Returns:
  // pending transaction information, or throws an error if the transaction
  // is not confirmed or rejected in the next timeout rounds
  if (algodclient == null || txId == null || timeout < 0) {
    throw "Bad arguments.";
  }
  let status = await algodclient.status().do();
  if (status == undefined) throw new Error("Unable to get node status");
  let startround = status["last-round"] + 1;
  let currentround = startround;

  while (currentround < startround + timeout) {
    let pendingInfo = await algodclient
      .pendingTransactionInformation(txId)
      .do();
    if (pendingInfo != undefined) {
      if (
        pendingInfo["confirmed-round"] !== null &&
        pendingInfo["confirmed-round"] > 0
      ) {
        //Got the completed Transaction
        return pendingInfo;
      } else {
        if (
          pendingInfo["pool-error"] != null &&
          pendingInfo["pool-error"].length > 0
        ) {
          // If there was a pool error, then the transaction has been rejected!
          throw new Error(
            "Transaction Rejected" + " pool error" + pendingInfo["pool-error"]
          );
        }
      }
    }
    await algodclient.statusAfterBlock(currentround).do();
    currentround++;
  }
  throw new Error("Transaction not confirmed after " + timeout + " rounds!");
};

router.post("/", async (req, res) => {
  /*
    req.body will contain the lands details and all that

    then when the transaction creates successfully and its sent we do our logic
    
    

    */

  const algod_server = "https://testnet-algorand.api.purestake.io/ps2";
  const algod_port = "";
  const algod_token = {
    "X-API-Key": "8LtYbv0XMB6wBXhJ2dJPR6LUDDXyEZTUrrT97Daa",
  };

  let algodClient = new algosdk.Algodv2(algod_token, algod_server, algod_port);
  // mnemonic here will be provided from our mongo database
  // i think we'd save the data to a centralized database then cross check with the blockchain on user usage
  var mnemonic =
    "crack lunar nice ostrich panther jar fantasy pulse crane suggest tomorrow fork gentle apology pact model brief lunar assault smile impose measure gold able humble";
  var recoveredAccount = algosdk.mnemonicToSecretKey(mnemonic);
  console.log("the owner of the mnemonic ", recoveredAccount.addr);

  // (async() => {

  try {
    // check my account balance

    let accountInfo = await algodClient
      .accountInformation(recoveredAccount.addr)
      .do();
    console.log("Account balance: %d microAlgos", accountInfo.amount);

    if (accountInfo.amount < 1000000) {
      return res.status(400).json("Balance is too low");
    }

    // Create the transaction

    let params = await algodClient.getTransactionParams().do();

    const receiver =
      "GD64YIY3TWGDMCNPP553DZPPR6LDUSFQOIJVFDPPXWEG3FVOJCCDBBHU5A";
    let note = algosdk.encodeObj("Payment for Clothes");

    let txn = algosdk.makePaymentTxnWithSuggestedParams(
      recoveredAccount.addr,
      receiver,
      1000,
      undefined,
      note,
      params
    );

    console.log({ txn });

    // Sign the transaction
    let signedTxn = txn.signTxn(recoveredAccount.sk);

    console.log({ signedTxn });
    let txId = txn.txID().toString();
    console.log("Signed transaction with txID: %s", txId);

    // Submit the transaction
    await algodClient.sendRawTransaction(signedTxn).do();

    // Wait for confirmation
    // let confirmedTxn = await waitForConfirmation(algodClient, txId, 4);
    // //Get the completed Transaction
    // console.log(
    //   "Transaction " +
    //     txId +
    //     " confirmed in round " +
    //     confirmedTxn["confirmed-round"]
    // );
    // let mytxinfo = JSON.stringify(confirmedTxn.txn.txn, undefined, 2);
    // console.log("Transaction information: %o", mytxinfo);
    // var string = new TextDecoder().decode(confirmedTxn.txn.txn.note);
    // console.log("Note field: ", string);
    return res.json("Transaction was successful");
  } catch (error) {
    console.log({ error });
    return res.status(400).json("Transaction failed");
  }
});

// {
//     versions: [ 'v1', 'v2' ],
//     genesis_id: 'testnet-v1.0',
//     genesis_hash_b64: 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
//     build: {
//       major: 2,
//       minor: 0,
//       build_number: 8,
//       commit_hash: '890f535b',
//       branch: 'rel/stable',
//       channel: 'stable'
//     }
//   }

module.exports = router;
