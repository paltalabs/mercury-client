import * as sdk from "stellar-sdk";

export interface TestAccount {
    privateKey: string;
    publicKey: string;
}
export interface issueAssetArgs {
    name: string;
    issuer: TestAccount;
    destination?: TestAccount
}