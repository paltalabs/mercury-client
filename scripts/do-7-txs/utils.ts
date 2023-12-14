import * as sdk from "stellar-sdk";
import { ApiErrorResponse, TestAccount, addLiquiditySoroswapArgs, deployStellarAssetContractArgs, establishPoolTrustlineAndAddLiquidityArgs, getContractIdStellarAssetArgs, getLpBalanceArgs, issueAndDistributeAssetArgs, liquidityPoolWithdrawArgs, pathPaymentStrictReceiveArgs, pathPaymentStrictSendArgs, paymentArgs } from "./types";
import { Keypair } from "soroban-client"
import fs from "fs";
import * as path from 'path';
import axios from "axios";

let server = new sdk.Horizon.Server("https://horizon-testnet.stellar.org");
let friendbotURI = `https://friendbot.stellar.org?addr=`
let routerContractAddress = "CCPAHC7VTNCAX7FA3NAXX2F7ILGLSTL7757OZ7YPABB22LNALLMUTGPN"
let sorobanServer = new sdk.SorobanRpc.Server("https://soroban-testnet.stellar.org");

/// Helps simplify creating & signing a transaction.
export function buildTx(source: sdk.Account, signer: sdk.Keypair, ...ops: sdk.xdr.Operation[]) {
  let tx: sdk.TransactionBuilder = new sdk.TransactionBuilder(source, {
    fee: sdk.BASE_FEE,
    networkPassphrase: sdk.Networks.TESTNET,
  });
  ops.forEach((op) => tx.addOperation(op));
  const txBuilt: sdk.Transaction = tx.setTimeout(30).build();
  txBuilt.sign(signer);
  return txBuilt;
}

/// Returns all of the accounts we'll be using.
export function getAccounts(keyPairs: sdk.Keypair[]) {
  return Promise.all(keyPairs.map((kp) => server.loadAccount(kp.publicKey())));
}

export async function getAccount(keyPair: sdk.Keypair) {
  return await server.loadAccount(keyPair.publicKey())
}

export function createAddress(): TestAccount {
  const keypair = Keypair.random();
  const privateKey = keypair.secret();
  const publicKey = keypair.publicKey()
  return { privateKey, publicKey }
}

export function saveAccounts(accounts: TestAccount[]) {
  const dirPath = path.join('/workspace/', './results');
  const filepath = path.join(dirPath, 'testAccounts.json');// Crear el directorio si no existe
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // Convertir la lista de cuentas a una cadena en formato JSON
  const data = JSON.stringify(accounts, null, 2);
  fs.writeFileSync(filepath, data)
}

export function loadAccounts(): TestAccount[] | undefined {
  const filepath = path.join('/workspace/', './results', 'testAccounts.json');

  if (fs.existsSync(filepath)) {
    const data = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(data) as TestAccount[];
  } else {
    console.log('No accounts file found.');
    return undefined;
  }
}

export async function getBalancesFromPublicKey(publicKey: string) {
  // the JS SDK uses promises for most actions, such as retrieving an account
  const account = await server.loadAccount(publicKey);
  console.log("Balances for account: " + publicKey);
  account.balances.forEach((balance) => {
    console.log("Type:", balance.asset_type, ", Balance:", balance.balance);
    if (balance.asset_type == "credit_alphanum12" || balance.asset_type == "credit_alphanum4") {
      console.log("Code:", balance.asset_code, "Issuer:", balance.asset_issuer)
    }
  });

}

export async function fundAccount(account: TestAccount) {
  try {
    const response = await fetch(
      `${friendbotURI}${encodeURIComponent(
        account.publicKey,
      )}`,
    );
    const responseJSON = await response.json();
    console.log("SUCCESS! You have a new account :)\n", responseJSON);
  } catch (e) {
    console.error("ERROR!", e);
  }
}
export function createAsset(name: string, issuerPublicKey: string) {
  return new sdk.Asset(name, issuerPublicKey)
}

export function getXLMAsset() {
  return sdk.Asset.native()
}

export async function issueAndDistributeAsset(
  args: issueAndDistributeAssetArgs
) {
  const issuerKeypair = sdk.Keypair.fromSecret(args.issuer.privateKey)
  const destinationKeypair = args.destination ?
    args.destination.map((dest) =>
      sdk.Keypair.fromSecret(dest.privateKey)) :
    [issuerKeypair]
  const asset = new sdk.Asset(args.name, args.issuer.publicKey)
  console.log("asset:", asset)
  const issuerAccount = await server.loadAccount(args.issuer.publicKey)
  const destinations = args.destination ?? [args.issuer]
  const ops = destinations.map((dest) =>
    [
      sdk.Operation.changeTrust({
        source: dest?.publicKey ?? args.issuer.publicKey,
        limit: "100000",
        asset: asset,
      }),
      sdk.Operation.payment({
        source: args.issuer.publicKey,
        destination: dest?.publicKey ?? args.issuer.publicKey,
        amount: "100000",
        asset: asset,
      }),
    ]
  ).flat()

  let tx = buildTx(issuerAccount, issuerKeypair, ...ops);
  tx.sign(...destinationKeypair);
  return server.submitTransaction(tx);

}

