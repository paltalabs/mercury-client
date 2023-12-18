

// Create users (wallet addresses)

import { createAddress, establishPoolTrustline, fundAccount, issueAndDistributeAsset, loadAccounts, saveAccounts, getBalancesFromPublicKey, establishPoolTrustlineAndAddLiquidity, createAsset, getXLMAsset, payment, liquidityPoolWithdraw, createLiquidityPoolAsset, pathPaymentStrictSend, pathPaymentStrictReceive, addLiquiditySoroswap, getContractIdStellarAsset, deployStellarAssetContract, uploadTokenContractWasm, createTokenContract, initializeTokenContract, mintTokens } from "./utils";
import { ApiErrorResponse, TestAccount } from "./types";
import { Mercury } from "mercury-sdk"
import { test } from "node:test";

let routerContractAddress = "CDDE4SR4OU33ZPOKQ4T2AL45QOWWG6CF72O3RBBTKETUNCKFFAU3UODB"

async function main() {
    // Save them on results/testAccounts.json
    console.log("Creating accounts...")
    // const testAccounts = [
    //     createAddress(),
    //     createAddress(),
    //     createAddress(),
    // ]

    // saveAccounts(testAccounts)
    
    const testAccounts = loadAccounts()
    if (testAccounts == undefined) {
        console.error("testAccount undefined")
        return
    }
    console.log("testAccounts:", testAccounts)
    // // Fund account
    // console.log("funding accounts...")
    // await Promise.all(
    //     testAccounts.map(async(acc)=>
    //     await fundAccount(acc)
    // ))

    // // TODO: Subscribe to mercury
    // if (process.env.MERCURY_BACKEND_ENDPOINT == undefined ||
    //     process.env.MERCURY_GRAPHQL_ENDPOINT == undefined ||
    //     process.env.MERCURY_TESTER_EMAIL == undefined ||
    //     process.env.MERCURY_TESTER_PASSWORD == undefined) {
    //     console.error("Environment variables are empty")
    //     return
    // }
    // const mercuryInstance = new Mercury({
    //     backendEndpoint: process.env.MERCURY_BACKEND_ENDPOINT,
    //     graphqlEndpoint: process.env.MERCURY_GRAPHQL_ENDPOINT,
    //     email: process.env.MERCURY_TESTER_EMAIL,
    //     password: process.env.MERCURY_TESTER_PASSWORD
    // })

    // Subscribe to contracts
    // console.log("subscribing to contracts")
    // const subscribeToContractEventsResult = await mercuryInstance.subscribeToContractEvents({
    //     contractId: routerContractAddress,
    // })
    // console.log("subscribeToContractEventsResult:", subscribeToContractEventsResult)

    // Subscribe to accounts
    // await Promise.all(testAccounts.map(async (acc) => {
    //     await mercuryInstance.subscribeToFullAccount({ publicKey: acc.publicKey });
    // }));
 
    // Create a Stellar classic Asset (PALTA) and distribute
    // Account 0 is issuer

    console.log("--------------------------")
    console.log("- issuing assets...")
    const issuedAssetResponse = await issueAndDistributeAsset({
        name: "PALTA",
        issuer: testAccounts[0],
        destination: testAccounts.slice(1)
    })
    console.log(JSON.stringify(issuedAssetResponse))

    console.log("--------------------------")
    console.log("- Getting wrapped asset...")
    const palta = createAsset("PALTA", testAccounts[0].publicKey)
    // getContractIdStellarAsset({ asset: palta })
    // console.log("palta:", palta)
    // console.log("just before deployStellarAssetContract")
    // await deployStellarAssetContract({asset: palta, source: testAccounts[0]})

    const xlm = getXLMAsset()

    // console.log("PAYMENTS-----------------------")
    // await printBalances(testAccounts)

    // // Do payments
    // // Account 1 pay to Account 2
    // await payment({
    //     from: testAccounts[1],
    //     to: testAccounts[2],
    //     amount: "100",
    //     asset: palta
    // })
    // await payment({
    //     from: testAccounts[1],
    //     to: testAccounts[2],
    //     amount: "100",
    //     asset: xlm
    // })
    // await printBalances(testAccounts)
    // console.log("END PAYMENTS-----------------------")

    // // Account 2 pay to Account 1
    // await payment({
    //     from: testAccounts[2],
    //     to: testAccounts[1],
    //     amount: "150",
    //     asset: palta
    // })
    // await payment({
    //     from: testAccounts[2],
    //     to: testAccounts[1],
    //     amount: "150",
    //     asset: xlm
    // })

    // await printBalances(testAccounts)
    // // Do Add liquidity XLM/PALTA
    // // Account 1 and Account 2
    // await establishPoolTrustlineAndAddLiquidity({
    //     assetA: palta,
    //     assetB: xlm,
    //     source: testAccounts[1],
    //     amountA: "100",
    //     amountB: "200"
    // })
    // await establishPoolTrustlineAndAddLiquidity({
    //     assetA: palta,
    //     assetB: xlm,
    //     source: testAccounts[2],
    //     amountA: "100",
    //     amountB: "200"
    // })
    // await printBalances(testAccounts)

    // const lpXlmPalta = createLiquidityPoolAsset(xlm, palta)
    // // Do Remove Liquidity Account 2
    // const response = 
    // await liquidityPoolWithdraw({
    //     source: testAccounts[2],
    //     amount: "100",
    //     minAmountA: "10",
    //     minAmountB: "20",
    //     poolAsset: lpXlmPalta
    // })
    // console.log(response)

    // // Do Path Payment
    // // Account 2 pays XLM -> PALTA to Account 1
    // const pathPaymenResponse = await pathPaymentStrictSend({
    //     destination: testAccounts[1],
    //     sendAsset: xlm,
    //     sendAmount: "100",
    //     destinationAsset: palta,
    //     destinationMin: "10",
    //     path: [palta],
    //     source: testAccounts[2]
    // })
    // console.log(pathPaymenResponse)

    // const pathPaymenResponse2 = await pathPaymentStrictReceive({
    //     destination: testAccounts[1],
    //     sendAsset: xlm,
    //     sendMax: "100",
    //     destinationAsset: palta,
    //     destinationAmount: "10",
    //     path: [palta],
    //     source: testAccounts[2]

    // })
    // console.log(pathPaymenResponse2)


    //--------------------------
    // SOROBAN TOKENS
    //--------------------------

    // the second time throws error:
    //     HostError: Error(Storage, ExistingValue)

    // const uploadTokenContractWasmResponse = await uploadTokenContractWasm(testAccounts[0])
    // console.log("uploadTokenContractWasmResponse:",uploadTokenContractWasmResponse)

    // const paltaSorobanContractId1 = await createTokenContract(testAccounts[0])
    // console.log("paltaSorobanContractId1:",paltaSorobanContractId1)

    // await initializeTokenContract({
    //     contractId: paltaSorobanContractId1??"",
    //     source: testAccounts[0],
    //     name: "paltaSoroban",
    //     symbol: "PALTASO",
    // })
    // await mintTokens({
    //     contractId: paltaSorobanContractId1??"",
    //     source: testAccounts[0],
    //     amount: "2500000",
    //     destination: testAccounts[1].publicKey,
    // })

    // const paltaSorobanContractId2 = await createTokenContract(testAccounts[0])
    // console.log("paltaSorobanContractId2:",paltaSorobanContractId2)

    // await initializeTokenContract({
    //     contractId: paltaSorobanContractId2??"",
    //     source: testAccounts[0],
    //     name: "paltaSoroban2",
    //     symbol: "PALTASO2",
    // })
    // await mintTokens({
    //     contractId: paltaSorobanContractId2??"",
    //     source: testAccounts[0],
    //     amount: "2500000",
    //     destination: testAccounts[1].publicKey,
    // })

    // try {
    //     await addLiquiditySoroswap({
    //         tokenA: paltaSorobanContractId1 ?? "",
    //         tokenB: paltaSorobanContractId2 ?? "",
    //         amountADesired: "2500000",
    //         amountBDesired: "2500000",
    //         amountAMin: "1500000",
    //         amountBMin: "1500000",
    //         source: testAccounts[1],
    //         to: testAccounts[1],
    //     })
    // } catch (error) {
    //     console.log(error)
    // }
    //--------------------------------


    //--------------------------------
    // Using tokens deployed with soroban-cli
    //--------------------------------
    // try {
    //     await addLiquiditySoroswap({
    //         tokenA: "CB2RUFY7GU6MTBP6I54MH22GNTE7SZ55MGPBOMZI2B6ETMUUCFFR36YW",
    //         tokenB: "CCKVLYS652DW6LXJG66E44VBVCNHHCF37S5E55LSD2GOBOVUDML5DWAX",
    //         amountADesired: "2500000",
    //         amountBDesired: "2500000",
    //         amountAMin: "1500000",
    //         amountBMin: "1500000",
    //         source: testAccounts[1],
    //         to: testAccounts[1],
    //     })
    // } catch (error) {
    //     console.log(error)
    // }

    // -------------------------------
    // Using wrapped Stellar assets
    // -------------------------------
    console.log("---------------------------------------------------")
    console.log("Adding liquidity in Soroswap with stellar assets...")
    await printBalances(testAccounts)
    try {
        await addLiquiditySoroswap({
            tokenA: getContractIdStellarAsset({ asset: palta }),
            tokenB: getContractIdStellarAsset({ asset: xlm }),
            amountADesired: "1002",
            amountBDesired: "1002",
            amountAMin: "0",
            amountBMin: "0",
            source: testAccounts[1],
            to: testAccounts[1],
        })
    } catch (error) {
        console.log(error)
    }

}
main()

async function printBalances(testAccounts: TestAccount[]) {
    console.log("🥑🥑🥑🥑🥑🥑🥑🥑🥑🥑🥑")
    console.log("🥑 PRINTING BALANCES 🥑")
    console.log("🥑🥑🥑🥑🥑🥑🥑🥑🥑🥑🥑")
    for (let i = 0; i < testAccounts.length; i++) {
        console.log("Account:", i)
        await getBalancesFromPublicKey(testAccounts[i].publicKey)
    }
}