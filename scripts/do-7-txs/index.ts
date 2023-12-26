

// Create users (wallet addresses)

import { createAddress, loadAccounts, saveAccounts, getBalancesFromPublicKey, createAsset, getXLMAsset, createLiquidityPoolAsset, pathPaymentStrictSend, pathPaymentStrictReceive, getContractIdStellarAsset, TxMaker } from "./utils";
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
                "CDOYSP6VBUZ4EMFVEGBSLZF4B35BOMC6XAYGFN2INJGZN27B7ACQ3GGV",
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

    console.log("--------------------------")
    console.log("- Making payments...")

    // Do payments
    // Account 1 pay to Account 2
    console.log("-  Account 1 pay 1000 palta to Account 2...")
    const paymentAmount = "1000"

    console.log("increasing trustline for account 2...")
    const increaseTrustlineResponse = await txMaker.increaseTrustline({
        asset: palta,
        source: testAccounts[2],
        amount: paymentAmount
    })
    console.log("increaseTrustlineResponse.status:", increaseTrustlineResponse.status)

    console.log("making payment tx...")
    const payment1Response = await txMaker.payment({
        from: testAccounts[1],
        to: testAccounts[2].publicKey,
        amount: paymentAmount,
        asset: palta
    })
    console.log("payment1Response.status:", payment1Response.status)

    console.log("-  Account 1 pay 1000 xlm to Account 2...")
    const payment2Response = await txMaker.payment({
        from: testAccounts[1],
        to: testAccounts[2].publicKey,
        amount: paymentAmount,
        asset: xlm
    })
    console.log("payment2Response.status:", payment2Response.status)


    // Do Add liquidity XLM/PALTA
    console.log("--------------------------")
    console.log("- Liquidity Pool deposit to Stellar's AMM...")

    // Account 1 and Account 2
    const liquidityPoolDepositResponse1 = await txMaker.establishPoolTrustlineAndAddLiquidity({
        assetA: palta,
        assetB: xlm,
        source: testAccounts[1],
        amountA: "1000",
        amountB: "2000"
    })
    console.log("liquidityPoolDepositResponse1[0].status:", liquidityPoolDepositResponse1[0].status)
    console.log("liquidityPoolDepositResponse1[1].status:", liquidityPoolDepositResponse1[1].status)

    const liquidityPoolDepositResponse2 = await txMaker.establishPoolTrustlineAndAddLiquidity({
        assetA: palta,
        assetB: xlm,
        source: testAccounts[2],
        amountA: "1000",
        amountB: "2000"
    })
    console.log("liquidityPoolDepositResponse2[0].status:", liquidityPoolDepositResponse2[0].status)
    console.log("liquidityPoolDepositResponse2[1].status:", liquidityPoolDepositResponse2[1].status)

    // // Do Remove Liquidity Account 2

    console.log("--------------------------")
    console.log("- Liquidity Pool Withdraw to Stellar's AMM...")

    const lpXlmPalta = createLiquidityPoolAsset(xlm, palta)
    const liquidityPoolWithdrawResponse =
        await txMaker.liquidityPoolWithdraw({
            source: testAccounts[2],
            amount: "100",
            minAmountA: "10",
            minAmountB: "20",
            poolAsset: lpXlmPalta
        })
    console.log("liquidityPoolWithdrawResponse.status", liquidityPoolWithdrawResponse.status)

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
    const addLiquiditySoroswapResponse = await txMaker.addLiquiditySoroswap({
        tokenA: paltaSorobanContractId1 ?? "",
        tokenB: paltaSorobanContractId2 ?? "",
        amountADesired: "2000000",
        amountBDesired: "2000000",
        amountAMin: "1500000",
        amountBMin: "1500000",
        source: testAccounts[1],
        to: testAccounts[1],
    })
    console.log("addLiquiditySoroswapResponse.status:", addLiquiditySoroswapResponse.status)
    
    console.log("--------------------------")
    console.log("Making swaps on Soroswap...")
    const swapExactTokensForTokensSoroswapResponse = await txMaker.swapExactTokensForTokensSoroswap({
        source: testAccounts[1],
        amountIn: "100000",
        amountOutMin: "0",
        path: [paltaSorobanContractId1 ?? "", paltaSorobanContractId2 ?? ""],
        to: testAccounts[1],
    })
    console.log("swapExactTokensForTokensSoroswapResponse.status:", swapExactTokensForTokensSoroswapResponse.status)
    console.log("--------------------------")
    console.log("Remove liquidity on Soroswap...")
    const removeLiquiditySoroswapResponse = await txMaker.removeLiquiditySoroswap({
        tokenA: paltaSorobanContractId1 ?? "",
        tokenB: paltaSorobanContractId2 ?? "",
        liquidity: "100",
        amountAMin: "10",
        amountBMin: "10",
        source: testAccounts[1],
        to: testAccounts[1],
    })
    console.log("removeLiquiditySoroswapResponse.status:", removeLiquiditySoroswapResponse.status)


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