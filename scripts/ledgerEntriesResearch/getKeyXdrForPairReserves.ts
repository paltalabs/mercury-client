import * as sdk from 'stellar-sdk';

// const dataSymbols = ["Reserve0", "Reserve1", "Token0", "Token1"];
const dataSymbols = ["0", "1", "2", "3", "Reserve0", "Reserve1", "Token0", "Token1", "Admin"];
// const dataSymbols = [0, 1, 2, 3];
const dataKeys = dataSymbols.map(symbol => {
    const vecScVal = sdk.xdr.ScVal.scvVec([sdk.xdr.ScVal.scvSymbol(symbol)])
    return vecScVal.toXDR('base64');
});

console.log("Data Symbols and Keys:");
for (let i = 0; i < dataSymbols.length; i++) {
    console.log(dataSymbols[i], dataKeys[i]);
}


const dataSymbols2 =["0", "Reserve0", "Admin"]
console.log("another datakey")
dataSymbols2.forEach(symbol => {
    const vecScVal = sdk.xdr.ScVal.scvSymbol(symbol)
    const key_xdr = vecScVal.toXDR('base64');
    console.log(symbol, key_xdr);
    })


// const dataSymbols3 =[0]
// console.log(" datakey numbers")
// dataSymbols3.forEach(symbol => {
//     const vecScVal = sdk.xdr.ScVal.scvI128()
//     const key_xdr = vecScVal.toXDR('base64');
//     console.log(symbol, key_xdr);
//         })
    