export function createLiquidityPoolAsset(assetA: sdk.Asset, assetB: sdk.Asset) {
  return new sdk.LiquidityPoolAsset(assetA, assetB, sdk.LiquidityPoolFeeV18);
}

export function establishPoolTrustline(
  account: sdk.Account,
  keypair: sdk.Keypair,
  poolAsset: sdk.LiquidityPoolAsset,
  amount?: Number | string
) {
  const limit = amount ? amount.toString() : "100000";
  return server.submitTransaction(
    buildTx(
      account,
      keypair,
      sdk.Operation.changeTrust({
        asset: poolAsset,
        limit: limit,
      })
    )
  );
}

export function liquidityPoolDeposit(
  source: sdk.Account,
  signer: sdk.Keypair,
  poolId: string,
  maxReserveA: string,
  maxReserveB: string) {
  const exactPrice = Number(maxReserveA) / Number(maxReserveB);
  const minPrice = exactPrice - exactPrice * 0.1;
  const maxPrice = exactPrice + exactPrice * 0.1;

  return server.submitTransaction(
    buildTx(
      source,
      signer,
      sdk.Operation.liquidityPoolDeposit({
        liquidityPoolId: poolId,
        maxAmountA: maxReserveA,
        maxAmountB: maxReserveB,
        minPrice: minPrice.toFixed(7),
        maxPrice: maxPrice.toFixed(7),
      })
    )
  );
}

function getLiquidityPoolId(liquidityPoolAsset: sdk.LiquidityPoolAsset) {
  return sdk.getLiquidityPoolId("constant_product",
    liquidityPoolAsset.getLiquidityPoolParameters()
  ).toString("hex");
}

export async function establishPoolTrustlineAndAddLiquidity(args: establishPoolTrustlineAndAddLiquidityArgs) {
  let assetA, assetB: sdk.Asset;
  let amountA, amountB: string;

  if (args.assetA < args.assetB) {
    assetA = args.assetB
    assetB = args.assetA
    amountA = args.amountB ?? "100"
    amountB = args.amountA ?? "200"
  } else {
    assetA = args.assetA;
    assetB = args.assetB;
    amountA = args.amountA ?? "100"
    amountB = args.amountB ?? "200"
  }

  const poolAsset = createLiquidityPoolAsset(assetA, assetB)
  const poolId = getLiquidityPoolId(poolAsset)
  const sourceKeypair = sdk.Keypair.fromSecret(args.source.privateKey)
  const sourceAccount = await getAccount(sourceKeypair)
  await establishPoolTrustline(sourceAccount, sourceKeypair, poolAsset)
  await liquidityPoolDeposit(sourceAccount, sourceKeypair, poolId, amountA, amountB)
}

export async function payment(args: paymentArgs) {
  const ops = sdk.Operation.payment({
    amount: args.amount,
    asset: args.asset,
    destination: args.to.publicKey
  })
  const sourceKeypair = sdk.Keypair.fromSecret(args.from.privateKey)
  const source = await getAccount(sourceKeypair)
  let tx = buildTx(source, sourceKeypair, ops)
  try {
    const submitTransactionResponse = await server.submitTransaction(tx)

    return submitTransactionResponse
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const apiError = error.response.data as ApiErrorResponse;
      if (apiError && apiError.extras && apiError.extras.result_codes) {
        console.log('Result Codes:', apiError.extras.result_codes);
        // Handle the specifics of the result codes here
      } else {
        console.log('Error does not have the expected format');
      }
    } else {
      console.error('Non-API error occurred:', error);
    }
  }
}

export async function liquidityPoolWithdraw(args: liquidityPoolWithdrawArgs) {

  const ops = sdk.Operation.liquidityPoolWithdraw({
    liquidityPoolId: getLiquidityPoolId(args.poolAsset),
    amount: args.amount,
    minAmountA: args.minAmountA,
    minAmountB: args.minAmountB,
  })
  const sourceKeypair = sdk.Keypair.fromSecret(args.source.privateKey)
  const source = await getAccount(sourceKeypair)
  let tx = buildTx(source, sourceKeypair, ops)
  try {
    const submitTransactionResponse = await server.submitTransaction(tx)

    return submitTransactionResponse
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const apiError = error.response.data as ApiErrorResponse;
      if (apiError && apiError.extras && apiError.extras.result_codes) {
        console.log('Result Codes:', apiError.extras.result_codes);
        // Handle the specifics of the result codes here
      } else {
        console.log('Error does not have the expected format');
      }
    } else {
      console.error('Non-API error occurred:', error);
    }
  }
}

