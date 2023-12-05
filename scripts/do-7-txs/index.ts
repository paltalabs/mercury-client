

// Create users (wallet addresses)

import { createAddress, establishPoolTrustline, fundAccount, issueAndDistributeAsset, loadAccounts, saveAccounts,getBalancesFromPublicKey, establishPoolTrustlineAndAddLiquidity, createAsset, getXLMAsset } from "./utils";
import { ApiErrorResponse, TestAccount } from "./types";

async function main() {
    // Save them on results/testAccounts.json
    console.log("Creating accounts...")
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
    console.log("testAccounts:", testAccounts)

    // TODO: Subscribe to mercury

    // Create a Stellar classic Asset (PALTA) and distribute
    // Account 0 is issuer

    // Do payments
    // Account 1 pay to Account 2
    // Account 2 pay to Account 1

    // console.log("issuing assets")
    // const issuedAssetResponse = await issueAndDistributeAsset({
    //     name: "PALTA",
    //     issuer: testAccounts[0],
    //     destination: testAccounts.slice(1)
    // })
    // console.log(JSON.stringify(issuedAssetResponse))
    await printBalances(testAccounts)
    // Do Add liquidity XLM/PALTA
    // Account 1 and Account 2
    const assetA = createAsset("PALTA", testAccounts[0].publicKey)
    const xlm = getXLMAsset()
    await establishPoolTrustlineAndAddLiquidity({
        assetA,
        assetB: xlm,
        source: testAccounts[1],
        amountA: "100",
        amountB: "200"
    })
    await printBalances(testAccounts)

    // Do Swap XLM/PALTA

    // Do Remove Liquidity Account 2

    // Do Path Payment
    // Account 2 pays XLM -> PALTA to Account 1

}
main()

async function printBalances(testAccounts: TestAccount[]) {
    await Promise.all(testAccounts.map((testAccount) => getBalancesFromPublicKey(testAccount.publicKey)))
}