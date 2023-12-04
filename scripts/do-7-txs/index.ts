

// Create users (wallet addresses)

import { createAddress, fundAccount, issueAsset, loadAccounts, saveAccounts } from "./utils";

async function main() {
    // Save them on results/testAccounts.json
    // console.log("Creating accounts...")
    // const testAccounts = [
    //     createAddress(),
    //     createAddress(),
    //     createAddress(),
    // ]
    
    // saveAccounts(testAccounts)
    // // Fund account
    // console.log("funding accounts...")
    // await Promise.all(
    //     testAccounts.map(async(acc)=>
    //     await fundAccount(acc)
    // ))

    const testAccounts = loadAccounts()
    if (testAccounts == undefined) {
        console.error("testAccount undefined")
        return 
    }
    // TODO: Subscribe to mercury
    
    // Create a Stellar classic Asset (PALTA) and distribute
    // Account 0 is issuer
    await issueAsset({
        name:"PALTA",
        issuer: testAccounts[0],
        destination: testAccounts[1]
    })

    // Do payments
    // Account 1 pay to Account 2
    // Account 2 pay to Account 1
    
    
    // Do Add liquidity XLM/PALTA
    // Account 1 and Account 2
    
    // Do Swap XLM/PALTA
    
    // Do Remove Liquidity Account 2
    
    // Do Path Payment
    // Account 2 pays XLM -> PALTA to Account 1

}    
main()