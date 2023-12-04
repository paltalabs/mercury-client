import * as sdk from "stellar-sdk";
import { TestAccount, issueAssetArgs } from "./types";
import { Keypair } from "soroban-client"
import fs from "fs";
import * as path from 'path';

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

export async function issueAsset(args: issueAssetArgs) {
  const issuerKeypair = sdk.Keypair.fromSecret(args.issuer.privateKey)
  const destinationKeypair = args.destination ?
    sdk.Keypair.fromSecret(args.destination.privateKey) :
    issuerKeypair
  const asset = new sdk.Asset(args.name, args.issuer.publicKey)

  const issuerAccount = await server.loadAccount(args.issuer.publicKey)
  const ops = [
    sdk.Operation.changeTrust({
      source: args.destination?.publicKey ?? args.issuer.publicKey,
      limit: "100000",
      asset: asset,
    }),
    sdk.Operation.payment({
      source: args.issuer.publicKey,
      destination: args.destination?.publicKey ?? args.issuer.publicKey,
      amount: "100000",
      asset: asset,
    }),
  ]
  let tx = buildTx(issuerAccount, issuerKeypair, ...ops);
  tx.sign(destinationKeypair);
  return server.submitTransaction(tx);
}