[![Circle CI](https://circleci.com/gh/coinpit/bitcoinutil.svg?style=shield)](https://circleci.com/gh/coinpit/bitcoinutil)

# bitcoinutil 
Commonly used bitcoin functions

## install
```
npm install bitcoinutil --save
```

## import
### testnet
```
var bitcoinutil = require("bitcoinutil")("testnet")
```
### livenet
```
var bitcoinutil = require("bitcoinutil")("bitcoin")
```

## methods
### bitcoinutil.isValidBitcoinAddress(address)
address: public key in base58 format
returns: true for valid address 

### bitcoinutil.toAddress(publicKey)
publicKey: public key in base58 format
returns  : public key in hex format

### bitcoinutil.addressFromPrivateKey(privateKey)
privateKey: in WIF format
returns   : address, privateKey and publicKey in an object

#### example
```javascript
var priv = "L56nAFJCUMuAUF1zp8e4Bhdq8S25kcFD5YrLTnys3ha8QK65dj8P"
bitcoinutil.addressFromPrivateKey(priv)
```
#### result
```
{
    "address"   : "mjsXa5HBdemtrjFZeLUB1D3NetupVNxFyN",
    "privateKey": "L56nAFJCUMuAUF1zp8e4Bhdq8S25kcFD5YrLTnys3ha8QK65dj8P",
    "publicKey" : "03abeb481466887c35e046de4b504a029e03bd3a5e35b03c67fe7821f5fb515483"
}
```

### bitcoinutil.makeRandom()
generates random key and return address, privateKey and publicKey in an object
#### result
```
{
    "address"   : "mjsXa5HBdemtrjFZeLUB1D3NetupVNxFyN",
    "privateKey": "L56nAFJCUMuAUF1zp8e4Bhdq8S25kcFD5YrLTnys3ha8QK65dj8P",
    "publicKey" : "03abeb481466887c35e046de4b504a029e03bd3a5e35b03c67fe7821f5fb515483"
}
```

###  bitcoinutil.getMultisigAddress(m, publicKeys)
creates m of n multisig address from n public keys in hex format 
#### example (2 of 2)
```javascript
var publicKeys = ["035da95734281849a327dea6402bd9c19f49bdd5b04f1cbb3136512984ec7b8d34", "03abeb481466887c35e046de4b504a029e03bd3a5e35b03c67fe7821f5fb515483"] 
bitcoinutil.getMultisigAddress(2, publicKeys)
``` 
#### result
```
{
    "address": "2N4htmodeibCZVtLKRX9EFg8RGL4xdifi6x",
    "redeem" : "5221035da95734281849a327dea6402bd9c19f49bdd5b04f1cbb3136512984ec7b8d342103abeb481466887c35e046de4b504a029e03bd3a5e35b03c67fe7821f5fb51548352ae"
}
```

### bitcoinutil.sign(tx, privateKey, redeem, isIncomplete)
tx          : transaction to be signed (required)
privateKey  : private key used for signing (required)
redeem      : if multisig/p2sh, redeem script is required
isIncomplete: value is true if tx is partially built i.e. more signatures are needed

### bitcoinutil.satoshify(btc)
converts btc to satoshi

### bitcoinutil.btcfy(satoshi)
converts satoshi to btc

### bitcoinutil.hash160(input)
returns ripemd160 of sha256(input)

### bitcoinutil.hash256(input)
returns sha256 of sha256(input)

### bitcoinutil.signMessage(privateKey, message)
privateKey  : private key in wif format used for signing 
message     : Message to be signed
returns signature in base64 format

### bitcoinutil.verifyMessage(address, signature, message)
address     : bitcoin address of the private key used in signing the message 
signature   : signature of message in base64 format 
message     : Message signed
result true or false


