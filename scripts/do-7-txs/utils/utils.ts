import * as sdk from "stellar-sdk";
import { ApiErrorResponse, TestAccount, addLiquiditySoroswapArgs, deployStellarAssetContractArgs, establishPoolTrustlineAndAddLiquidityArgs, getContractIdStellarAssetArgs, getLpBalanceArgs, initializeTokenContractArgs, issueAndDistributeAssetArgs, liquidityPoolWithdrawArgs, mintTokensArgs, pathPaymentStrictReceiveArgs, pathPaymentStrictSendArgs, paymentArgs } from "../types";
import { Keypair } from "soroban-client"
import fs from "fs";
import * as path from 'path';
import axios from "axios";

/**
 * Retrieves the router contract address for a specific network from a given URI.
 * @param uri The URI of the server.
 * @param network The network for which the router contract address is requested.
 * @returns The router contract address for the specified network, or "error" if an error occurs.
 */
export async function getRouterContractAddress(uri: string, network: string): Promise<string> {
  try {
    const response = await axios.get(`${uri}/api/router`);
    const data = response.data;
    const router = data.find((router: { network: string, router_id: string, router_address: string }) => router.network === network)
    return router.router_address
  } catch (error) {
    console.log("error:", error);
  }

  return "error";
}

/**
 * Builds a transaction with the specified source account, signer, and operations.
 * @param source The source account for the transaction.
 * @param signer The signer's keypair for signing the transaction.
 * @param ops The operations to be added to the transaction.
 * @returns The built and signed transaction.
 */
export function buildTx(source: sdk.Account, signer: sdk.Keypair, ...ops: sdk.xdr.Operation[]): sdk.Transaction {
  let tx: sdk.TransactionBuilder = new sdk.TransactionBuilder(source, {
    fee: sdk.BASE_FEE,
    networkPassphrase: sdk.Networks.STANDALONE,
  });
  ops.forEach((op) => tx.addOperation(op));
  const txBuilt: sdk.Transaction = tx.setTimeout(30).build();
  txBuilt.sign(signer);
  return txBuilt;
}

/**
 * Generates a new random address by creating a keypair.
 * @returns An object containing the private and public keys of the generated address.
 */
export function createAddress(): TestAccount {
  const keypair = Keypair.random();
  const privateKey = keypair.secret();
  const publicKey = keypair.publicKey()
  return { privateKey, publicKey }
}

/**
 * Saves the provided accounts to a JSON file.
 * @param accounts An array of TestAccount objects to be saved.
 */
export function saveAccounts(accounts: TestAccount[]): void {
  const dirPath = path.join('/workspace/', './results');
  const filepath = path.join(dirPath, 'testAccounts.json');

  // Create the directory if it doesn't exist
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const data = JSON.stringify(accounts, null, 2);
  fs.writeFileSync(filepath, data);
}

/**
 * Loads the accounts from a JSON file.
 * @returns An array of TestAccount objects if the file exists, otherwise undefined.
 */
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

/**
 * Creates a new asset with the specified name and issuer public key.
 * @param name The name of the asset.
 * @param issuerPublicKey The public key of the asset issuer.
 * @returns A new instance of the `sdk.Asset` class representing the created asset.
 */
export function createAsset(name: string, issuerPublicKey: string): sdk.Asset {
  return new sdk.Asset(name, issuerPublicKey);
}

/**
 * Retrieves the XLM (Stellar Lumens) asset.
 * @returns An instance of the `sdk.Asset` class representing the XLM asset.
 */
export function getXLMAsset(): sdk.Asset {
  return sdk.Asset.native();
}

/**
 * Creates a new liquidity pool asset with the specified assets.
 * @param assetA The first asset of the liquidity pool.
 * @param assetB The second asset of the liquidity pool.
 * @returns A new instance of the `sdk.LiquidityPoolAsset` class representing the created liquidity pool asset.
 */
export function createLiquidityPoolAsset(assetA: sdk.Asset, assetB: sdk.Asset): sdk.LiquidityPoolAsset {
  return new sdk.LiquidityPoolAsset(assetA, assetB, sdk.LiquidityPoolFeeV18);
}

