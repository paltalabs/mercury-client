const { Keypair } = require("soroban-client")

function createAddress(){
    const keypair = Keypair.random();
    const privateKey = keypair.secret();
    const publicKey = keypair.publicKey()
    return {privateKey, publicKey}
}

// How many accounts we are generating
let n = 2;
let keys = []
for (var i=0; i<n; i++){
    keys.push(createAddress())
}
console.log("We are going to create ", n, "addresses")
console.log(" ")
console.log(" ")
console.log("Keys:", keys)


// const restoredKeypair = Keypair.fromSecret(secret);

// const secret = 'SCI7PWMYDDHHOQKNZN4PERO7VJZHSB7762FKPV4L3NYEDUE2OUPNCMAU'
// const kp = Keypair.fromSecret(secret)
// const pubkey = kp.publicKey()