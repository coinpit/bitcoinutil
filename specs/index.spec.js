var bitcoinutil = require("../index")
var expect      = require("expect.js")
var fixtures    = require("fixtures.js")(__filename)

describe("networks", function() {
  it("should validate testnet", function() {
    expect(bitcoinutil.toAddress(fixtures.address.publicKey, 'testnet')).to.be.eql(fixtures.testnet.address)
  })

  it("should validate bitcoin", function() {
    expect(bitcoinutil.toAddress(fixtures.address.publicKey, 'bitcoin')).to.be.eql(fixtures.bitcoin.address)
  })
})

describe("bitcoinutil", function () {
  it("is valid address", function () {
    expect(bitcoinutil.isValidBitcoinAddress(fixtures.address.address)).to.be.equal(true)
    expect(bitcoinutil.isValidBitcoinAddress(fixtures.address.address + 1)).to.be.equal(false)
  })

  it("toAddress", function () {
    expect(bitcoinutil.toAddress(fixtures.address.publicKey, 'testnet')).to.be.eql(fixtures.address.address)
  })

  it("make random", function () {
    var address = bitcoinutil.makeRandom('testnet')
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
    var result = bitcoinutil.getMultisigAddress(2, [fixtures.address.publicKey, fixtures.address1.publicKey], "testnet")
    expect(result).to.be.eql(fixtures.multisig)
  })

  it("getMultisigAddress for livenet", function () {
    var result = bitcoinutil.getMultisigAddress(2, [fixtures.liveAddress.publicKey, fixtures.liveAddress1.publicKey], "bitcoin")
    expect(result).to.be.eql(fixtures.liveMultisig)
  })

  fixtures.sign.forEach(function (test, i) {
    it("sign " + i, function () {
      var result = bitcoinutil.sign(test.tx, test.privateKey, test.redeem, test.incomplete)
      expect(result).to.eql(test.expected)
    })
  })
})

describe("satoshify", function () {
  fixtures.satoshify.forEach(function (test, i) {
    it(i + ": btc " + test.input + " to sat " + test.expected, function () {
      expect(bitcoinutil.satoshify(test.input)).to.be.eql(test.expected)
    })
  })
})

describe("btcfy", function () {
  fixtures.btcfy.forEach(function (test, i) {
    it(i + ": sat " + test.input + " to btc " + test.expected, function () {
      expect(bitcoinutil.btcfy(test.input)).to.be.eql(test.expected)
    })
  })
})

describe("hash160", function () {
  fixtures.hash160.forEach(function (test, i) {
    it(i + ":" + test.input + " => " + test.expected, function () {
      expect(bitcoinutil.hash160(test.input)).to.be.eql(test.expected)
    })
  })
})

describe("hash256", function () {
  fixtures.hash256.forEach(function (test, i) {
    it(i + ":" + test.input + " => " + test.expected, function () {
      expect(bitcoinutil.hash256(test.input)).to.be.eql(test.expected)
    })
  })
})

describe("txidFromHex", function () {
  fixtures.txidFromHex.forEach(function (test, i) {
    it(i + ": txidFromHex", function () {
      expect(bitcoinutil.getTxIdFromHex(test.input)).to.be.eql(test.expected)
    })
  })
})

describe("verify message signature", function () {
  fixtures["verify message sign"].forEach(function (test, i) {
    it(i + ":", function () {
      expect(bitcoinutil.signMessage(test.input.privateKey, test.input.message)).to.be.eql(test.expected.signature)
      expect(bitcoinutil.verifyMessage(test.input.address1, test.input.signature, test.input.message)).to.be.eql(test.expected.verified1)
      expect(bitcoinutil.verifyMessage(test.input.address1, test.input.signature, test.input.message + "added something more")).to.be(false)
      expect(bitcoinutil.verifyMessage(test.input.address2, test.input.signature, test.input.message)).to.be.eql(test.expected.verified2)
    })
  })
})
