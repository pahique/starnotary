// Controls requests and validations
const nodeJsonDb = require("node-json-db")

const reqDB = new nodeJsonDb("requestValidationData", true, false);

// Data: "/address" => {"message": message to be signed,
//                      "validated": true if the message-signature has been validated }
const reqValidation = {

  putRequest: function(address, message) {
    reqDB.push(`/${address}`, { "message": message, "validated": false});
  },

  containsRequest: function(address) {
    try {
      reqDB.getData(`/${address}`);
      return true;
    } catch(error) {
      return false;
    }
  },

  getRequestMessage: function(address) {
    try {
      let data = reqDB.getData(`/${address}`);
      return data.message;
    } catch(error) {
      console.log(`Address ${address} not found!`);
    }
  },

  deleteRequest: function(address) {
    reqDB.delete(`/${address}`);
  },

  validateRequest: function(address, validated) {
    reqDB.push(`/${address}`, { "validated": validated}, false);
  },

  isRequestValidated: function(address) {
    try {
      let data = reqDB.getData(`/${address}`);
      return data.validated;
    } catch(error) {
      return false;
    }
  }
}

// let data = db.getData("/");
// for (var rootKey in data) {
//   reqMap.set(rootKey, data[rootKey]);
// }

module.exports = reqValidation;
