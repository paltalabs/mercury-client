const { Keypair } = require("soroban-client")

const keypair = Keypair.random();
console.log("🚀 ~ file: createAddress.js:4 ~ keypair:", keypair)
const secret = keypair.secret();
console.log("🚀 ~ file: createAddress.js:6 ~ secret:", secret)
const public = keypair.publicKey()
console.log("🚀 ~ file: createAddress.js:8 ~ public:", public)


// const restoredKeypair = Keypair.fromSecret(secret);

// const secret = 'SCI7PWMYDDHHOQKNZN4PERO7VJZHSB7762FKPV4L3NYEDUE2OUPNCMAU'
// const kp = Keypair.fromSecret(secret)
// const pubkey = kp.publicKey()