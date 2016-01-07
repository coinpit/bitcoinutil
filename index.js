var bitcoin = require('bitcoinjs-lib')
var crypto  = require('crypto')
var assert  = require('assert')
var fixed   = require('mangler').fixed

module.exports = function (networkString) {

  var bitcoinutil = {}
  var network     = bitcoin.networks[networkString]

  bitcoinutil.isValidBitcoinAddress = function (address) {
    try {
      bitcoin.Address.fromBase58Check(address, network)
      return true
    }
    catch (e) {
      return false
    }
  }

  bitcoinutil.toAddress = function (publicKey) {
    return bitcoin.ECPubKey.fromHex(publicKey).getAddress(network).toString()
  }

  bitcoinutil.addressFromPrivateKey = function (privateKey) {
    var key = bitcoin.ECKey.fromWIF(privateKey)
    return bitcoinutil.makeAddress(key)
  }

  bitcoinutil.makeAddress = function (key) {
    return {
      address   : key.pub.getAddress(network).toString(),
      privateKey: key.toWIF(network),
      publicKey : key.pub.toHex()
    }
  }

  bitcoinutil.makeRandom = function () {
    var key = bitcoin.ECKey.makeRandom()
    return bitcoinutil.makeAddress(key)
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

  bitcoinutil.sign = function (txInput) {
    var tx     = bitcoin.Transaction.fromHex(txInput.tx)
    var txb    = bitcoin.TransactionBuilder.fromTransaction(tx)
    var redeem = txInput.redeem && bitcoin.Script.fromHex(txInput.redeem)
    var ecKey  = bitcoin.ECKey.fromWIF(txInput.privateKey)
    txb.inputs.forEach(function (input, index) {
      txb.sign(index, ecKey, redeem)
    })
    return txInput.incomplete ? txb.buildIncomplete().toHex() : txb.build().toHex();
  }

  bitcoinutil.addressFromP2SHScript = function (script) {
    var chunks = script.chunks
    return bitcoinutil.addressFromBuffer(chunks[3], network.scriptHash)
  }

  bitcoinutil.addressFromBuffer = function (buffer, hashType) {
    return new bitcoin.Address(bitcoin.crypto.hash160(buffer), hashType).toBase58Check()
  }

  bitcoinutil.hash160 = function (input) {
    return bitcoin.crypto.hash160(new Buffer(input, "utf8")).toString('hex')
  }

  bitcoinutil.containsInput = function (ins, input) {
    var keys = Object.keys(ins)
    for (var i = 0; i < keys.length; i++) {
      var txin      = ins[keys[i]];
      var script    = ins[txin].script
      var accountid = bitcoinutil.addressFromP2SHScript(script)
      if (accountid === input) return true
    }
    return false
  }

  bitcoinutil.containsOutput = function (outs, output) {
    var keys = Object.keys(outs)
    for (var i = 0; i < keys.length; i++) {
      var script        = outs[keys[i]].script;
      var serverAddress = bitcoin.Address.fromOutputScript(script, network).toBase58Check()
      if (serverAddress == output) return true
    }
    return false
  }

  bitcoinutil.satoshify = function (btc) {
    return fixed(btc * 100000000)
  }

  bitcoinutil.btcfy = function (satoshi) {
    return fixed(satoshi / 100000000)
  }

  return bitcoinutil
}
