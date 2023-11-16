const sdk = require("stellar-sdk");
const BigNumber = require("bignumber.js");

let server = new sdk.Server("https://horizon-testnet.stellar.org");

/// Helps simplify creating & signing a transaction.
function buildTx(source, signer, ...ops) {
  let tx = new sdk.TransactionBuilder(source, {
    fee: sdk.BASE_FEE,
    networkPassphrase: sdk.Networks.TESTNET,
  });
  ops.forEach((op) => tx.addOperation(op));
  tx = tx.setTimeout(30).build();
  tx.sign(signer);
  return tx;
}

/// Returns the given asset pair in "protocol order."
function orderAssets(A, B) {
  return sdk.Asset.compare(A, B) <= 0 ? [A, B] : [B, A];
}

/// Returns all of the accounts we'll be using.
function getAccounts() {
  return Promise.all(kps.map((kp) => server.loadAccount(kp.publicKey())));
}
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

// kp0 issues the assets
const kp0 = kps[0];
const [A, B] = orderAssets(
  ...[new sdk.Asset("A", kp0.publicKey()), new sdk.Asset("B", kp0.publicKey())],
);

/// Establishes trustlines and funds `recipientKps` for all `assets`.
function distributeAssets(issuerKp, recipientKps, ...assets) {
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
        ]),
      )
      .flat(2);

    let tx = buildTx(issuer, issuerKp, ...ops);
    tx.sign(...recipientKps);
    return server.submitTransaction(tx);
  });
}

function preamble() {
  return distributeAssets(kp0, [kps[1], kps[2]], A, B);
}

const poolShareAsset = new sdk.LiquidityPoolAsset(
    A,
    B,
    sdk.LiquidityPoolFeeV18,
  );
  
  function establishPoolTrustline(account, keypair, poolAsset) {
    return server.submitTransaction(
      buildTx(
        account,
        keypair,
        sdk.Operation.changeTrust({
          asset: poolAsset,
          limit: "100000",
        }),
      ),
    );
  }

const poolId = sdk
    .getLiquidityPoolId(
        "constant_product",
        poolShareAsset.getLiquidityPoolParameters(),
    )
    .toString("hex");

function addLiquidity(source, signer, poolId, maxReserveA, maxReserveB) {
    const exactPrice = maxReserveA / maxReserveB;
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
            }),
        ),
    );
}

function main() {
  return getAccounts()
    .then((accounts) => {
      return Promise.all(

        kps.map((kp, i) => {
          const acc = accounts[i];
          const depositA = ((i + 1) * 1000).toString();
          const depositB = ((i + 1) * 3000).toString(); // maintain a 1:3 ratio

          return establishPoolTrustline(acc, kp, poolShareAsset)
            .then(() => addLiquidity(acc, kp, poolId, depositA, depositB))
            .then(() => getSpotPrice());
        }),
      ).then(() => accounts);
    })
    .then((accounts) => {
      // kp1 takes all his/her shares out
      return server
        .accounts()
        .accountId(kps[1].publicKey())
        .call()
        .then(({ balances }) => {
          let balance = 0;
          balances.every((bal) => {
            if (
              bal.asset_type === "liquidity_pool_shares" &&
              bal.liquidity_pool_id === poolId
            ) {
              balance = bal.balance;
              return false;
            }
            return true;
          });
          return balance;
        })
        .then((balance) =>
          removeLiquidity(accounts[1], kps[1], poolId, balance),
        );
    })
    .then(() => getSpotPrice());
}

function getSpotPrice() {
  return server
    .liquidityPools()
    .liquidityPoolId(poolId)
    .call()
    .then((pool) => {
      const [a, b] = pool.reserves.map((r) => r.amount);
      const spotPrice = new BigNumber(a).div(b);
      console.log(`Price: ${a}/${b} = ${spotPrice.toFormat(2)}`);
    });
}

function removeLiquidity(source, signer, poolId, sharesAmount) {
  return server
    .liquidityPools()
    .liquidityPoolId(poolId)
    .call()
    .then((poolInfo) => {
      let totalShares = poolInfo.total_shares;
      let minReserveA =
        (sharesAmount / totalShares) * poolInfo.reserves[0].amount * 0.95;
      let minReserveB =
        (sharesAmount / totalShares) * poolInfo.reserves[1].amount * 0.95;

      return server.submitTransaction(
        buildTx(
          source,
          signer,
          sdk.Operation.liquidityPoolWithdraw({
            liquidityPoolId: poolId,
            amount: sharesAmount,
            minAmountA: minReserveA.toFixed(7),
            minAmountB: minReserveB.toFixed(7),
          }),
        ),
      );
    });
}

preamble().then(main);
