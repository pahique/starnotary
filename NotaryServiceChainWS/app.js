'use strict';

const hapi = require('hapi');
const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');

const SimpleChain = require('./simpleChain.js');
const RequestValidation = require('./requestValidation.js');

const blockchain = new SimpleChain.Blockchain();
const maxValidationWindowInSeconds = 300;

const server = hapi.server({
    port: 8000,
    host: 'localhost'
});

// Route for requesting validation
server.route({
   method: 'POST',
   path: '/requestValidation',
   handler: (request, h) => {
        const input = request.payload;
        if (input.address) {
          const address = input.address;
          console.log(`Request validation, address ${address} ...`);
          const now = new Date().getTime().toString().slice(0,-3);
          let validationWindow = maxValidationWindowInSeconds;
          let requestTimestamp = now;
          let message = RequestValidation.getRequestMessage(address);
          if (message) {
            // request already made, getting data from it
            requestTimestamp = message.split(":")[1];
            const timeElapsed = now - requestTimestamp;
            if (timeElapsed < maxValidationWindowInSeconds) {
              validationWindow = maxValidationWindowInSeconds - timeElapsed;
            } else {
              // request has expired, creating a new request for that address
              requestTimestamp = now;
              message = `${address}:${requestTimestamp}:starRegistry`;
              RequestValidation.putRequest(address, message);
            }
          } else {
            // request not found, creating a new request for that address
            message = `${address}:${requestTimestamp}:starRegistry`;
            RequestValidation.putRequest(address, message);
          }
          return h.response({address: address,
                          requestTimestamp: requestTimestamp,
                          message: message,
                          validationWindow: validationWindow}).code(200)
                  .header('content-type', 'application/json; charset=utf-8')
                  .header('cache-control', 'no-cache')
        } else {
            return h.response({statusCode: 400, error: `address field missing`}).code(400)
                  .header('content-type', 'application/json; charset=utf-8')
                  .header('cache-control', 'no-cache');
        }
   }
});

function validateMessageSignatureRequest(payload) {
  if (!payload.address) throw new Error('address field missing');
  else if (!payload.signature) throw new Error('signature field missing');
  return true;
}

// Route for validating a signature
server.route({
   method: 'POST',
   path: "/message-signature/validate",
   handler: (request, h) => {
        const input = request.payload;
        try {
          // checks required fields
          validateMessageSignatureRequest(input);
        } catch(error) {
            return h.response({statusCode: 400, error: error.message}).code(400)
                  .header('content-type', 'application/json; charset=utf-8')
                  .header('cache-control', 'no-cache');
        }
        const address = input.address;
        const signature = input.signature;
        console.log(`Message signature validation, address ${address} ... `);
        // checks if the user has submitted a request as prerequisite
        const message = RequestValidation.getRequestMessage(address);
        if (!message) {
            return h.response({statusCode: 412, error: `Validation request not found for address ${address}`}).code(412)
                  .header('content-type', 'application/json; charset=utf-8')
                  .header('cache-control', 'no-cache');
        }
        const requestTimestamp = message.split(":")[1];
        const now = new Date().getTime().toString().slice(0,-3);
        const timeElapsed = now - requestTimestamp;
        if (timeElapsed < maxValidationWindowInSeconds) {
          const result = bitcoinMessage.verify(message, address, signature);
          // updates the verification result for that address
          RequestValidation.validateRequest(address, result);
          return h.response({registerStar: result,
                             status: {
                                address: address,
                                requestTimestamp: requestTimestamp,
                                message: message,
                                validationWindow: (maxValidationWindowInSeconds - timeElapsed),
                                messageSignature: (result ? "valid" : "invalid")
                             }}).code(200)
                .header('content-type', 'application/json; charset=utf-8')
                .header('cache-control', 'no-cache');
        } else {
          // validation window has expired, removes the request validation entry for that address
          RequestValidation.deleteRequest(address);
          return h.response({statusCode: 412, error: `Validation window expired`}).code(412)
                .header('content-type', 'application/json; charset=utf-8')
                .header('cache-control', 'no-cache');
        }
   }
});

