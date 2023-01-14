/*
  Library for creating Claims on the blockchain.
*/

class Claim {
  constructor (localConfig = {}) {
    // Dependency Injection
    this.wallet = localConfig.wallet
    if (!this.wallet) {
      throw new Error('Must inject instance of minimal-slp-wallet when instantiating Claim library')
    }
  }

  async createClaim (inObj) {
    console.log('createClaim() inObj: ', inObj)

    return true
  }
}

module.exports = Claim
