import * as sdk from "stellar-sdk";
import {
    createLiquidityPoolAsset,
    getAssetBalance,
    getCurrentTimePlusOneHour, getLiquidityPoolId,
    getNetworkPassphrase, hexToByte, showErrorResultCodes, waitForConfirmation,
} from "./utils";
import { ApiErrorResponse, removeLiquiditySoroswapArgs, TestAccount, addLiquiditySoroswapArgs, deployStellarAssetContractArgs, establishPoolTrustlineAndAddLiquidityArgs, initializeTokenContractArgs, issueAndDistributeAssetArgs, liquidityPoolWithdrawArgs, mintTokensArgs, paymentArgs } from "../types";
import axios from "axios";
import fs from "fs";


/**
 * Class used for building transactions, signing and submitting them to the network.
 */
export class TxMaker {
    private horizonServer: sdk.Horizon.Server;
    private sorobanServer: sdk.SorobanRpc.Server;
    private friendbotURI: string;
    private routerContractAddress: string;
    private network: string;

    /**
     * Constructs a new instance of the `TxMaker` class.
     * @param horizonServer The Horizon server URL used for interacting with the Stellar network.
     * @param sorobanServer The Soroban server URL used for interacting with the Soroban network.
     * @param friendbotURI The URI for the friendbot service used for funding test accounts.
     * @param routerContractAddress The address of the router contract.
     * @param network The network used: Standalone or Testnet.
     */
    constructor(
        horizonServer: string,
        sorobanServer: string,
        friendbotURI: string,
        routerContractAddress: string,
        network: string
    ) {
        this.horizonServer = new sdk.Horizon.Server(horizonServer, {
            allowHttp: true
        });
        this.sorobanServer = new sdk.SorobanRpc.Server(sorobanServer, {
            allowHttp: true
        });
        this.friendbotURI = friendbotURI;
        this.routerContractAddress = routerContractAddress;
        this.network = network;
    }

    /**
     * Builds a transaction with the given source account, signer keypair, and operations.
     * @param source The source account for the transaction.
     * @param signer The signer keypair used to sign the transaction.
     * @param ops The operations to be added to the transaction.
     * @returns The built and signed transaction.
    */
    buildTx(source: sdk.Account, signer: sdk.Keypair, ...ops: sdk.xdr.Operation[]): sdk.Transaction {
        let tx: sdk.TransactionBuilder = new sdk.TransactionBuilder(source, {
            fee: sdk.BASE_FEE,
            networkPassphrase: getNetworkPassphrase(this.network),
        });

        ops.forEach((op) => tx.addOperation(op));

        const txBuilt: sdk.Transaction = tx.setTimeout(30).build();
        txBuilt.sign(signer);

        return txBuilt;
    }

    /**
     * Funds an account by requesting testnet lumens from the friendbot service.
     * @param account The test account to fund.
     * @returns A promise that resolves when the account is successfully funded.
     */
    async fundAccount(account: TestAccount): Promise<void> {
        try {
            const response = await fetch(
                `${this.friendbotURI}${encodeURIComponent(
                    account.publicKey,
                )}`,
            );
            const responseJSON = await response.json();
            if (responseJSON.successful) {
                console.log("SUCCESS! You have a new account :)\n");
            } else {
                if (
                    responseJSON.detail ===
                    "createAccountAlreadyExist (AAAAAAAAAGT/////AAAAAQAAAAAAAAAA/////AAAAAA=)"
                ) {
                    console.log("Account already exists:");
                } else {
                    console.error("ERROR! :(\n", responseJSON);
                }
            }
        } catch (error) {
            console.error("ERROR!", error);
            showErrorResultCodes(error);
        }
    }

    /**
     * Issues and distributes an asset to one or more destination accounts.
     * @param args The arguments for issuing and distributing the asset.
     *             - issuer: The issuer's keypair and public key.
     *             - destination: An array of destination accounts' keypairs and public keys.
     *             - name: The name (symbol) of the asset.
     * @returns A promise that resolves to the confirmation of the transaction.
     */
    async issueAndDistributeAsset(args: issueAndDistributeAssetArgs): Promise<any> {
        const issuerKeypair = sdk.Keypair.fromSecret(args.issuer.privateKey);
        const destinationKeypair = args.destination ?
            args.destination.map((dest) =>
                sdk.Keypair.fromSecret(dest.privateKey)) :
            [issuerKeypair];
        const asset = new sdk.Asset(args.name, args.issuer.publicKey);
        const issuerAccount = await this.horizonServer.loadAccount(args.issuer.publicKey);
        const destinations = args.destination ?? [args.issuer];
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
        ).flat();

