

const express = require("express")

const router = express.Router()

const algosdk = require('algosdk');



// Get Version
//
// https://www.purestake.com and https://developer.purestake.io
// 
// Code borrowed and extended from https://developer.algorand.org/docs/javascript-sdk
//
// Example using PureStake token object, replacing the token as a string
//


router.get("/",(req,res) =>{


// Generate an address for the user, serves as our auth
    const baseServer = "https://testnet-algorand.api.purestake.io/ps1"
    const port = "";
    const token = {
        'X-API-Key': process.env.API_KEY
    }
    
    const algodclient = new algosdk.Algod(token, baseServer, port);
    console.log("in the other");
    
    var keys = algosdk.generateAccount();
    
    var mnemonic = algosdk.secretKeyToMnemonic(keys.sk);
    
    var isValid = algosdk.isValidAddress(keys.addr);
    
    (async () => {
        console.log(keys.addr);
        console.log(mnemonic);
    
        console.log("is valid ? ", isValid)

        if(isValid){

            // saving the user functionality here

            return res.json({

                addr : keys.addr,
            
                mnemonic : mnemonic,
                isValid : isValid,
                sk : keys.sk,

            })
        }else{
            return res.json("Address is not valid")
        }


        // Will save the users address without the mnemonic
        // that should be all about auth
    })().catch(e => {
        console.log(e);
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