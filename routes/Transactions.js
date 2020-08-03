

const express = require("express")

const router = express.Router()

const algosdk = require('algosdk');



router.post("/",(req,res) =>{



    /*
    req.body will contain the lands details and all that

    then when the transaction creates successfully and its sent we do our logic
    
    
    
    */

const baseServer = "https://testnet-algorand.api.purestake.io/ps1"
const port = "";
const token = {
    'X-API-Key': process.env.API_KEY
}


const algodclient = new algosdk.Algod(token, baseServer, port); 
// mnemonic here will be provided from our mongo database
// i think we'd save the data to a centralized database then cross check with the blockchain on user usage
var mnemonic = "opera urge aunt spoon spot divert have bike lottery knee vendor assault grief way heart awkward print swim prison void decrease lift dance abandon quarter"; 
var recoveredAccount = algosdk.mnemonicToSecretKey(mnemonic); 
console.log("the owner of the mnemonic ", recoveredAccount.addr);


(async() => {

    let params = await algodclient.getTransactionParams();
    let endRound = params.lastRound + parseInt(1000);

    let txn = {
        "from": recoveredAccount.addr,
        "to": "AEC4WDHXCDF4B5LBNXXRTB3IJTVJSWUZ4VJ4THPU2QGRJGTA3MIDFN3CQA",
        "fee": 0,
        // for this to work make sure u get token from the faucet https://bank.testnet.algorand.network/
        "amount": 0,
        "firstRound": params.lastRound,
        "lastRound": endRound,
        "genesisID": params.genesisID,
        "genesisHash": params.genesishashb64,
        "note": new Uint8Array(0),
    };

    const txHeaders = {
        'Content-Type' : 'application/x-binary'
    }
    let signedTxn = algosdk.signTransaction(txn, recoveredAccount.sk);
    // completes the transaction
    let tx = (await algodclient.sendRawTransaction(signedTxn.blob, txHeaders));
    console.log("Transaction : " + tx.txId);
    return res.json("Transaction : " + tx.txId)
})().catch(e => {
    console.log(e.error);
    return res.json("Something went wrong")
});

})

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



module.exports = router