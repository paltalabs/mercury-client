import * as sdk from 'stellar-sdk'

const pairContractAddress = "CDYLINP2CX64S2YC4CCI44XH4H7K6Z2WB5UV3U33VIK36T7YATR2QTXP"
const tokenContractAddress = "CDWAP4TOTGCXCGT7JPXHDZHBWDPFHXZU3S2G63PMMDE6SY4HVYOL6QDL"

const address = 'GCHR5WWPDFF3U3HP2NA6TI6FCQPYEWS3UOPIPJKZLAAFM57CEG4ZYBWP'; // Replace with the actual user's address

async function main () {


    const addrScVal = new sdk.Address(address).toScVal()
    const vecScVal = sdk.xdr.ScVal.scvVec([sdk.xdr.ScVal.scvSymbol("Balance"), addrScVal])
    const keyXdr = vecScVal.toXDR('base64');
    
    const sorobanServer = new sdk.SorobanRpc.Server("https://soroban-testnet.stellar.org")
    
    const vecScValBalance = sdk.xdr.ScVal.scvVec([sdk.xdr.ScVal.scvSymbol("Balance"), addrScVal])
    
    if(false) {
        try {
            const BalanceLedgerEntryResult = await sorobanServer.getContractData(pairContractAddress, vecScValBalance)
            console.log(BalanceLedgerEntryResult)
        }
        catch (error) {
            console.log(error)
        }
    }
    
    const key = sdk.xdr.ScVal.scvSymbol("0");
    try {
        const Reserve0LedgerEntryResult = await sorobanServer.getContractData(pairContractAddress, key, sdk.SorobanRpc.Durability.Temporary)
        console.log(Reserve0LedgerEntryResult)
    }
    catch (error) {
        console.log(error)
    }
}
main()