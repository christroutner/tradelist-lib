/*
  A support library for localtradelist.com
*/

// Local libraries
const Claim = require('./lib/claim')

class TradelistLib {
  constructor (localConfig = {}) {
    // Dependency Injection
    this.wallet = localConfig.wallet
    if (!this.wallet) {
      throw new Error('Must inject instance of minimal-slp-wallet when instantiating tradelist-lib')
    }

    // Encapsulate dependencies
    this.claim = new Claim(localConfig)
  }
}

module.exports = TradelistLib