// Route for getting a block by height
server.route({
    method: 'GET',
    path: '/block/{blockHeight}',
    handler: (request, h) => {
        let blockHeight = encodeURIComponent(request.params.blockHeight);
        console.log(`Getting block #${blockHeight} ...`);
        return blockchain.getBlock(blockHeight).then(block => {
            return h.response(block).code(200)
                  .header('content-type', 'application/json; charset=utf-8')
                  .header('cache-control', 'no-cache')
        })
       .catch(error => {
            return h.response({statusCode: 404, error: `Block #${blockHeight} not found`}).code(404)
                  .header('content-type', 'application/json; charset=utf-8')
                  .header('cache-control', 'no-cache');
        });

    }
});


// Route for getting blocks by address
server.route({
    method: 'GET',
    path: '/stars/hash:{hash}',
    handler: (request, h) => {
        let hash = encodeURIComponent(request.params.hash);
        console.log(`Getting block by hash ${hash} ...`);
        return blockchain.getBlockByHash(hash).then(block => {
            return h.response(block).code(200)
                  .header('content-type', 'application/json; charset=utf-8')
                  .header('cache-control', 'no-cache')
        }).catch(error => {
            return h.response({statusCode: 404, error: `Block with hash ${hash} not found`}).code(404)
                  .header('content-type', 'application/json; charset=utf-8')
                  .header('cache-control', 'no-cache');
        });
    }
});


// Route for getting blocks by address
server.route({
    method: 'GET',
    path: '/stars/address:{address}',
    handler: (request, h) => {
        let address = encodeURIComponent(request.params.address);
        console.log(`Getting blocks by address ${address} ...`);
        return blockchain.getBlocksByAddress(address).then(blocks => {
            if (blocks.length > 0) {
              return h.response(blocks).code(200)
                    .header('content-type', 'application/json; charset=utf-8')
                    .header('cache-control', 'no-cache');
            } else {
              return h.response({statusCode: 404, error: `No blocks found with the address ${address}`}).code(404)
                    .header('content-type', 'application/json; charset=utf-8')
                    .header('cache-control', 'no-cache');
            }
        });

    }
});


// Validates required fields in the payload
function validateStarRegistryRequest(payload) {
  if (!payload.address) throw new Error('address field missing');
  else if (!payload.star) throw new Error('star field missing');
  else if (!payload.star.ra) throw new Error('star.ra (right ascension) field missing');
  else if (!payload.star.dec) throw new Error('star.dec (declination) field missing');
  else if (!payload.star.story) throw new Error('star.story (star story) field missing');
  else if (payload.star.story.length > 500) throw new Error('star.story must have no more than 500 characters');
  return true;
}

// Route for posting a new block
server.route({
    method: 'POST',
    path: '/block',
    handler: (request, h) => {
        const blockContent = request.payload;
        try {
          validateStarRegistryRequest(blockContent);
        } catch(error) {
          return h.response({statusCode: 400, error: error.message}).code(400)
                .header('content-type', 'application/json; charset=utf-8')
                .header('cache-control', 'no-cache');
        }
        // Checks if a message signature has already been validated
        if (RequestValidation.isRequestValidated(blockContent.address)) {
          console.log(`Registering a new star for address ${blockContent.address}...`);
          blockContent.star.story = Buffer.from(blockContent.star.story).toString('hex');
          let block = new SimpleChain.Block(blockContent);
          return blockchain.addBlock(block).then(resultBlock => {
              // requires a new validation for the next star, by deleting the existing validation
              RequestValidation.deleteRequest(blockContent.address);
              return h.response(resultBlock)
                    .header('content-type', 'application/json; charset=utf-8')
                    .header('cache-control', 'no-cache')
                    .header('statusCode', 200);
          });
        } else {
          return h.response({statusCode: 412, error: `Message signature validation required`}).code(412)
                .header('content-type', 'application/json; charset=utf-8')
                .header('cache-control', 'no-cache');
        }
    }
});

// Route for getting all the blocks from the chain
server.route({
    method: 'GET',
    path: '/blockchain',
    handler: (request, h) => {
        return blockchain.getBlockchain().then((blockResults) => {
            return h.response(blockResults).code(200)
                  .header('content-type', 'application/json; charset=utf-8')
                  .header('cache-control', 'no-cache');
        });
    }
});


const init = async () => {
    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
};


process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();