/**
 * Retrieves the ID of a liquidity pool asset.
 * @param liquidityPoolAsset The liquidity pool asset for which the ID is requested.
 * @returns The ID of the liquidity pool asset as a hexadecimal string.
 */
export function getLiquidityPoolId(liquidityPoolAsset: sdk.LiquidityPoolAsset): string {
  return sdk.getLiquidityPoolId("constant_product",
    liquidityPoolAsset.getLiquidityPoolParameters()
  ).toString("hex");
}

/**
 * Retrieves the network passphrase based on the specified network.
 * @param network The network for which the passphrase is requested.
 * @returns The network passphrase.
 * @throws Error if the network is unsupported. Only standalone and testnet are supported.
 */
export function getNetworkPassphrase(network: string): string {
  switch (network) {
    case "testnet":
      return sdk.Networks.TESTNET;
    case "standalone":
      return sdk.Networks.STANDALONE;
    default:
      throw new Error("Unsupported network. Only standalone and testnet are supported.");
  }
}

/**
 * Logs the result codes from an API error response.
 * @param error The error object, which should be an Axios error with a response.
 */
export function showErrorResultCodes(error: any): void {
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
/**
 * Waits for a transaction confirmation on the Soroban network.
 * @param hash The hash of the transaction to wait for confirmation.
 * @param server The Soroban RPC server instance.
 * @returns A promise that resolves to the confirmation object when the transaction is confirmed.
 */
export async function waitForConfirmation(hash: string, server: sdk.SorobanRpc.Server): Promise<sdk.SorobanRpc.Api.GetSuccessfulTransactionResponse | sdk.SorobanRpc.Api.GetFailedTransactionResponse> {
  let confirmation;
  do {
    confirmation = await server.getTransaction(hash);
    if (confirmation.status !== sdk.SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } while (true);
  return confirmation;
}

/**
 * Returns the current time plus one hour in seconds.
 * @returns The current time plus one hour in seconds.
 */
export const getCurrentTimePlusOneHour = (): number => {
  // Get the current time in milliseconds
  const now = Date.now();

  // Add one hour (3600000 milliseconds)
  const oneHourLater = now + 36000000;

  const oneHourLaterSeconds = Math.floor(oneHourLater / 1000);
  return oneHourLaterSeconds;
};

/**
 * Converts a hexadecimal string to a byte array.
 * @param hexString The hexadecimal string to convert.
 * @returns The byte array representation of the hexadecimal string.
 * @throws Throws an error if the input string does not have an even number of hex digits.
 */
export function hexToByte(hexString: string): Uint8Array {
  if (hexString.length % 2 !== 0) {
    throw new Error("Must have an even number of hex digits to convert to bytes");
  }
  const numBytes = hexString.length / 2;
  const byteArray = new Uint8Array(numBytes);
  for (let i = 0; i < numBytes; i++) {
    byteArray[i] = parseInt(hexString.substr(i * 2, 2), 16);
  }
  return byteArray;
}

/**
 * Retrieves the balance of a specific asset for a given account.
 * @param args An object containing the account and asset information.
 * @param args.account The Horizon account response object.
 * @param args.asset The asset for which the balance is requested.
 * @returns The balance of the specified asset for the account, or undefined if the asset is not found.
 */
export function getAssetBalance(args: { account: sdk.Horizon.AccountResponse, asset: sdk.Asset }): string | undefined {
  const balance = args.account.balances.find((balance) => {
    if (balance.asset_type === "native") {
      return args.asset.isNative();
    } else if (balance.asset_type === "liquidity_pool_shares") {
      // todo: handle liquidity pool shares
      console.log("Liquidity pool shares not supported yet");
      return false;
    } else {
      return balance.asset_code === args.asset.code && balance.asset_issuer === args.asset.issuer;
    }
  });
  return balance?.balance;
}

/**
 * Logs the failed response object.
 * @param response The response object to log.
 */
export function showFailedResponse(response: any): void {
  if (response.status === "FAILED") {
    console.log("response failed")
    console.log(JSON.stringify(response, null, 2) + "\n");
  } else  {
    console.log("response succeeded")
  }
}