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
}

module.exports = UtilLib
