import * as sdk from "stellar-sdk";
import { ApiErrorResponse, TestAccount, addLiquiditySoroswapArgs, deployStellarAssetContractArgs, establishPoolTrustlineAndAddLiquidityArgs, getContractIdStellarAssetArgs, getLpBalanceArgs, initializeTokenContractArgs, issueAndDistributeAssetArgs, liquidityPoolWithdrawArgs, mintTokensArgs, pathPaymentStrictReceiveArgs, pathPaymentStrictSendArgs, paymentArgs } from "../types";
import { Keypair } from "soroban-client"
import fs from "fs";
import * as path from 'path';
import axios from "axios";


// // Testnet
// let server = new sdk.Horizon.Server("https://horizon-testnet.stellar.org");
// let friendbotURI = `https://friendbot.stellar.org?addr=`
// let routerContractAddress = "CCIS3NUT6WWIKUFBRRYCXZQVFLMJFUBSRJABYC7AKW65SCV3BJUWHMQW"
// let sorobanServer = new sdk.SorobanRpc.Server("https://soroban-testnet.stellar.org");

// Standalone
let server = new sdk.Horizon.Server("http://172.21.0.3:8000", {
  allowHttp: true
});
let friendbotURI = `http://172.21.0.3:8000/friendbot?addr=`
let routerContractAddress = "CBN7GPXDONCH3KCLI2FE6LPPYTRCIQR3I2IOE2Z7OE3OO2UHO7LQ4CZL"
let sorobanServer = new sdk.SorobanRpc.Server("http://172.21.0.3:8000/soroban/rpc", { allowHttp: true });


/// Helps simplify creating & signing a transaction.
export function buildTx(source: sdk.Account, signer: sdk.Keypair, ...ops: sdk.xdr.Operation[]) {
  let tx: sdk.TransactionBuilder = new sdk.TransactionBuilder(source, {
    fee: sdk.BASE_FEE,
    // networkPassphrase: sdk.Networks.TESTNET,
    networkPassphrase: sdk.Networks.STANDALONE,
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

export function createAsset(name: string, issuerPublicKey: string) {
  return new sdk.Asset(name, issuerPublicKey)
}

export function getXLMAsset() {
  return sdk.Asset.native()
}


export function createLiquidityPoolAsset(assetA: sdk.Asset, assetB: sdk.Asset) {
  return new sdk.LiquidityPoolAsset(assetA, assetB, sdk.LiquidityPoolFeeV18);
}


export function getLiquidityPoolId(liquidityPoolAsset: sdk.LiquidityPoolAsset) {
  return sdk.getLiquidityPoolId("constant_product",
    liquidityPoolAsset.getLiquidityPoolParameters()
  ).toString("hex");
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


export function getContractIdStellarAsset(args: getContractIdStellarAssetArgs) {
  // return args.asset.contractId()  
  // @ts-ignore
  // const contractId = args.asset.contractId(sdk.Networks.TESTNET)
  const contractId = args.asset.contractId(sdk.Networks.STANDALONE)
  console.log("stellar asset contractId:", contractId)
  return contractId

}


export function getNetworkPassphrase(network: string) {
  switch (network) {
    case "testnet":
      return sdk.Networks.TESTNET
    case "standalone":
      return sdk.Networks.STANDALONE
    default:
      throw new Error("Unsupported network. Only standalone and testnet are supported.")
  }
}

export function showErrorResultCodes(error: any) {
  if (axios.isAxiosError(error) && error.response) {
    const apiError = error.response.data as ApiErrorResponse;
    if (apiError && apiError.extras && apiError.extras.result_codes) {
      console.log('Result Codes:', apiError.extras.result_codes);
    } else {
      console.log("error:", error)
      console.log('Error does not have the expected format');
    }
  } else {
    console.error('Non-API error occurred:', error);
  }
}

export async function waitForConfirmation(hash: string) {
  let confirmation
  do {
    confirmation = await sorobanServer.getTransaction(hash)
    // console.log("confirmation:", confirmation)
    if (confirmation.status !== sdk.SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) {
      break
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  } while (true)
  return confirmation
}

export const getCurrentTimePlusOneHour = () => {
  // Get the current time in milliseconds
  const now = Date.now();

  // Add one hour (3600000 milliseconds)
  const oneHourLater = now + 36000000;

  const oneHourLaterSeconds = Math.floor(oneHourLater / 1000);
  return oneHourLaterSeconds;
};

export function hexToByte(hexString: string) {
  if (hexString.length % 2 !== 0) {
    throw "Must have an even number of hex digits to convert to bytes"
  }
  var numBytes = hexString.length / 2
  var byteArray = Buffer.alloc(numBytes)
  for (var i = 0; i < numBytes; i++) {
    byteArray[i] = parseInt(hexString.substr(i * 2, 2), 16)
  }
  return byteArray
}

export function getAssetBalance(args: { account: sdk.Horizon.AccountResponse, asset: sdk.Asset }) {
  const balance = args.account.balances.find((balance) => {
      if (balance.asset_type === "native") {
          return args.asset.isNative()
      } else if (balance.asset_type === "liquidity_pool_shares") {
          // todo: handle liquidity pool shares
          return false
      }
      else {
          return balance.asset_code === args.asset.code && balance.asset_issuer === args.asset.issuer
      }
  })
  return balance?.balance
}