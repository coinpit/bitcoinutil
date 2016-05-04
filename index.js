var bitcoin = require('bitcoinjs-lib')
var crypto  = require('crypto')
var assert  = require('assert')
var base58  = require('bs58')
var fixed   = require('mangler').fixed

module.exports = function (networkString) {

  var bitcoinutil = {}
  var network     = bitcoin.networks[networkString || 'bitcoin']

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
    return bitcoin.ECPair.fromPublicKeyBuffer(fromHex(publicKey), network).getAddress()
  }

  bitcoinutil.addressFromPrivateKey = function (privateKey) {
    var key = bitcoin.ECPair.fromWIF(privateKey, network)
    return makeAddress(key)
  }

  function makeAddress(key) {
    return {
      address   : key.getAddress(),
      privateKey: key.toWIF(),
      publicKey : toHex(key.getPublicKeyBuffer())
    }
  }

  bitcoinutil.makeRandom = function () {
    var key     = bitcoin.ECPair.makeRandom()
    key.network = network
    return makeAddress(key)
  }

  bitcoinutil.getPublicKey = function (privateKey) {
    var myPrivateKey = bitcoin.ECPair.fromWIF(privateKey, network)
    return toHex(myPrivateKey.getPublicKeyBuffer())
  }

  function toHex(buffer) {
    return buffer.toString('hex')
  }

  function fromHex(hex) {
    return new Buffer(hex,'hex')
  }

  bitcoinutil.getMultisigAddress = function (n, addresses) {
    addresses           = Buffer.isBuffer(addresses[0]) ? addresses : addresses.sort();
    var addressBuffer    = addresses.map(function (address) {
      return Buffer.isBuffer(address) ? address : fromHex(address)
    })
    var multisig        = bitcoin.script.multisigOutput(n, addressBuffer)
    var scriptPubKey = bitcoin.script.scriptHashOutput(bitcoin.crypto.hash160(multisig))
    var multisigAddress = bitcoin.address.fromOutputScript(scriptPubKey, network)
    return { address: multisigAddress, redeem: toHex(multisig) }
  }

  bitcoinutil.sign = function (txhex, privateKeyWIF, redeemHex, isIncomplete) {
    assert(txhex, "txhex is required")
    assert(privateKeyWIF, "privateKey is required")
    var tx     = bitcoin.Transaction.fromHex(txhex)
    var txb    = bitcoin.TransactionBuilder.fromTransaction(tx, network)
    var redeem = redeemHex && fromHex(redeemHex)
    var ecKey  = bitcoin.ECPair.fromWIF(privateKeyWIF, network)
    txb.inputs.forEach(function (input, index) {
      txb.sign(index, ecKey, redeem)
    })
    return isIncomplete ? txb.buildIncomplete().toHex() : txb.build().toHex();
  }

  bitcoinutil.signMessage = function(privateKeyWif, message){
    var key  = bitcoin.ECPair.fromWIF(privateKeyWif, network)
    return bitcoin.message.sign(key, message, network).toString("base64")
  }

  bitcoinutil.verifyMessage = function(address, signature, message){
    return bitcoin.message.verify(address, signature, message, network)
  }

  bitcoinutil.hash160 = function(input){
    return bitcoin.crypto.hash160(new Buffer(input, "utf8")).toString('hex')
  }

  bitcoinutil.hash256 = function(input){
    return bitcoin.crypto.hash256(new Buffer(input, "utf8")).toString('hex')
  }

  bitcoinutil.satoshify = function (btc) {
    return fixed(btc * 100000000)
  }

  bitcoinutil.btcfy = function (satoshi) {
    return fixed(satoshi / 100000000)
  }

  return bitcoinutil
}
