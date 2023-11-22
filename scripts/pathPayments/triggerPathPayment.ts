import * as sdk from "stellar-sdk";
import BigNumber from "bignumber.js";

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
  return tx;
}
