import * as sdk from "stellar-sdk";

export interface TestAccount {
    privateKey: string;
    publicKey: string;
}
export interface issueAndDistributeAssetArgs {
    name: string;
    issuer: TestAccount;
    destination?: TestAccount []
}

export interface paymentArgs {
  from: TestAccount;
  to: TestAccount;
  amount: string;
  asset: sdk.Asset
}

export interface establishPoolTrustlineAndAddLiquidityArgs {
    assetA: sdk.Asset,
    assetB: sdk.Asset,
    source: TestAccount,
    amountA?: string,
    amountB?: string
}

export interface ApiErrorResponse {
    extras: {
      result_codes: {
        // Define the properties of result_codes here
        // For example:
        transaction: string;
        operations: string[];
      };
    };
    // Include any other properties that might be in the error response
  }