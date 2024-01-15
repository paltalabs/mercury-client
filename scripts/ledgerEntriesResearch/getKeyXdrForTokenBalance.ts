import * as sdk from 'stellar-sdk';

// Define the components
const address = 'GCHR5WWPDFF3U3HP2NA6TI6FCQPYEWS3UOPIPJKZLAAFM57CEG4ZYBWP'; // Replace with the actual user's address

const addrScVal = new sdk.Address(address).toScVal()
const vecScVal = sdk.xdr.ScVal.scvVec([sdk.xdr.ScVal.scvSymbol("Balance"), addrScVal])
const key_xdr = vecScVal.toXDR('base64');

console.log(key_xdr);