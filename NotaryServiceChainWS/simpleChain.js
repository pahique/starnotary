// Blockchain Data Project
const SHA256 = require('crypto-js/sha256');
const level = require('level');

const chainDB = './chaindata';
const levelDB = level(chainDB);

// LevelDB utility functions
const db = {
  // Add data to levelDB with key/value pair
  addLevelDBData: function (key,value) {
    return levelDB.put(key, value);
  },
  // Get data from levelDB with key
  getLevelDBData: function (key) {
    return levelDB.get(key);
  },
  // Add data to levelDB with key/value pair
  addLevelDBData: function (key,value) {
    return levelDB.put(key, value);
  },
  // Add data to levelDB with value
  addDataToLevelDB: function (value) {
      return new Promise(function(resolve, reject) {
        let i = 0;
        levelDB.createReadStream().on('data', function(data) {
              i++;
            }).on('error', function(err) {
                console.log('Unable to read data stream!', err);
                reject(err);
            }).on('close', function() {
              console.log('Block #' + i);
              db.addLevelDBData(i, value).then(function() {
                resolve(value);
              });
            }).on('error', function(err) {
               reject(err);
            });
      });
  },
  // Counts the total number of entries in the database
  getCount: function () {
    return new Promise(function(resolve, reject) {
      let i = 0;
      levelDB.createReadStream().on('data', function(data) {
         i++;
      }).on('close', function() {
         resolve(i);
      }).on('error', function(err) {
         reject(err);
      });
    });
  }
};


/* ===== Block Class ==============================
|  Class with a constructor for block             |
|  ===============================================*/

class Block {
    constructor(data) {
     this.hash = "",
     this.height = 0,
     this.body = data,
     this.time = 0,
     this.previousBlockHash = ""
    }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain     |
|  ================================================*/

class Blockchain {

  constructor() {
    var self = this;
    // Preserves existing blockchain database
    db.getCount().then(function(count) {
      if (count > 0) {
        console.log("Blockchain already initialized.")
      }
      else {
        console.log("Creating Genesis block...");
        self.addBlock(new Block("First block in the chain - Genesis block"));
      }
    });
  }

  // Add new block
  addBlock(newBlock) {
    var self = this;
    return db.getCount().then(function(count) {
      // Block height
      newBlock.height = count;
      // UTC timestamp
      newBlock.time = new Date().getTime().toString().slice(0,-3);
      // previous block hash
      if (count > 0) {
        return self.getBlock(count-1).then(function(result) {
          newBlock.previousBlockHash = result.hash;
          // Block hash with SHA256 using newBlock and converting to a string
          newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
          // Adding block object to chain
          //this.chain.push(newBlock);

          let stringifiedBlock = JSON.stringify(newBlock);
          return db.addDataToLevelDB(stringifiedBlock);
        }).catch(error => console.log(error.message));
      }
      else {
         // Block hash with SHA256 using newBlock and converting to a string
         newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
         // Adding block object to chain
         //this.chain.push(newBlock);

         let stringifiedBlock = JSON.stringify(newBlock);
         return db.addDataToLevelDB(stringifiedBlock);
      }

    }).catch(error => console.log(error.message));
  }

  // Replace existing block (for validation tests)
  replaceBlock(blockNumber, block) {
    return db.getCount().then(function(count) {
      if (blockNumber < count) {
        if (block instanceof Block) {
          block.height = blockNumber;
        }
        let stringifiedBlock = JSON.stringify(block);
        return db.addLevelDBData(blockNumber, stringifiedBlock).then(function() {
          return stringifiedBlock;
        });
      }
      else {
        return console.log("Block not found");
      }
    }).catch(error => console.log(error.message));
  }

  // Get block height
  getBlockHeight() {
    return db.getCount().then(function(result) {
      return (result > 0 ? result - 1 : 0);
    }).catch(error => console.log(error.message));
  }

  // Get block
  getBlock(blockHeight) {
    // return object as a single string
    return db.getLevelDBData(blockHeight).then(function(result) {
        let block = JSON.parse(result);
        if (block.body.star) {
          block.body.star.storyDecoded = Buffer.from(block.body.star.story, "hex").toString();
        }
        return block;
    });//.catch(error => console.log(error.message));
  }

