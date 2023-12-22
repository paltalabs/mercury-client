

// Create users (wallet addresses)

import { createAddress, establishPoolTrustline, loadAccounts, saveAccounts, getBalancesFromPublicKey, establishPoolTrustlineAndAddLiquidity, createAsset, getXLMAsset, payment, liquidityPoolWithdraw, createLiquidityPoolAsset, pathPaymentStrictSend, pathPaymentStrictReceive, getContractIdStellarAsset, TxMaker } from "./utils";
import { ApiErrorResponse, TestAccount } from "./types";
import { Mercury } from "mercury-sdk"
import { test } from "node:test";

async function main() {
    const args = process.argv.slice(2);
    const network = args[0]

    let txMaker: TxMaker;

    switch (network) {
        case "standalone":
            txMaker = new TxMaker(
                "http://172.21.0.3:8000",
                "http://172.21.0.3:8000/soroban/rpc",
                "http://172.21.0.3:8000/friendbot?addr=",
                "CCHKQNMXOZJMTKOWP7LBZGPC2OWSRA5SEXM2USOBUKYZDKU2XUADJA3S",
                network
            )
            break;
        case "testnet":
            txMaker = new TxMaker(
                "https://horizon-testnet.stellar.org",
                "https://soroban-testnet.stellar.org",
                "https://friendbot.stellar.org?addr=",
                "CBN7GPXDONCH3KCLI2FE6LPPYTRCIQR3I2IOE2Z7OE3OO2UHO7LQ4CZL",
                network
            )
            break;
        default:
            console.error("Unsupported network. Only standalone and testnet are supported.");
            return;
    }


    console.log("--------------------------")
    console.log("Creating accounts...")
    const testAccounts = [
        createAddress(),
        createAddress(),
        createAddress(),
    ]

    // Save them on results/testAccounts.json
    saveAccounts(testAccounts)

    // const testAccounts = loadAccounts()
    // if (testAccounts == undefined) {
    //     console.error("testAccount undefined")
    //     return
    // }
    console.log("testAccounts:", testAccounts)

    // Fund account
    console.log("--------------------------")
    console.log("funding accounts...")
    await Promise.all(
        testAccounts.map(async (acc) =>
            await txMaker.fundAccount(acc)
        ))

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
    const issuedAssetResponse = await txMaker.issueAndDistributeAsset({
        name: "PALTA",
        issuer: testAccounts[0],
        destination: testAccounts.slice(1)
    })
    console.log("issuedAssetResponse status:", issuedAssetResponse.status)

    console.log("--------------------------")
    console.log("- Getting wrapped asset...")
    const palta = createAsset("PALTA", testAccounts[0].publicKey)

    const deployStellarAssetContractResponse = await txMaker.deployStellarAssetContract({ asset: palta, source: testAccounts[0] })
    console.log("deployStellarAssetContractResponse.status", deployStellarAssetContractResponse.status)
    if (deployStellarAssetContractResponse.status == "error") console.log("deployStellarAssetContractResponse.error:", deployStellarAssetContractResponse.error)
    const xlm = getXLMAsset()

    // if (network == "standalone") await deployStellarAssetContract({asset: xlm, source: testAccounts[0]})

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
    console.log("--------------------------")
    console.log("Deploying soroban tokens...")
    const uploadTokenContractWasmResponse = await txMaker.uploadTokenContractWasm(testAccounts[0])
    console.log("uploadTokenContractWasmResponse.status:", uploadTokenContractWasmResponse.status)
    if (uploadTokenContractWasmResponse.status == "error") console.log("uploadTokenContractWasmResponse.error:", uploadTokenContractWasmResponse.error)

    console.log("Creating palta soroban 1 token contract...")
    const paltaSorobanContractId1 = await txMaker.createTokenContract(testAccounts[0])

    if (typeof paltaSorobanContractId1 == "string") {
        console.log("paltaSorobanContractId1:", paltaSorobanContractId1)
        console.log("Initializing palta soroban 1 token contract...")
        const initializeTokenContractResponse = await txMaker.initializeTokenContract({
            contractId: paltaSorobanContractId1 ?? "",
            source: testAccounts[0],
            name: "paltaSoroban",
            symbol: "PALTASO",
        })
        console.log("initializeTokenContractResponse.status:", initializeTokenContractResponse.status)


        console.log("Minting palta soroban 1 token contract...")
        const mintTokensResponse = await txMaker.mintTokens({
            contractId: paltaSorobanContractId1 ?? "",
            source: testAccounts[0],
            amount: "2500000",
            destination: testAccounts[1].publicKey,
        })
        console.log("mintTokensResponse.status:", mintTokensResponse.status)

    } else {
        console.log("paltaSorobanContractId1 is not a string")
        console.log("paltaSorobanContractId1:", paltaSorobanContractId1)
        return
    }

    console.log("Creating palta soroban 2 token contract...")
    const paltaSorobanContractId2 = await txMaker.createTokenContract(testAccounts[0])

    console.log("paltaSorobanContractId2:", paltaSorobanContractId2)
    if (typeof paltaSorobanContractId2 == "string") {

        console.log("initializing token contract...")
        const initializeTokenContractResponse = await txMaker.initializeTokenContract({
            contractId: paltaSorobanContractId2 ?? "",
            source: testAccounts[0],
            name: "paltaSoroban2",
            symbol: "PALTASO2",
        })
        console.log("initializeTokenContractResponse.status:", initializeTokenContractResponse.status)

        console.log("Minting tokens...")

        const mintTokensResponse = await txMaker.mintTokens({
            contractId: paltaSorobanContractId2 ?? "",
            source: testAccounts[0],
            amount: "2500000",
            destination: testAccounts[1].publicKey,
        })
        console.log("mintTokensResponse.status:", mintTokensResponse.status)
    } else {
        console.log("paltaSorobanContractId2 is not a string")
        console.log("paltaSorobanContractId2:", paltaSorobanContractId2)
        return
    }

    console.log("--------------------------")
    console.log("Adding liquidity to Soroswap...")
    try {
        await txMaker.addLiquiditySoroswap({
            tokenA: paltaSorobanContractId1 ?? "",
            tokenB: paltaSorobanContractId2 ?? "",
            amountADesired: "2500000",
            amountBDesired: "2500000",
            amountAMin: "1500000",
            amountBMin: "1500000",
            source: testAccounts[1],
            to: testAccounts[1],
        })
    } catch (error) {
        console.log(error)
    }
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
    // console.log("---------------------------------------------------")
    // console.log("Adding liquidity in Soroswap with stellar assets...")
    // await printBalances(testAccounts)
    // try {
    //     await addLiquiditySoroswap({
    //         tokenA: getContractIdStellarAsset({ asset: palta }),
    //         tokenB: getContractIdStellarAsset({ asset: xlm }),
    //         amountADesired: "1002",
    //         amountBDesired: "1002",
    //         amountAMin: "0",
    //         amountBMin: "0",
    //         source: testAccounts[1],
    //         to: testAccounts[1],
    //     })
    // } catch (error) {
    //     console.log(error)
    // }

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