import {
  fetchSubscribeToContractEvents,
  fetchSubscribeToLedgerEntries,
  fetchSubscribeToLedgerEntriesExpiration,
  fetchSubscribeToFullAccount,
} from "../../services/subscribe";
import {
  AnySubscribeProps,
  SubscriptionConfig,
  SubscriptionType,
} from "../../types/subscribe";
import config from "./config.json";

const { CONTRACT_EVENTS, LEDGER_ENTRIES, LEDGER_EXPIRATION, FULL_ACCOUNT } =
  SubscriptionType;

const handleSubscription = (
  subscription: SubscriptionType,
  params: AnySubscribeProps
) => {
  const { contract_id, max_single_size, key_xdr, publickey, hash_xdr } = params;

  if (subscription === CONTRACT_EVENTS) {
    if (!contract_id || !max_single_size)
      throw new Error(
        `contract_id and max_single_size are required in subscription type: ${subscription}`
      );
    const args = { contract_id, max_single_size, ...params };
    return fetchSubscribeToContractEvents(args);
  }

  if (subscription === LEDGER_ENTRIES) {
    if (!contract_id || !max_single_size || !key_xdr)
      throw new Error(
        `contract_id, max_single_size and key_xdr are required in subscription type: ${subscription}`
      );
    const args = { contract_id, key_xdr, max_single_size };
    return fetchSubscribeToLedgerEntries(args);
  }

  if (subscription === LEDGER_EXPIRATION) {
    if (!hash_xdr)
      throw new Error("hash_xdr is required in subscription type: ");
    const args = { hash_xdr };
    return fetchSubscribeToLedgerEntriesExpiration(args);
  }

  if (subscription === FULL_ACCOUNT) {
    if (!publickey)
      throw new Error("publickey is required in subscription type: ");
    const args = { publickey };
    return fetchSubscribeToFullAccount(args);
  }

  throw new Error(`Subscription type ${subscription} not found`);
};

const subscribe = async () => {
  const subscriptions = config.subscriptions as SubscriptionConfig[];

  for await (const subscription of subscriptions) {
    const { name, events, params } = subscription;

    for await (const event of events) {
      try {
        await handleSubscription(event, { max_single_size: 2000, ...params });
        console.log(`${name}: Subscribed to ${event} event successfully`);
      } catch (error) {
        console.log(error);
      }
    }
  }
};

subscribe();