export async function getLpBalance(args: getLpBalanceArgs) {

}

// Path Payment Strict Send
export async function pathPaymentStrictSend(args: pathPaymentStrictSendArgs) {
  const ops = sdk.Operation.pathPaymentStrictSend({
    sendAsset: args.sendAsset,
    sendAmount: args.sendAmount,
    destAsset: args.destinationAsset,
    destMin: args.destinationMin,
    destination: args.destination.publicKey,
    path: args.path
  })
  const sourceKeypair = sdk.Keypair.fromSecret(args.source.privateKey)
  const source = await getAccount(sourceKeypair)
  let tx = buildTx(source, sourceKeypair, ops)
  try {
    const submitTransactionResponse = await server.submitTransaction(tx)

    return submitTransactionResponse
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const apiError = error.response.data as ApiErrorResponse;
      if (apiError && apiError.extras && apiError.extras.result_codes) {
        console.log('Result Codes:', apiError.extras.result_codes);
        // Handle the specifics of the result codes here
      } else {
        console.log('Error does not have the expected format');
      }
    } else {
      console.error('Non-API error occurred:', error);
    }
  }
}

// Path Payment Strict Receive
export async function pathPaymentStrictReceive(args: pathPaymentStrictReceiveArgs) {
  const ops = sdk.Operation.pathPaymentStrictReceive({
    sendAsset: args.sendAsset,
    sendMax: args.sendMax,
    destAsset: args.destinationAsset,
    destAmount: args.destinationAmount,
    destination: args.destination.publicKey,
    path: args.path
  })
  const sourceKeypair = sdk.Keypair.fromSecret(args.source.privateKey)
  const source = await getAccount(sourceKeypair)
  let tx = buildTx(source, sourceKeypair, ops)
  try {
    const submitTransactionResponse = await server.submitTransaction(tx)

    return submitTransactionResponse
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const apiError = error.response.data as ApiErrorResponse;
      if (apiError && apiError.extras && apiError.extras.result_codes) {
        console.log('Result Codes:', apiError.extras.result_codes);
        // Handle the specifics of the result codes here
      } else {
        console.log('Error does not have the expected format');
      }
    } else {
      console.error('Non-API error occurred:', error);
    }
  }

}

export async function addLiquiditySoroswap(args: addLiquiditySoroswapArgs) {
  // This function executes the add_liquidity function of the soroswap router contract
  const health = await sorobanServer.getHealth()
  console.log("health:", health)

  const account = await sorobanServer.getAccount(args.source.publicKey)
  const routerContract = new sdk.Contract(routerContractAddress)
  const fee = sdk.BASE_FEE
  const params = [
    args.tokenA,
    args.tokenB,
    Number(args.amountADesired),
    Number(args.amountBDesired),
    Number(args.amountAMin),
    Number(args.amountBMin),
    args.to.publicKey,
    getCurrentTimePlusOneHour(),
  ]
  const scValParams = [
    new sdk.Address(args.tokenA).toScVal(),
    new sdk.Address(args.tokenB).toScVal(),
    sdk.nativeToScVal(Number(args.amountADesired), { type: "i128" }),
    sdk.nativeToScVal(Number(args.amountBDesired), { type: "i128" }),
    sdk.nativeToScVal(Number(args.amountAMin), { type: "i128" }),
    sdk.nativeToScVal(Number(args.amountBMin), { type: "i128" }),
    new sdk.Address(args.to.publicKey).toScVal(),
    sdk.nativeToScVal(Number(getCurrentTimePlusOneHour()), { type: "u64" }),
  ]

  // const scValParams = Object.values(params).map(
  //   (param) => {
  //     if (typeof param === "number") {
  //       return sdk.nativeToScVal(param, {type: "i128"})
  //     } else {
  //       return new sdk.Address(param).toScVal()
  //     }
  //   })
  console.log("scValParams:", scValParams)
  const transaction = new sdk.TransactionBuilder(account, { fee })
    .setNetworkPassphrase(sdk.Networks.TESTNET)
    .setTimeout(30)
    .addOperation(routerContract.call("add_liquidity", ...scValParams))
    // .addOperation(routerContract.call("router_quote", ...scValQuoteParams))
    .build();

  const preparedTransaction = await sorobanServer.prepareTransaction(transaction)
  const sourceKeypair = sdk.Keypair.fromSecret(args.source.privateKey)
  preparedTransaction.sign(sourceKeypair)


  try {
    const result = await sorobanServer.sendTransaction(preparedTransaction);
    // print stringified result
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    // handle the error
    console.error(error);
  }
}

