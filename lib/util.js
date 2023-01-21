/*
  Utility functions used by other libraries
*/

// npm libraries
const { Pin, Write } = require('p2wdb')

// Locally global variables.

class UtilLib {
  constructor (localConfig = {}) {
    // Dependency Injection
    this.wallet = localConfig.wallet
    if (!this.wallet) {
      throw new Error('Must inject instance of minimal-slp-wallet when instantiating Utility library')
    }

    // Encapsulate dependencies
    this.Write = Write
    this.Pin = Pin
    this.write = null // placeholder
    this.pin = null // placeholder
  }

  // Convert an object into JSON and pin that data with the P2WDB pinning service.
  async pinJson (inObj) {
    try {
      const { data } = inObj

      const appId = 'token-data-001'

      // Upload JSON data to the P2WDB.
      const result1 = await this.write.postEntry(data, appId)
      const zcid1 = result1.hash
      console.log(`Data added to P2WDB with this zcid: ${zcid1}`)
      console.log(`https://p2wdb.fullstack.cash/entry/hash/${zcid1}\n`)

      // Request the P2WDB Pinning Service extract the data and pin it separately
      // as an IPFS CID (which starts with 'bafy').
      const cid = await this.pin.json(zcid1)
      console.log(`JSON CID: ${cid}\n`)

      // Pin the CID across the P2WDB pinning cluster
      const result2 = await this.pin.cid(cid)
      const zcid2 = result2.hash
      console.log('Data pinned across the P2WDB Pinning Cluster.')
      console.log(`https://p2wdb.fullstack.cash/entry/hash/${zcid2}\n`)

      return cid
    } catch (err) {
      console.error('Error in pinJson(): ', err)
      throw err
    }
  }

  // Instatiate the Write library.
  async instantiateWrite () {
    try {
      // Get the P2WDB server.
      const p2wdbServer = 'https://p2wdb.fullstack.cash'

      // Get the REST URL
      const server = 'https://free-bch.fullstack.cash'

      // Instantiate the Write library.
      this.write = new this.Write({
        bchWallet: this.wallet,
        serverURL: p2wdbServer,
        interface: 'consumer-api',
        restURL: server
      })

      return true
    } catch (err) {
      console.error('Error in instantiateWrite()')
      throw err
    }
  }

  // Instatiate the Pin library.
  async instantiatePin () {
    try {
      // Get the P2WDB server.
      const p2wdbServer = 'https://p2wdb.fullstack.cash'

      // Get the REST URL
      const server = 'https://free-bch.fullstack.cash'

      // Instantiate the Write library.
      this.pin = new this.Pin({
        bchWallet: this.wallet,
        serverURL: p2wdbServer,
        interface: 'consumer-api',
        restURL: server
      })

      return true
    } catch (err) {
      console.error('Error in instantiateWrite()')
      throw err
    }
  }

  // Write an IPFS CID to the BCH blockchain, following the PS008 specification
  // creating a Claim.
  async writeCidToBlockchain (inObj = {}) {
    try {
      const { cid, storeTokenId, type } = inObj
      console.log(`cid: ${cid}, storeTokenId: ${storeTokenId}, type: ${type}`)

      // Input validation
      if (!cid && !cid.includes('ipfs://') && !cid.includes('p2wdb://')) {
        throw new Error('writeCidToBlockchain() requires a CID for IPFS or P2WDB.')
      }

      // Update the wallet UTXOs
      await this.wallet.initialize()
      const bchjs = this.wallet.bchjs

      // Private key
      const wif = this.wallet.walletInfo.privateKey
      const addr = this.wallet.walletInfo.cashAddress

      // Get the biggest BCH UTXO held by this wallet.
      const utxos = await this.wallet.getUtxos()
      const bchUtxos = utxos.bchUtxos
      const bchUtxo = bchjs.Utxo.findBiggestUtxo(bchUtxos)
      console.log('bchUtxo: ', bchUtxo)

      // Create an EC Key Pair from the user-supplied WIF.
      const ecPair = bchjs.ECPair.fromWIF(wif)

      // instance of transaction builder
      const transactionBuilder = new bchjs.TransactionBuilder()

      const originalAmount = bchUtxo.value
      const vout = bchUtxo.tx_pos
      const txid = bchUtxo.tx_hash

      // add input with txid and index of vout
      transactionBuilder.addInput(txid, vout)

      // TODO: Compute the 1 sat/byte fee.
      const fee = 500

      // BEGIN - Construction of OP_RETURN transaction.

      // Add the OP_RETURN to the transaction.
      const script = [
        bchjs.Script.opcodes.OP_RETURN,
        Buffer.from('00504d00', 'hex'), // Lokad ID for PS008
        Buffer.from(type.toString(16), 'hex'), // Claim type
        Buffer.from(storeTokenId),
        Buffer.from(cid)
      ]

      // Compile the script array into a bitcoin-compliant hex encoded string.
      const data = bchjs.Script.encode(script)

      // Add the OP_RETURN output.
      transactionBuilder.addOutput(data, 0)

      // END - Construction of OP_RETURN transaction.

      // Send the same amount - fee.
      transactionBuilder.addOutput(addr, originalAmount - fee)

      // Sign the transaction with the HD node.
      let redeemScript
      transactionBuilder.sign(
        0,
        ecPair,
        redeemScript,
        transactionBuilder.hashTypes.SIGHASH_ALL,
        originalAmount
      )

      // build tx
      const tx = transactionBuilder.build()

      // output rawhex
      const hex = tx.toHex()

      return hex
    } catch (err) {
      console.error('Error in writeCidToBlockchain(): ', err.message)
      throw err
    }
  }
}

module.exports = UtilLib
