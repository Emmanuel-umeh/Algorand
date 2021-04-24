require("dotenv").config();
const express = require("express");

const router = express.Router();

const algosdk = require("algosdk");

const algod_server = "https://testnet-algorand.api.purestake.io/ps2";
const algod_port = "";
const algod_token = {
  "X-API-Key": "8LtYbv0XMB6wBXhJ2dJPR6LUDDXyEZTUrrT97Daa",
};
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
  try {
    const { price, mnemonic } = req.body;
    /*
      req.body will contain the lands details and all that
  
      then when the transaction creates successfully and its sent we do our logic
      
      
  
      */

    if (!price || !mnemonic) {
      return res.status(400).json({
        msg: "Missing Parameters",
      });
    }

    let algodClient = new algosdk.Algodv2(
      algod_token,
      algod_server,
      algod_port
    );

    var recoveredAccount = algosdk.mnemonicToSecretKey(mnemonic);
    console.log("the owner of the mnemonic ", recoveredAccount.addr);

    // (async() => {

    // check my account balance

    let accountInfo = await algodClient
      .accountInformation(recoveredAccount.addr)
      .do();
    console.log("Account balance: %d microAlgos", accountInfo.amount);

    let productCost = price * 1000000

    if (accountInfo.amount < productCost) {
      return res.status(401).json({ msg: "Balance is too low" });
    }

    // Create the transaction

    let params = await algodClient.getTransactionParams().do();

    const receiver =
      "GD64YIY3TWGDMCNPP553DZPPR6LDUSFQOIJVFDPPXWEG3FVOJCCDBBHU5A";
    let note = algosdk.encodeObj("Payment for Clothes");

    let txn = algosdk.makePaymentTxnWithSuggestedParams(
      recoveredAccount.addr,
      receiver,

      //1 Algo equals 1,000,000 microAlgos.
      productCost,
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
    var success = await algodClient.sendRawTransaction(signedTxn).do();
    if (success) {
      return res.json({
        success: true,
      });
    } else {
      return res.json({
        success: false,
      });
    }
  } catch (error) {
    console.log({ error });
    return res.status(500).json({
      msg: "Internal Error",
    });
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
