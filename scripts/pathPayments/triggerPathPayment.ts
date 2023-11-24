import * as sdk from "stellar-sdk";
import BigNumber from "bignumber.js";
import { AxiosError } from "axios";

let server = new sdk.Server("https://horizon-testnet.stellar.org");

/// Helps simplify creating & signing a transaction.
function buildTx(source: sdk.Account, signer: sdk.Keypair, ...ops: sdk.xdr.Operation[]) {
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
function getAccounts(keyPairs: sdk.Keypair[]) {
  return Promise.all(keyPairs.map((kp) => server.loadAccount(kp.publicKey())));
}

async function getAccount(keyPair: sdk.Keypair) {
  return await server.loadAccount(keyPair.publicKey())
}
// Scripts

// -------- Set up Key pairs ----------
// "PublicKey": "GDVWGSVSR3ZL4EICDSIUYOJDQFLTQV7HHQD7Y2HVB33LR2YWIU24ZG5J"
// "SecretKey": "SC24ABNFYS3UZO3USPH6UUKVMZMCKNYXCW7WB3GR3ZQ5KLJMJIP3YBB7"
// "PublicKey": "GBXRF7BXKPNQIIWAAO6Y6CFIUXX6GCVLILANFPSENPKAFFZA4KOVCLMB"
// "SecretKey": "SAHUX3KTCB5W3WRESVSUXR3FRF7ZSLYTKPOEULUV3F57U7YO2LMWHKJE"
// "PublicKey": "GDUF34QFXBF4IXHX4YDVLHMK7CNWB6XMRYTU5Z2UXG7O72ZAZ4WEE7X2"
// "SecretKey": "SB2VFSPXPALGKK5EMLAM44GVGBYCNCJUD63Z3KXC6M2KPY7XOAA6FI7D"
const kps = [
  "SC24ABNFYS3UZO3USPH6UUKVMZMCKNYXCW7WB3GR3ZQ5KLJMJIP3YBB7",
  "SAHUX3KTCB5W3WRESVSUXR3FRF7ZSLYTKPOEULUV3F57U7YO2LMWHKJE",
  "SB2VFSPXPALGKK5EMLAM44GVGBYCNCJUD63Z3KXC6M2KPY7XOAA6FI7D",
].map((s) => sdk.Keypair.fromSecret(s));



// ------- Create Accounts ----------

// The SDK does not have tools for creating test accounts, so you'll have to
// make your own HTTP request.

// if you're trying this on Node, install the `node-fetch` library and
// uncomment the next line:
// const fetch = require('node-fetch');

async function fundAccount(pair: sdk.Keypair) {
  try {
    const response = await fetch(
      `https://friendbot.stellar.org?addr=${encodeURIComponent(
        pair.publicKey(),
      )}`,
    );
    const responseJSON = await response.json();
    console.log("SUCCESS! You have a new account :)\n", responseJSON);
  } catch (e) {
    console.error("ERROR!", e);
  }
}
async function getBalancesFromPair(pair: sdk.Keypair) {
  // the JS SDK uses promises for most actions, such as retrieving an account
  const account = await server.loadAccount(pair.publicKey());
  console.log("Balances for account: " + pair.publicKey());
  account.balances.forEach(function (balance) {
    console.log("Type:", balance.asset_type, ", Balance:", balance.balance);
    if (balance.asset_type == "credit_alphanum12" || balance.asset_type == "credit_alphanum4") {
      console.log("Code:", balance.asset_code, "Issuer:", balance.asset_issuer)
    }
  });

}

async function getBalancesFromPairs(pairs: sdk.Keypair[]) {
  await Promise.all(pairs.map(async (kp) => {
    await getBalancesFromPair(kp)
  }))
}

async function createAccountsAndCheckBalances(keyPairs: sdk.Keypair[]) {
  console.log("Creating accounts and checking balances...")
  await Promise.all(keyPairs.map(async (kp) => {
    await fundAccount(kp);
    await getBalancesFromPair(kp)
  }))
}

// createAccountsAndCheckBalances(kps)

// ------- Deploy Assets -----------

const testAssets = [
  new sdk.Asset("testBTC", kps[0].publicKey()),
  new sdk.Asset("testDog", kps[0].publicKey()),
  new sdk.Asset("testUSDC", kps[0].publicKey()),
]
const xlm = sdk.Asset.native()
const allAssets = [xlm, ...testAssets]

const [testBTC, testDog, testUSDC] = testAssets
// ------- Mint and distribute Assets -----------

function distributeAssets(
  issuerKp: sdk.Keypair,
  recipientKps: sdk.Keypair[],
  ...assets: sdk.Asset[]) {
  return server.loadAccount(issuerKp.publicKey()).then((issuer) => {
    const ops = recipientKps
      .map((recipientKp) =>
        assets.map((asset) => [
          sdk.Operation.changeTrust({
            source: recipientKp.publicKey(),
            limit: "100000",
            asset: asset,
          }),
          sdk.Operation.payment({
            source: issuerKp.publicKey(),
            destination: recipientKp.publicKey(),
            amount: "100000",
            asset: asset,
          }),
        ])
      )
      .flat(2);

    let tx = buildTx(issuer, issuerKp, ...ops);
    tx.sign(...recipientKps);
    return server.submitTransaction(tx);
  });
}

// distributeAssets(kps[0], kps.slice(1), ...testAssets).then(()=>{ getBalancesFromPairs(kps)})

// ------- Add Liquidity -----------
function establishPoolTrustline(account: sdk.Account, keypair: sdk.Keypair, poolAsset: sdk.LiquidityPoolAsset, amount?: Number | string ) {
  const limit = amount?amount.toString():"100000";
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

function addLiquidity(
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

async function createPoolShareAssetsOnlyOnePath(assets: sdk.Asset[]) {
  // Array to store the liquidity pool assets
  const liquidityPoolAssets: sdk.LiquidityPoolAsset[] = [];

  // Iterate over all assets except the last one
  for (let i = 0; i < assets.length - 1; i++) {
    const assetA = assets[i];
    const assetB = assets[i + 1];

    // Create a liquidity pool asset for each pair of assets
    const poolShareAsset = new sdk.LiquidityPoolAsset(assetA, assetB, sdk.LiquidityPoolFeeV18);
    liquidityPoolAssets.push(poolShareAsset);
  }
  return liquidityPoolAssets; // Optionally return the array
}

async function establishPoolTrustlineAndAddLiquidity() {
  const accounts = await getAccounts(kps)
  // Create pool assets
  const liquidityPoolAssets = await createPoolShareAssetsOnlyOnePath(allAssets)
  console.log("liquidityPoolAssets", liquidityPoolAssets)

  // Establish pool truslines
  for (const lpAsset of liquidityPoolAssets) {
    await Promise.all(kps.map(async (kp, i) => {
      const establishPoolTrustlineResponse = await establishPoolTrustline(accounts[i], kp, lpAsset)
      console.log("establishPoolTrustlineResponse:", establishPoolTrustlineResponse, "Account:", accounts[i])
    }))
  }

  // Add Liquidity to Pools from account 1
  const acc = accounts[1]
  const kp = kps[1]

  const depositA = (1000).toString();
  const depositB = (3000).toString(); // maintain a 1:3 ratio

  for (const poolShareAsset of liquidityPoolAssets) {
    const poolId = sdk
      .getLiquidityPoolId(
        "constant_product",
        poolShareAsset.getLiquidityPoolParameters()
      )
      .toString("hex");

    const addLiquidityResponse = await addLiquidity(acc, kp, poolId, depositA, depositB)
    console.log("addLiquidityResponse:", addLiquidityResponse)
  }
}
// establishPoolTrustlineAndAddLiquidity()

// ------- Strict Send Payment -----------
// we will try to launch a strict send payment from xlm to USDC 
async function strictSendPayment(
  source: sdk.Account,
  signer: sdk.Keypair,
  destination: string,
  amount: number,
  destMin: number,
  // poolId: string,
  // maxReserveA: string,
  // maxReserveB: string
) {
  try {
    return server.submitTransaction(
      buildTx(
        source,
        signer,
        sdk.Operation.pathPaymentStrictSend({
          sendAsset: xlm,
          sendAmount: amount.toString(),
          destination: destination,
          destAsset: allAssets[allAssets.length - 1],
          destMin: destMin.toString(),
          path: allAssets,
        })
      )
    );
  } catch (error) {
    console.log("-----------------")
    console.log("-----------------")
    console.log("-----------------")
    console.log("-----------------")
    console.log("-----------------")
    console.log("Error:", error)

  }
}
// signatures: Array[1] Some source accounts don't exist. Are you on the right network?
getAccount(kps[1]).then(async (account) => {
  // console.log("account:", account)
  try {
 
    const changeTrustOp = sdk.Operation.changeTrust({
      source: kps[2].publicKey(),
      limit: "10000000000",
      asset: allAssets[allAssets.length - 1],
    })
    const receiverAccount = await getAccount(kps[2])
    let tx = buildTx(receiverAccount, kps[2], changeTrustOp);
    // tx.sign(kps[2]);
    await server.submitTransaction(tx);

    const strictSendPaymentResponse = await strictSendPayment(account, kps[1], kps[2].publicKey(), 100, 1)
    console.log("strictSendPaymentResponse:", strictSendPaymentResponse)
  } catch (error) {

    console.log("-----------------")
    console.log("-----------------")
    console.log("-----------------")
    console.log("-----------------")
    const axiosError = error as AxiosError;  // Assuming the error is an AxiosError
    if (axiosError.response && axiosError.response.data && axiosError.response.data) {
      const errorData = axiosError.response.data as any; // Asserting data as any
      console.log("Error:", errorData.extras);
    } else {
      console.log("else Error:", axiosError);
    }
  }
})