export async function getContractIdStellarAsset(args: getContractIdStellarAssetArgs) {
  // return args.asset.contractId()  
  // @ts-ignore
  const contractId = args.asset.contractId(sdk.Networks.TESTNET)
  console.log("contractId:", contractId)
  return contractId

}

export async function deployStellarAssetContract(args: deployStellarAssetContractArgs) {
  const source = await sorobanServer.getAccount(args.source.publicKey)
  const sourceKeypair = sdk.Keypair.fromSecret(args.source.privateKey)

  const op = sdk.Operation.createStellarAssetContract({ asset: args.asset })
  const tx = new sdk.TransactionBuilder(source, { fee: sdk.BASE_FEE })
    .setNetworkPassphrase(sdk.Networks.TESTNET)
    .setTimeout(30)
    .addOperation(op)
    .build();
  tx.sign(sourceKeypair)
  const preparedTransaction = await sorobanServer.prepareTransaction(tx)
  preparedTransaction.sign(sourceKeypair)

  try {
    const result = await sorobanServer.sendTransaction(preparedTransaction);
    // print stringified result
    console.log(JSON.stringify(result, null, 2));
    return result
  } catch (error) {
    // handle the error
    console.error(error);
  }
  // const contractId = await sorobanServer.getContractId(asset)




}

export async function uploadTokenContractWasm(signer: TestAccount) {
  // scripts/do-7-txs/soroban_token_contract.optimized.wasm
  const wasmBuffer = fs.readFileSync("/workspace/scripts/do-7-txs/soroban_token_contract.optimized.wasm")
  const hf = sdk.xdr.HostFunction.hostFunctionTypeUploadContractWasm(
    wasmBuffer
  )
  const op = sdk.Operation.uploadContractWasm({wasm: wasmBuffer})
  const source = await sorobanServer.getAccount(signer.publicKey)
  const sourceKeypair = sdk.Keypair.fromSecret(signer.privateKey)

  let tx = new sdk.TransactionBuilder(source, { fee: sdk.BASE_FEE })
    .setNetworkPassphrase(sdk.Networks.TESTNET)
    .setTimeout(30)
    .addOperation(op)
    .build();

  try {
    // const submitTransactionResponse = await server.submitTransaction(tx)
    const preparedTransaction = await sorobanServer.prepareTransaction(tx)
    preparedTransaction.sign(sourceKeypair)
    const submitTransactionResponse = await sorobanServer.sendTransaction(preparedTransaction);
    return submitTransactionResponse
  } catch (error) { 
    if (axios.isAxiosError(error) && error.response) {
      const apiError = error.response.data as ApiErrorResponse;
      if (apiError && apiError.extras && apiError.extras.result_codes) {
        console.log('Result Codes:', apiError.extras.result_codes);
        // Handle the specifics of the result codes here
      } else {
        console.log("error:", error)
        console.log('Error does not have the expected format');
      }
    } else {
      console.error('Non-API error occurred:', error);
    }
  }
}

export async function createTokenContract(signer: TestAccount) {
  const wasmBuffer = fs.readFileSync("/workspace/scripts/do-7-txs/soroban_token_contract.optimized.wasm")
  const hash = sdk.hash(wasmBuffer)
  const op = sdk.Operation.createCustomContract({
    address: new sdk.Address(signer.publicKey) ,
    wasmHash: hash,
  })
  const source = await sorobanServer.getAccount(signer.publicKey)
  const sourceKeypair = sdk.Keypair.fromSecret(signer.privateKey)

  let tx = new sdk.TransactionBuilder(source, { fee: sdk.BASE_FEE })
    .setNetworkPassphrase(sdk.Networks.TESTNET)
    .setTimeout(30)
    .addOperation(op)
    .build();

  try {
    const preparedTransaction = await sorobanServer.prepareTransaction(tx)
    preparedTransaction.sign(sourceKeypair)
    const submitTransactionResponse = await sorobanServer.sendTransaction(preparedTransaction);
    return submitTransactionResponse
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const apiError = error.response.data as ApiErrorResponse;
      if (apiError && apiError.extras && apiError.extras.result_codes) {
        console.log('Result Codes:', apiError.extras.result_codes);
        // Handle the specifics of the result codes here
      } else {
        console.log("error:", error)
        console.log('Error does not have the expected format');
      }
    } else {
      console.error('Non-API error occurred:', error);
    }
  
  }
}
export const getCurrentTimePlusOneHour = () => {
  // Get the current time in milliseconds
  const now = Date.now();

  // Add one hour (3600000 milliseconds)
  const oneHourLater = now + 3600000;

  return oneHourLater;
};