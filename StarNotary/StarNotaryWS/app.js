
const Web3 = require('web3');
const contractJson = require('../smart_contracts/build/contracts/StarNotary.json');
const express = require('express');
const app = express();

let starNotary;

app.get('/star/:starTokenId', function (req, res) {
  console.log('StarId: ' + req.params.starTokenId);
  let result = starNotary.tokenIdToStarInfo(req.params.starTokenId);
  if (result[0] === '') {
    res.status(404).send('Not found');
  } else {
    res.type('json');
    res.json(result);
  }
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
  if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
    console.log('using injected provider');
  } else {
    //web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));  // Ganache
    web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/"));  // Rinkeby Infura
    console.log('using http provider');
  }
  // The default (top) wallet account from a list of test accounts 
  web3.eth.defaultAccount = web3.eth.accounts[0];

  // The interface definition for your smart contract (the ABI) 
  console.log(contractJson.abi);
  let StarNotary = web3.eth.contract(contractJson.abi);

  // Grab the contract at specified deployed address with the interface defined by the ABI
  starNotary = StarNotary.at('0x963024b157dd5826974b169179fc173a6709da83');
  console.log("Using StarNotary contract at: " + starNotary.address);
});