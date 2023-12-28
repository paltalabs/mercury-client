import { Mercury } from "mercury-sdk";
// import { getContractEventsParser } from "./utils/parsers/getContractEventsParser";

import {
  getSentPaymentsParser,
  getReceivedPaymentsParser,
  getLiquidityPoolWithdrawParser,
  getLiquidityPoolDepositParser,
  getContractEventsParser
} from "mercury-sdk"
import dotenv from "dotenv";
import { getRouterContractAddress, loadAccounts } from "../do-7-txs/utils";
dotenv.config();

(async function () {
  const mercuryArgs = {
    backendEndpoint: process.env.MERCURY_BACKEND_ENDPOINT!,
    graphqlEndpoint: process.env.MERCURY_GRAPHQL_ENDPOINT!,
    email: process.env.MERCURY_TESTER_EMAIL,
    password: process.env.MERCURY_TESTER_PASSWORD,
  };

  const mercuryInstance = new Mercury({
    backendEndpoint: process.env.MERCURY_BACKEND_ENDPOINT!,
    graphqlEndpoint: process.env.MERCURY_GRAPHQL_ENDPOINT!,
    email: process.env.MERCURY_TESTER_EMAIL!,
    password: process.env.MERCURY_TESTER_PASSWORD!,
  });

  const testAccounts = loadAccounts()
  const publicKey = testAccounts![1].publicKey;
  const publicKey2 = testAccounts![2].publicKey;

  const routerContractAddress = await getRouterContractAddress("https://api.soroswap.finance", "testnet")

  const sentPaymentsResponse = await mercuryInstance.getSentPayments({
    publicKey,
  });

  if (sentPaymentsResponse.ok) {
    const sentPaymentsParsedData = getSentPaymentsParser(
      sentPaymentsResponse.data!
    );
    console.log("sentPaymentsParsedData")
    console.log(JSON.stringify(sentPaymentsParsedData, null, 2) + "\n");
  }

  //Received payments
  const receivedPaymentsResponse = await mercuryInstance.getReceivedPayments({
    publicKey,
  });

  if (receivedPaymentsResponse.ok) {
    const receivedPaymentsParsedData = getReceivedPaymentsParser(
      receivedPaymentsResponse.data!
    );
    console.log("receivedPaymentsParsedData")
    console.log(JSON.stringify(receivedPaymentsParsedData, null, 2) + "\n");
  }

  //Liquidity Pool Withdraw
  const liquidityPoolWithdrawResponse =
    await mercuryInstance.getLiquidityPoolWithdraw({
      publicKey: publicKey2,
    });

  if (liquidityPoolWithdrawResponse.ok) {
    const liquidityPoolWithdrawParsedData = getLiquidityPoolWithdrawParser(
      liquidityPoolWithdrawResponse.data!
    );
    console.log("liquidityPoolWithdrawParsedData")
    console.log(JSON.stringify(liquidityPoolWithdrawParsedData, null, 2) + "\n");
  }

  //Liquidity Pool Deposit
  const liquidityPoolDepositResponse =
    await mercuryInstance.getLiquidityPoolDeposit({
      publicKey,
    });

  if (liquidityPoolDepositResponse.ok) {
    const liquidityPoolDepositParsedData = getLiquidityPoolDepositParser(
      liquidityPoolDepositResponse.data!
    );
    console.log("liquidityPoolDepositParsedData")
    console.log(JSON.stringify(liquidityPoolDepositParsedData, null, 2) + "\n");
  }


  const getContractEventsRes = await mercuryInstance.getContractEvents({
    contractId: routerContractAddress,
  });
  const parsedContractEvents = getContractEventsParser(getContractEventsRes.data!);
  const eventByPublicKey = parsedContractEvents.filter((event) => event.to === publicKey);
  console.log("eventByPublicKey")
  console.log(JSON.stringify(eventByPublicKey, null, 2) + "\n");
})();
