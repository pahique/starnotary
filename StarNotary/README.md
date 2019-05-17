# StarNotary Project (by Paulo Henrique C. Oliveros)

- **Network:** Rinkeby Test Network
- **Contract address:** 0x963024b157dd5826974b169179fc173a6709da83
- **TransactionId (contract creation):** 0xb03393c33eb8a00562aa732cd21a389e94a531d232ee7d38b8b3ccccdeb7d12f

## Project folders:

- **./smart_contracts:** contains the smart contract code and test cases, as well as truffle configurations for deployment.

  Install all package.json dependencies and run:
```
  truffle compile
  truffle test
  truffle deploy --network rinkeby
```
- **./StarNotaryWeb:** contains the HTML client page.

  Run http-server on root folder and access http://localhost:8080/StarNotaryWeb/ (remember to select "Rinkeby network" on Metamask)

- **./StarNotaryWS:** contains the NodeJS client.

  Install all package.json dependencies on this folder and call `node app.js` to enable the URL http://localhost:3000/star/{id}