  // Get block by hash
  getBlockByHash(hash) {
    var self = this;
    return db.getCount().then(function(count) {
      let blockPromises = [];
      for (let i = 0; i < count; i++) {
        blockPromises.push(self.getBlock(i));
      }
      return Promise.all(blockPromises).then(results => {
        for (let i = 0; i < results.length; i++) {
          if (results[i].hash && hash == results[i].hash) {
            return results[i];
          }
        }
        throw new Error("Block not found");
      });
    });
  }

  // Get blocks by address
  getBlocksByAddress(address) {
    var self = this;
    return db.getCount().then(function(count) {
      let blockPromises = [];
      for (let i = 0; i < count; i++) {
        blockPromises.push(self.getBlock(i));
      }
      return Promise.all(blockPromises).then(results => {
        let blocks = [];
        for (let i = 0; i < results.length; i++) {
          if (results[i].body && results[i].body.address && address == results[i].body.address) {
            blocks.push(results[i]);
          }
        }
        return blocks;
      });
    });
  }

  // Validate block
  validateBlock(blockHeight) {
    return this.getBlock(blockHeight).then(function(block) {
      // get block hash
      let blockHash = block.hash;
      // remove block hash to test block integrity
      block.hash = '';
      // generate block hash
      let validBlockHash = SHA256(JSON.stringify(block)).toString();
      // Compare
      if (blockHash === validBlockHash) {
        return true;
      } else {
        console.log('Block #' + block.height + ' invalid hash:\n' + blockHash + '<>' + validBlockHash);
        return false;
      }
    }).catch(error => {
      console.log(error.message);
      return false;
    });
  }

  // Validate hash codes between sequential blocks
  validateBlockSequence(firstBlockHeight) {
    let promises = [];
    promises.push(this.getBlock(firstBlockHeight));
    promises.push(this.getBlock(firstBlockHeight+1));
    return Promise.all(promises).then(function(results) {
       let blockHash = results[0].hash;
       let previousHash = results[1].previousBlockHash;
       if (blockHash !== previousHash) {
          console.log("Hash mismatch: " + blockHash + " <> " + previousHash);
          return false;
       } else {
          return true;
       }
    }).catch(error => {
      console.log(error.message);
      return false;
    });
  }

  // Validate blockchain
  validateChain() {
    let self = this;
    return db.getCount().then(function(count) {
      let errorLog = [];

      // Validate each block of the chain individually
      var blockPromises = [];
      for (let i = 0; i < count; i++) {
        blockPromises.push(self.validateBlock(i));
      }
      return Promise.all(blockPromises).then(blockResults => {
        for (let i = 0; i < blockResults.length; i++) {
          let isValid = blockResults[i];
          if (!isValid) {
            errorLog.push("Invalid block: #"+ i);
          }
        }
      // Validate the connections between blocks of the chain through hash codes
      }).then(function() {
        var sequencePromises = [];
        for (let i = 0; i < count-1; i++) {
          sequencePromises.push(self.validateBlockSequence(i));
        }
        return Promise.all(sequencePromises).then(sequenceResults => {
          for (let i = 0; i < sequenceResults.length; i++) {
            let isValidSequence = sequenceResults[i];
            if (!isValidSequence) {
              errorLog.push("Invalid hash sequence: #" + i + " -> #" + (i+1));
            }
          }
        });
      // Sumarize errors
      }).then(function() {
        if (errorLog.length > 0) {
          console.log('Block errors = ' + errorLog.length);
          console.log('Errors = ' + errorLog);
          return false;
        } else {
          console.log('No errors detected');
          return true;
        }
      }).catch(error => {
         console.log(error.message);
         return false;
      });

    }).catch(error => {
      console.log(error.message);
      return false;
    });
  }

  getBlockchain() {
    var self = this;
    return db.getCount().then(function(count) {
      var blockPromises = [];
      for (var i = 0; i < count; i++) {
        blockPromises.push(self.getBlock(i));
      }

      return Promise.all(blockPromises).then(blockResults => {
         console.log("All blocks:", blockResults);
         return blockResults;
      });
    });
  }
}


// let bc = new Blockchain();
// var blockchain = {
//
//   getBlock: function (blockHeight) {
//     return bc.getBlock(blockHeight);
//   },
//
//   addBlock: function (block) {
//     return bc.addBlock(block);
//   }
// };

module.exports = {
   Block: Block,
   Blockchain: Blockchain
}
