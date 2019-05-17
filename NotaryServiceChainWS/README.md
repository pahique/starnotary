# Notary Service Blockchain with Restful API using NodeJS

This project is simplified private blockchain, accessible through a RESTful web API,
that enables the user to register stars.

## Getting Started

Use the instructions below to get a copy of the project up and running.

### Prerequisites

Installing Node and NPM using the installer package available from the [Node.js® web site](https://nodejs.org/en/).

### Configuring the project

1. Use NPM to initialize the project and create package.json to store project dependencies.
```
npm init
```
2. Install crypto-js with --save flag to save dependency to our package.json file
```
npm install crypto-js --save
```
3. Install level with --save flag
```
npm install level --save
```
4. Install hapi with --save flag
```
npm install hapi --save
```
5. Install node-json-db with --save flag
```
npm install node-json-db --save
```
## Testing

In order to test code:

1. Start the node app
```
node app.js
```

2. The server will be listening at localhost, port 8000, and the Genesis block will be created automatically.

   Endpoints:

      * http://localhost:8000/requestValidation in order to request the message that will have to be signed, allowing the registration of a new star.
      * http://localhost:8000/message-signature/validate in order to submit the signed message for validation.
      * http://localhost:8000/block in order to POST a new block/star.
      * http://localhost:8000/block/{BLOCK_HEIGHT} in order to get a block by its height.
      * http://localhost:8000/stars/hash:{HASH} in order to get a block/star by its hash.
      * http://localhost:8000/stars/address:{ADDRESS} in order to get all the blocks/stars related to a given address.
      * http://localhost:8000/blockchain in order to view all the blocks in the chain.

3. Access http://localhost:8000/block/0 to view the Genesis block.

4. Send a request containing your address, in order to start the whole process of registering a new star:
```
curl -X "POST" "http://localhost:8000/requestValidation" -H 'Content-Type: application/json; charset=utf-8' -d $'{
  "address": "mwhDF34CCjWdCEqP5hrfRE2ukyPXS6ZYeW"
}'
```
   Example of returned JSON object:
```
{"address":"mwhDF34CCjWdCEqP5hrfRE2ukyPXS6ZYeW",
 "requestTimestamp":"1536716808",
 "message":"mwhDF34CCjWdCEqP5hrfRE2ukyPXS6ZYeW:1536716808:starRegistry",
 "validationWindow":300}
```

5. The previous POST will return a JSON object containing a message field, like: `"message":"mwhDF34CCjWdCEqP5hrfRE2ukyPXS6ZYeW:1536700880:starRegistry"`. Sign that message using your wallet/address.

6. Send the signed message, within the validation window (300 seconds), by calling the validation service, as below:
```
curl -X "POST" "http://localhost:8000/message-signature/validate" -H 'Content-Type: application/json; charset=utf-8' -d $'{
  "address": "mwhDF34CCjWdCEqP5hrfRE2ukyPXS6ZYeW",
  "signature": "HxUBo71taQYz3heBY+XKn1rmCJmWhQAY79ChWNUZXgKIGyrMaEqVz78fuaNBL720YcXJzQpXAUJuKHI6+n1Eg3o="
}'
```
   Result:
```
{"registerStar":true,
 "status":{"address":"mwhDF34CCjWdCEqP5hrfRE2ukyPXS6ZYeW",
           "requestTimestamp":"1536716808",
           "message":"mwhDF34CCjWdCEqP5hrfRE2ukyPXS6ZYeW:1536716808:starRegistry",
           "validationWindow":260,
           "messageSignature":"valid"}
}
```

7. Once the validation is confirmed by the fields `"registerStar":true` and `"messageSignature":"valid"`, register the star by sending a POST request like the one below:
```
curl -X "POST" "http://localhost:8000/block" -H 'Content-Type: application/json; charset=utf-8' -d $'{
  "address": "mwhDF34CCjWdCEqP5hrfRE2ukyPXS6ZYeW",
  "star": {                                                                                              
    "dec": "-26° 29\' 24.9",
    "ra": "16h 29m 1.0s",
    "story": "Paulo has found a star using https://www.google.com/sky/"
  }
}'
```
   Resulting block (note that the field story gets encoded in hexadecimals):
```
{"hash":"a9b6f106843b504e22ad76c6c3c25f204ba7d85d138b5a9105320aa491319a2a",
 "height":3,
 "body":{"address":"mwhDF34CCjWdCEqP5hrfRE2ukyPXS6ZYeW",
         "star":{"dec":"-26° 29' 24.9",
         "ra":"16h 29m 1.0s",
         "story":"5061756c6f2068617320666f756e6420612073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f"}
 },
 "time":"1536716856",
 "previousBlockHash":"3288a93ab1cc9fa5144a9c0ed43e9196975af26a6f2cbc6b352a2174cf334976"}
```

8. Access http://localhost:8000/block/1 to view the block/star that has just been created.

9. Access http://localhost:8000/stars/hash:a9b6f106843b504e22ad76c6c3c25f204ba7d85d138b5a9105320aa491319a2a to view the same block/star by hash. Note that the field **storyDecoded** shows the original story, decoded from the hexadecimals.
```
{"hash":"a9b6f106843b504e22ad76c6c3c25f204ba7d85d138b5a9105320aa491319a2a",
 "height":3,
 "body":{"address":"mwhDF34CCjWdCEqP5hrfRE2ukyPXS6ZYeW",
 "star":{"dec":"-26° 29' 24.9",
         "ra":"16h 29m 1.0s",
         "story":"5061756c6f2068617320666f756e6420612073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
         "storyDecoded":"Paulo has found a star using https://www.google.com/sky/"}
 },
 "time":"1536716856",
 "previousBlockHash":"3288a93ab1cc9fa5144a9c0ed43e9196975af26a6f2cbc6b352a2174cf334976"}
```

10. Repeat the whole process again and register a different star for the same address.

11. Access http://localhost:8000/stars/address:mwhDF34CCjWdCEqP5hrfRE2ukyPXS6ZYeW to view the 2 blocks/stars related to that address.

12. View the contents of the whole blockchain by accessing http://localhost:8000/blockchain, which includes the Genesis block.