        let tx = this.buildTx(issuerAccount, issuerKeypair, ...ops);
        tx.sign(...destinationKeypair);
        try {
            const submitTransactionResponse = await this.horizonServer.submitTransaction(tx);
            const confirmation = await waitForConfirmation(submitTransactionResponse.hash);
            return confirmation;
        } catch (error) {
            console.error("ERROR!", error);
            showErrorResultCodes(error);
            return { status: "error", error: error };
        }
    }

    /**
     * Deploys a Stellar asset contract (SAC).
     * @param args The arguments for deploying the asset contract.
     *             - source: The source account's keypair and public key.
     *             - asset: The asset to be deployed.
     * @returns A promise that resolves to the confirmation of the transaction.
     */
    async deployStellarAssetContract(args: deployStellarAssetContractArgs): Promise<any> {
        const source = await this.sorobanServer.getAccount(args.source.publicKey);
        const sourceKeypair = sdk.Keypair.fromSecret(args.source.privateKey);

        const op = sdk.Operation.createStellarAssetContract({ asset: args.asset });
        const tx = this.buildTx(source, sourceKeypair, op);

        try {
            const preparedTransaction = await this.sorobanServer.prepareTransaction(tx);
            preparedTransaction.sign(sourceKeypair);

            const txRes = await this.sorobanServer.sendTransaction(preparedTransaction);
            const confirmation = await waitForConfirmation(txRes.hash);
            return confirmation;
        } catch (error) {
            console.log("inside catch");
            if ((error as string).includes("contract already exists")) {
                return { status: "error", error: "contract already exists" };
            }
            console.log(error);
            showErrorResultCodes(error);
            return { status: "error", error: error };
        }
    }

    /**
     * Sends a payment from one account to another on the Stellar network.
     * @param args The arguments for sending the payment.
     *             - from: The source account's keypair and public key.
     *             - to: The destination account's public key.
     *             - amount: The amount to send.
     *             - asset: The asset to send (e.g., XLM).
     * @returns A promise that resolves to the confirmation of the transaction.
     */
    async payment(args: paymentArgs): Promise<sdk.SorobanRpc.Api.GetSuccessfulTransactionResponse | sdk.SorobanRpc.Api.GetFailedTransactionResponse | { status: string; error: any }> {
        const sourceKeypair = sdk.Keypair.fromSecret(args.from.privateKey);
        const source = await this.horizonServer.loadAccount(args.from.publicKey);

        const ops = [
            sdk.Operation.payment({
                amount: args.amount,
                asset: args.asset,
                destination: args.to
            }),
        ];

        let tx = this.buildTx(source, sourceKeypair, ...ops);

        try {
            const submitTransactionResponse = await this.horizonServer.submitTransaction(tx);
            const confirmation = await waitForConfirmation(submitTransactionResponse.hash);
            return confirmation;
        } catch (error) {
            console.error("ERROR!", error);
            showErrorResultCodes(error);
            return { status: "error", error: error };
        }
    }


    /**
     * Increases the trustline limit for a specific asset on the Stellar network.
     * @param args The arguments for increasing the trustline.
     *             - source: The source account's keypair and public key.
     *             - asset: The asset for which to increase the trustline limit.
     *             - amount: The amount by which to increase the trustline limit.
     * @returns A promise that resolves to the confirmation of the transaction.
     */
    async increaseTrustline(args: {
        source: TestAccount,
        asset: sdk.Asset,
        amount: string
    }): Promise<sdk.SorobanRpc.Api.GetSuccessfulTransactionResponse | sdk.SorobanRpc.Api.GetFailedTransactionResponse | { status: string; error: any }> {
        const source = await this.horizonServer.loadAccount(args.source.publicKey);
        const sourceKeypair = sdk.Keypair.fromSecret(args.source.privateKey);
        const assetBalance = getAssetBalance({ account: source, asset: args.asset });
        const newLimit = assetBalance ? Number(assetBalance) + Number(args.amount) : Number(args.amount);

        const ops = [
            sdk.Operation.changeTrust({
                asset: args.asset,
                limit: newLimit.toString(),
                source: args.source.publicKey
            }),
        ];
        let tx = this.buildTx(source, sourceKeypair, ...ops);
        try {
            const submitTransactionResponse = await this.horizonServer.submitTransaction(tx);
            const confirmation = await waitForConfirmation(submitTransactionResponse.hash);
            return confirmation;
        } catch (error) {
            console.error("ERROR!", error);
            showErrorResultCodes(error);
            return { status: "error", error: error };
        }
    }

    /**
     * Establishes a trustline for a liquidity pool asset and adds liquidity to the pool.
     * @param args The arguments for establishing the trustline and adding liquidity.
     *             - assetA: The first asset of the liquidity pool.
     *             - assetB: The second asset of the liquidity pool.
     *             - amountA: The amount of the first asset to add to the pool (optional, default: "100").
     *             - amountB: The amount of the second asset to add to the pool (optional, default: "200").
     *             - source: The source account's keypair and private key.
     * @returns A promise that resolves when the trustline is established and liquidity is added to the pool.
     */
    async establishPoolTrustlineAndAddLiquidity(args: establishPoolTrustlineAndAddLiquidityArgs): Promise<[any, any]> {
        let assetA, assetB: sdk.Asset;
        let amountA, amountB: string;

        if (args.assetA < args.assetB) {
            assetA = args.assetB;
            assetB = args.assetA;
            amountA = args.amountB ?? "100";
            amountB = args.amountA ?? "200";
        } else {
            assetA = args.assetA;
            assetB = args.assetB;
            amountA = args.amountA ?? "100";
            amountB = args.amountB ?? "200";
        }

        const poolAsset = createLiquidityPoolAsset(assetA, assetB);
        const poolId = getLiquidityPoolId(poolAsset);
        const sourceKeypair = sdk.Keypair.fromSecret(args.source.privateKey);
        const sourceAccount = await this.horizonServer.loadAccount(sourceKeypair.publicKey());

        const confirmation1 = await this.establishPoolTrustline(sourceAccount, sourceKeypair, poolAsset);
        const confirmation2 = await this.liquidityPoolDeposit(sourceAccount, sourceKeypair, poolId, amountA, amountB);

        return Promise.all([confirmation1, confirmation2]);
    }

    /**
     * Establishes a trustline for a liquidity pool asset.
     * @param account The account for which to establish the trustline.
     * @param keypair The keypair associated with the account.
     * @param poolAsset The liquidity pool asset for which to establish the trustline.
     * @param amount The optional amount to set as the trustline limit (default: "100000").
     * @returns A promise that resolves to the confirmation of the transaction.
     */
    async establishPoolTrustline(
        account: sdk.Account,
        keypair: sdk.Keypair,
        poolAsset: sdk.LiquidityPoolAsset,
        amount?: Number | string
    ): Promise<any> {
        const limit = amount ? amount.toString() : "100000";
        
        try {
            const txRes = await this.horizonServer.submitTransaction(
                this.buildTx(
                    account,
                    keypair,
                    sdk.Operation.changeTrust({
                        asset: poolAsset,
                        limit: limit,
                    })
                )
            );
            const confirmation = await waitForConfirmation(txRes.hash);
            return confirmation;
        } catch (error) {
            console.error("ERROR!", error);
            showErrorResultCodes(error);
            return { status: "error", error: error };
        }
    }

    /**
     * Deposits liquidity into a liquidity pool on the Soroban network.
     * @param source The source account for the transaction.
     * @param signer The keypair associated with the source account.
     * @param poolId The ID of the liquidity pool.
     * @param maxReserveA The maximum amount of the first asset to deposit.
     * @param maxReserveB The maximum amount of the second asset to deposit.
     * @returns A promise that resolves to the confirmation of the transaction.
     */
    async liquidityPoolDeposit(
        source: sdk.Account,
        signer: sdk.Keypair,
        poolId: string,
        maxReserveA: string,
        maxReserveB: string
    ): Promise<any> {
        // Calculate the exact price of the assets
        const exactPrice = Number(maxReserveA) / Number(maxReserveB);

        // Calculate the minimum and maximum price with a 10% deviation
        const minPrice = exactPrice - exactPrice * 0.1;
        const maxPrice = exactPrice + exactPrice * 0.1;

        // Submit the transaction to deposit liquidity into the pool
        try {
            const txRes = await this.horizonServer.submitTransaction(
                this.buildTx(
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

            // Wait for confirmation of the transaction
            const confirmation = await waitForConfirmation(txRes.hash);
            return confirmation;
        }catch(error) {
            console.error("ERROR!", error);
            showErrorResultCodes(error);
            return { status: "error", error: error };
        }
    }

    async liquidityPoolWithdraw(args: liquidityPoolWithdrawArgs) {

        const ops = sdk.Operation.liquidityPoolWithdraw({
          liquidityPoolId: getLiquidityPoolId(args.poolAsset),
          amount: args.amount,
          minAmountA: args.minAmountA,
          minAmountB: args.minAmountB,
        })
        const sourceKeypair = sdk.Keypair.fromSecret(args.source.privateKey)
        const source = await this.horizonServer.loadAccount(args.source.publicKey)
        let tx = this.buildTx(source, sourceKeypair, ops)
        try {
          const submitTransactionResponse = await this.horizonServer.submitTransaction(tx)
            const confirmation = await waitForConfirmation(submitTransactionResponse.hash);
          return confirmation
        } catch (error) {
            console.error("ERROR!", error);
            showErrorResultCodes(error);
            return { status: "error", error: error };
        }
      }

    /**
     * Uploads a token contract WebAssembly (Wasm) file to the Soroban network.
     * @param signer The test account used to sign the transaction.
     * @returns A promise that resolves to the confirmation of the transaction.
     */
    async uploadTokenContractWasm(signer: TestAccount): Promise<any> {
        // Read the Wasm file
        const wasmBuffer = fs.readFileSync("/workspace/scripts/do-7-txs/soroban_token_contract.optimized.wasm");

        // Create the operation to upload the contract Wasm
        const op = sdk.Operation.uploadContractWasm({ wasm: wasmBuffer });

        // Get the source account and keypair
        const source = await this.sorobanServer.getAccount(signer.publicKey);
        const sourceKeypair = sdk.Keypair.fromSecret(signer.privateKey);

        // Build the transaction
        let tx = this.buildTx(source, sourceKeypair, op);

        try {
            // Prepare and sign the transaction
            const preparedTransaction = await this.sorobanServer.prepareTransaction(tx);
            preparedTransaction.sign(sourceKeypair);

            // Send the transaction and wait for confirmation
            const submitTransactionResponse = await this.sorobanServer.sendTransaction(preparedTransaction);
            const confirmation = await waitForConfirmation(submitTransactionResponse.hash);
            return confirmation;
        } catch (error) {
            console.error("ERROR!", error);
            showErrorResultCodes(error);
            return { status: "error", error: error };
        }
    }

    /**
     * Creates a token contract on the Soroban network.
     * @param signer The test account used to sign the transaction.
     * @returns A promise that resolves to the contract address of the created token contract.
     */
    async createTokenContract(signer: TestAccount): Promise<string | { status: string; error: any }> {
        // Read the Wasm file
        const wasmBuffer = fs.readFileSync("/workspace/scripts/do-7-txs/soroban_token_contract.optimized.wasm");

        // Calculate the hash of the Wasm file
        const hash = sdk.hash(wasmBuffer);

        // Create the operation to create the custom contract
        const op = sdk.Operation.createCustomContract({
            address: new sdk.Address(signer.publicKey),
            wasmHash: hash,
        });

        // Get the source account and keypair
        const source = await this.sorobanServer.getAccount(signer.publicKey);
        const sourceKeypair = sdk.Keypair.fromSecret(signer.privateKey);

        // Build the transaction
        let tx = this.buildTx(source, sourceKeypair, op);

        try {
            // Prepare and sign the transaction
            const preparedTransaction = await this.sorobanServer.prepareTransaction(tx);
            preparedTransaction.sign(sourceKeypair);

            // Send the transaction and wait for confirmation
            const submitTransactionResponse = await this.sorobanServer.sendTransaction(preparedTransaction);
            const confirmation = await waitForConfirmation(submitTransactionResponse.hash);

            if (confirmation.resultMetaXdr) {
                // Extract the contract ID from the transaction metadata
                const buff = Buffer.from(confirmation.resultMetaXdr.toXDR("base64"), "base64");
                const txMeta = sdk.xdr.TransactionMeta.fromXDR(buff);
                const contractId = txMeta
                    .v3()
                    .sorobanMeta()
                    ?.returnValue()
                    .address()
                    .contractId()
                    .toString("hex") || "";

                // Encode the contract ID as a Stellar contract address
                return sdk.StrKey.encodeContract(hexToByte(contractId));
            }
            else {
                return { status: "error", error: "No resultMetaXdr when creating token contract" };
            }
        } catch (error) {
            console.error("ERROR!", error);
            showErrorResultCodes(error);
            return { status: "error", error: error };
        }
    }

    /**
     * Initializes a token contract on the Soroban network.
     * @param args The arguments for initializing the token contract.
     *             - source: The source account's keypair and public key.
     *             - contractId: The ID of the token contract.
     *             - name: The name of the token.
     *             - symbol: The symbol of the token.
     * @returns A promise that resolves to the confirmation of the transaction.
     */
    async initializeTokenContract(args: initializeTokenContractArgs): Promise<any> {
        const source = await this.sorobanServer.getAccount(args.source.publicKey);
        const sourceKeypair = sdk.Keypair.fromSecret(args.source.privateKey);
        const initializeArgs = [
            new sdk.Address(args.source.publicKey).toScVal(),
            sdk.nativeToScVal(7, { type: "u32" }),
            sdk.nativeToScVal(args.name, { type: "string" }),
            sdk.nativeToScVal(args.symbol, { type: "string" }),
        ];
        const op = sdk.Operation.invokeContractFunction({
            contract: args.contractId,
            function: "initialize",
            args: initializeArgs,
        });

        let tx = this.buildTx(source, sourceKeypair, op);
        const preparedTransaction = await this.sorobanServer.prepareTransaction(tx);
        preparedTransaction.sign(sourceKeypair);
        try {
            const txRes = await this.sorobanServer.sendTransaction(preparedTransaction);
            const confirmation = await waitForConfirmation(txRes.hash);
            return confirmation;
        } catch (error) {
            showErrorResultCodes(error);
            console.log("error:", error);
            return { status: "error", error: error };
        }
    }


    /**
     * Mints tokens by invoking the `mint` function of a token contract on the Soroban network.
     * @param args The arguments for minting tokens.
     *             - source: The source account's keypair and public key.
     *             - contractId: The ID of the token contract.
     *             - destination: The destination account's public key.
     *             - amount: The amount of tokens to mint.
     * @returns A promise that resolves to the confirmation of the transaction.
     */
    async mintTokens(args: mintTokensArgs): Promise<any> {
        const source = await this.sorobanServer.getAccount(args.source.publicKey);
        const sourceKeypair = sdk.Keypair.fromSecret(args.source.privateKey);
        const mintTokenArgs = [
            new sdk.Address(args.destination).toScVal(),
            sdk.nativeToScVal(Number(args.amount), { type: "i128" }),
        ];
        const op = sdk.Operation.invokeContractFunction({
            contract: args.contractId,
            function: "mint",
            args: mintTokenArgs,
        });

        let tx = this.buildTx(source, sourceKeypair, op);
        const preparedTransaction = await this.sorobanServer.prepareTransaction(tx);
        preparedTransaction.sign(sourceKeypair);
        try {
            const txRes = await this.sorobanServer.sendTransaction(preparedTransaction);
            const confirmation = await waitForConfirmation(txRes.hash);
            return confirmation;
        } catch (error) {
            showErrorResultCodes(error);
            console.log("error:", error);
            return { status: "error", error: error };
        }
    }


    /**
     * Executes the add_liquidity function of the soroswap router contract to add liquidity to a pool.
     * @param args The arguments for adding liquidity.
     *             - source: The source account's keypair and public key.
     *             - tokenA: The address of the first token in the pool.
     *             - tokenB: The address of the second token in the pool.
     *             - amountADesired: The desired amount of token A to add to the pool.
     *             - amountBDesired: The desired amount of token B to add to the pool.
     *             - amountAMin: The minimum amount of token A to add to the pool.
     *             - amountBMin: The minimum amount of token B to add to the pool.
     *             - to: The destination account's keypair and public key.
     * @returns A promise that resolves to the confirmation of the transaction.
     */
    async addLiquiditySoroswap(args: addLiquiditySoroswapArgs): Promise<any> {
        const account = await this.sorobanServer.getAccount(args.source.publicKey);
        const sourceKeypair = sdk.Keypair.fromSecret(args.source.privateKey);

        const routerContract = new sdk.Contract(this.routerContractAddress);

        const scValParams = [
            new sdk.Address(args.tokenA).toScVal(),
            new sdk.Address(args.tokenB).toScVal(),
            sdk.nativeToScVal(Number(args.amountADesired), { type: "i128" }),
            sdk.nativeToScVal(Number(args.amountBDesired), { type: "i128" }),
            sdk.nativeToScVal(Number(args.amountAMin), { type: "i128" }),
            sdk.nativeToScVal(Number(args.amountBMin), { type: "i128" }),
            new sdk.Address(args.to.publicKey).toScVal(),
            sdk.nativeToScVal(getCurrentTimePlusOneHour(), { type: "u64" }),
        ];

        const op = routerContract.call("add_liquidity", ...scValParams);

        const transaction = this.buildTx(account, sourceKeypair, op);

        const preparedTransaction = await this.sorobanServer.prepareTransaction(transaction);
        preparedTransaction.sign(sourceKeypair);

        try {
            const txRes = await this.sorobanServer.sendTransaction(preparedTransaction);
            const confirmation = await waitForConfirmation(txRes.hash);
            return confirmation;
        } catch (error) {
            showErrorResultCodes(error);
            console.error(error);
        }
    }

    /**
     * Removes liquidity from a pool by invoking the `remove_liquidity` function of the soroswap router contract on the Soroban network.
     * @param args The arguments for removing liquidity.
     *             - source: The source account's keypair and public key.
     *             - tokenA: The address of the first token in the pool.
     *             - tokenB: The address of the second token in the pool.
     *             - liquidity: The amount of liquidity to remove.
     *             - amountAMin: The minimum amount of token A to receive.
     *             - amountBMin: The minimum amount of token B to receive.
     *             - to: The destination account's keypair and public key.
     * @returns A promise that resolves to the confirmation of the transaction.
     */
    async removeLiquiditySoroswap(args: removeLiquiditySoroswapArgs): Promise<any> {
        const source = await this.sorobanServer.getAccount(args.source.publicKey);
        const sourceKeypair = sdk.Keypair.fromSecret(args.source.privateKey);
        const routerContract = new sdk.Contract(this.routerContractAddress);

        const scValParams = [
            new sdk.Address(args.tokenA).toScVal(),
            new sdk.Address(args.tokenB).toScVal(),
            sdk.nativeToScVal(Number(args.liquidity), { type: "i128" }),
            sdk.nativeToScVal(Number(args.amountAMin), { type: "i128" }),
            sdk.nativeToScVal(Number(args.amountBMin), { type: "i128" }),
            new sdk.Address(args.to.publicKey).toScVal(),
            sdk.nativeToScVal(getCurrentTimePlusOneHour(), { type: "u64" }),
        ];

        const op = routerContract.call("remove_liquidity", ...scValParams);
        const transaction = this.buildTx(source, sourceKeypair, op);
        const preparedTransaction = await this.sorobanServer.prepareTransaction(transaction);
        preparedTransaction.sign(sourceKeypair);

        try {
            const txRes = await this.sorobanServer.sendTransaction(preparedTransaction);
            const confirmation = await waitForConfirmation(txRes.hash);
            return confirmation;
        } catch (error) {
            showErrorResultCodes(error);
            console.error(error);
        }
    }

}
