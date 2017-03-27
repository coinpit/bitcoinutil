var bitcoin = require('bitcoinjs-lib')
var crypto  = require('crypto')
var affirm  = require('affirm.js')
var base58  = require('bs58')
var fixed   = require('mangler').fixed

module.exports = (function () {

  var bitcoinutil = {}

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

  function getNetwork(network) {
    return bitcoin.networks[network || 'bitcoin']
  }

  function inferNetworkFromPrivateKey(privateKeyWIF) {
    var networkName = privateKeyWIF[0] == 'K' || privateKeyWIF[0] == 'L' ? 'bitcoin' : 'testnet'
    return getNetwork(networkName)
  }

  function inferNetworkFromAddress(address) {
    var networkName = address[0] == '1' ? 'bitcoin' : 'testnet'
    return getNetwork(networkName)
  }

  bitcoinutil.toAddress = function (publicKey, network) {
    var network = getNetwork(network)
    return bitcoin.ECPair.fromPublicKeyBuffer(fromHex(publicKey), network).getAddress()
  }

  bitcoinutil.addressFromPrivateKey = function (privateKey) {
    var network = inferNetworkFromPrivateKey(privateKey)
    var key     = bitcoin.ECPair.fromWIF(privateKey, network)
    return makeAddress(key)
  }

  function makeAddress(key) {
    return {
      address   : key.getAddress(),
      privateKey: key.toWIF(),
      publicKey : toHex(key.getPublicKeyBuffer())
    }
  }

  bitcoinutil.makeRandom = function (networkName) {
    var network = getNetwork(networkName)
    var key     = bitcoin.ECPair.makeRandom()
    key.network = network
    return makeAddress(key)
  }

  bitcoinutil.getPublicKey = function (privateKey) {
    var network      = inferNetworkFromPrivateKey(privateKey)
    var myPrivateKey = bitcoin.ECPair.fromWIF(privateKey, network)
    return toHex(myPrivateKey.getPublicKeyBuffer())
  }

  function toHex(buffer) {
    return buffer.toString('hex')
  }

  function fromHex(hex) {
    return new Buffer(hex, 'hex')
  }

  bitcoinutil.getMultisigAddress = function (n, publickeys, networkName) {
    affirm(networkName, 'Please provide network. possible values are "bitcoin" and "testnet".')
    var network         = getNetwork(networkName)
    publickeys           = Buffer.isBuffer(publickeys[0]) ? publickeys : publickeys.sort();
    var addressBuffer   = publickeys.map(function (address) {
      return Buffer.isBuffer(address) ? address : fromHex(address)
    })
    var multisig        = bitcoin.script.multisigOutput(n, addressBuffer)
    var scriptPubKey    = bitcoin.script.scriptHashOutput(bitcoin.crypto.hash160(multisig))
    var multisigAddress = bitcoin.address.fromOutputScript(scriptPubKey, network)
    return { address: multisigAddress, redeem: toHex(multisig) }
  }

  bitcoinutil.sign = function (txhex, privateKeyWIF, redeemHex, isIncomplete) {
    affirm(txhex, "txhex is required")
    affirm(privateKeyWIF, "privateKey is required")
    var network = inferNetworkFromPrivateKey(privateKeyWIF)
    var tx      = bitcoin.Transaction.fromHex(txhex)
    var txb     = bitcoin.TransactionBuilder.fromTransaction(tx, network)
    var redeem  = redeemHex && fromHex(redeemHex)
    var ecKey   = bitcoin.ECPair.fromWIF(privateKeyWIF, network)
    txb.inputs.forEach(function (input, index) {
      txb.sign(index, ecKey, redeem)
    })
    return isIncomplete ? txb.buildIncomplete().toHex() : txb.build().toHex();
  }

  bitcoinutil.signMessage = function (privateKeyWIF, message) {
    var network = inferNetworkFromPrivateKey(privateKeyWIF)
    var key     = bitcoin.ECPair.fromWIF(privateKeyWIF, network)
    return bitcoin.message.sign(key, message, network).toString("base64")
  }

  bitcoinutil.verifyMessage = function (address, signature, message) {
    var network = inferNetworkFromAddress(address)
    return bitcoin.message.verify(address, signature, message, network)
  }

  bitcoinutil.hash160 = function (input) {
    return bitcoin.crypto.hash160(new Buffer(input, "utf8")).toString('hex')
  }

  bitcoinutil.hash256 = function (input) {
    return bitcoin.crypto.hash256(new Buffer(input, "utf8")).toString('hex')
  }

  bitcoinutil.satoshify = function (btc) {
    btc = fixed(btc)
    return Math.floor(btc * 100000000)
  }

  bitcoinutil.btcfy = function (satoshi) {
    satoshi = Math.floor(fixed(satoshi))
    return fixed(satoshi / 100000000)
  }

  bitcoinutil.getTxIdFromHex = function (tx) {
    var transaction = bitcoin.Transaction.fromHex(tx)
    return transaction.getId()
  }

  return bitcoinutil
})()
