var bitcoinutil = require("../index")('testnet')
var expect      = require("expect.js")
var fixtures    = require("fixtures.js")(__filename)

describe("bitcoinutil", function () {
  it("is valid address", function () {
    expect(bitcoinutil.isValidBitcoinAddress(fixtures.address.address)).to.be.equal(true)
    expect(bitcoinutil.isValidBitcoinAddress(fixtures.address.address + 1)).to.be.equal(false)
  })
  it("toAddress", function () {
    expect(bitcoinutil.toAddress(fixtures.address.publicKey)).to.be.eql(fixtures.address.address)
  })
  it("make random", function () {
    var address = bitcoinutil.makeRandom()
    expect(bitcoinutil.isValidBitcoinAddress(address.address)).to.be.equal(true)
  })
  it("from private key", function () {
    var result = bitcoinutil.addressFromPrivateKey(fixtures.address.privateKey)
    expect(result).to.be.eql(fixtures.address)
  })
  it("getPublicKey", function () {
    var result = bitcoinutil.getPublicKey(fixtures.address.privateKey)
    expect(result).to.be.eql(fixtures.address.publicKey)
  })
  it("getMultisigAddress", function () {
    var result = bitcoinutil.getMultisigAddress(2, [fixtures.address.publicKey, fixtures.address1.publicKey])
    expect(result).to.be.eql(fixtures.multisig)
  })
  it("sign", function () {
    var tx         = fixtures.sign.withdrawtx
    var key2of2    = fixtures.sign.user2of2Key
    var redeem     = key2of2.redeem
    var privateKey = key2of2.privateKeys[0]
    var signedTx   = bitcoinutil.sign(tx, privateKey, redeem)
    expect(signedTx).to.be.eql(fixtures.sign.signedtx)
  })

})

describe("satoshify", function(){
  fixtures.satoshify.forEach(function(test, i){
    it("btc " + test.input + " to sat " + test.expected, function(){
      expect(bitcoinutil.satoshify(test.input)).to.be.eql(test.expected)
    })
  })
})

describe("btcfy", function(){
  fixtures.btcfy.forEach(function(test, i){
    it("sat " + test.input + " to btc " + test.expected, function(){
      expect(bitcoinutil.btcfy(test.input)).to.be.eql(test.expected)
    })
  })
})