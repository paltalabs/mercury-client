import * as sdk from "stellar-sdk";

export interface TestAccount {
  privateKey: string;
  publicKey: string;
}
export interface issueAndDistributeAssetArgs {
  name: string;
  issuer: TestAccount;
  destination?: TestAccount[]
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

export interface liquidityPoolWithdrawArgs {
  poolAsset: sdk.LiquidityPoolAsset,
  source: TestAccount,
  amount: string,
  minAmountA: string,
  minAmountB: string
}

export interface getLpBalanceArgs {
  source: TestAccount,
  poolAsset: sdk.LiquidityPoolAsset
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

export interface pathPaymentStrictSendArgs {
  destination: TestAccount;
  sendAsset: sdk.Asset;
  sendAmount: string;
  destinationAsset: sdk.Asset;
  destinationMin: string;
  path: sdk.Asset[];
  source: TestAccount;
}

export interface pathPaymentStrictReceiveArgs {
  destination: TestAccount;
  sendAsset: sdk.Asset;
  sendMax: string;
  destinationAsset: sdk.Asset;
  destinationAmount: string;
  path: sdk.Asset[];
  source: TestAccount;
}

export interface addLiquiditySoroswapArgs {
  tokenA: string;
  tokenB: string;
  amountADesired: string; 
  amountBDesired: string;
  amountAMin: string;
  amountBMin: string;
  source: TestAccount;
  to: TestAccount;
}

export interface getContractIdStellarAssetArgs {
  asset: sdk.Asset;
}

export interface deployStellarAssetContractArgs {
  asset: sdk.Asset;
  source: TestAccount;
}

export interface initializeTokenContractArgs {
  source: TestAccount;
  contractId: string;
  name: string;
  symbol: string;
}

export interface mintTokensArgs {
  source: TestAccount;
  contractId: string;
  amount: string;
  destination:string;
}