var bitcoin = require('bitcoinjs-lib')
var crypto  = require('crypto')
var assert  = require('assert')
var base58  = require('bs58')
var fixed   = require('mangler').fixed

module.exports = function (networkString) {

  var bitcoinutil = {}
  var network     = bitcoin.networks[networkString]

  bitcoinutil.isValidBitcoinAddress = function (address) {
    var buffer      = new Buffer(base58.decode(address))
    var payload     = buffer.slice(0, -4)
    var checksum    = buffer.slice(-4)
    var newChecksum = sha256x2(payload).slice(0, 4)
    for (var i = 0; i < newChecksum.length; ++i) {
      if (newChecksum[i] !== checksum[i]) return false
    }
    return true
  }

  function sha256x2(buffer) {
    buffer = crypto.createHash('sha256').update(buffer).digest()
    return crypto.createHash('sha256').update(buffer).digest()
  }

  bitcoinutil.toAddress = function (publicKey) {
    return bitcoin.ECPubKey.fromHex(publicKey).getAddress(network).toString()
  }

  bitcoinutil.addressFromPrivateKey = function (privateKey) {
    var key = bitcoin.ECKey.fromWIF(privateKey)
    return makeAddress(key)
  }

  function makeAddress(key) {
    return {
      address   : key.pub.getAddress(network).toString(),
      privateKey: key.toWIF(network),
      publicKey : key.pub.toHex()
    }
  }

  bitcoinutil.makeRandom = function () {
    var key = bitcoin.ECKey.makeRandom()
    return makeAddress(key)
  }

  bitcoinutil.getPublicKey = function (privateKey) {
    var myPrivateKey = bitcoin.ECKey.fromWIF(privateKey)
    return myPrivateKey.pub.toHex()
  }

  bitcoinutil.getMultisigAddress = function (n, addresses) {
    addresses           = Buffer.isBuffer(addresses[0]) ? addresses : addresses.sort();
    var ecKeyAddress    = addresses.map(function (address) {
      var buf = Buffer.isBuffer(address) ? address : new Buffer(address, 'hex')
      return bitcoin.ECPubKey.fromBuffer(buf)
    })
    var multisig        = bitcoin.scripts.multisigOutput(n, ecKeyAddress)
    var mshash          = bitcoin.crypto.hash160(multisig.buffer)
    var multisigAddress = new bitcoin.Address(mshash, network.scriptHash).toString();
    return { address: multisigAddress, redeem: multisig.buffer.toString('hex') }
  }

  bitcoinutil.sign = function (txhex, privateKeyWIF, redeemHex, isIncomplete) {
    assert(txhex, "txhex is required")
    assert(privateKeyWIF, "privateKey is required")
    var tx     = bitcoin.Transaction.fromHex(txhex)
    var txb    = bitcoin.TransactionBuilder.fromTransaction(tx)
    var redeem = redeemHex && bitcoin.Script.fromHex(redeemHex)
    var ecKey  = bitcoin.ECKey.fromWIF(privateKeyWIF)
    txb.inputs.forEach(function (input, index) {
      txb.sign(index, ecKey, redeem)
    })
    return isIncomplete ? txb.buildIncomplete().toHex() : txb.build().toHex();
  }

  bitcoinutil.satoshify = function (btc) {
    return fixed(btc * 100000000)
  }

  bitcoinutil.btcfy = function (satoshi) {
    return fixed(satoshi / 100000000)
  }

  return bitcoinutil
}
