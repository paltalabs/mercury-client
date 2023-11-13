const { Keypair } = require("soroban-client")
const fs = require("fs");

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


fs.writeFile('testKeys.json', JSON.stringify(keys, null, 4), (error) => {
    if (error) throw error;
});