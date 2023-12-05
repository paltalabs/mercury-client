import * as sdk from "stellar-sdk";
import { ApiErrorResponse, TestAccount, establishPoolTrustlineAndAddLiquidityArgs, issueAndDistributeAssetArgs } from "./types";
import { Keypair } from "soroban-client"
import fs from "fs";
import * as path from 'path';
import axios from "axios";

let server = new sdk.Server("https://horizon-testnet.stellar.org");
let friendbotURI = `https://friendbot.stellar.org?addr=`

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
