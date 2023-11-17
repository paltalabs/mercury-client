const {
  fetchSubscribeContractEvents,
  fetchSubscribeToLedgerEntries,
  fetchSubscribeToLedgerEntriesExpiration,
  fetchSubscribeToFullAccount,
} = require("../../services/subscribe");
const { SUBSCRIPTION_TYPES } = require("../../utils/constants");
const config = require("./config.json");

const { CONTRACT_EVENTS, LEDGER_ENTRIES, LEDGER_EXPIRATION, FULL_ACCOUNT } =
  SUBSCRIPTION_TYPES;

const hasRequiredKeys = (requiredKeys, args) => {
  for (const key of requiredKeys) {
    if (!args[key]) {
      console.error(
        `${args.name}: No ${key} provided for ledger entries subscription!, make sure to provide a ${key} in the config.json (params)`
      );
      return false;
    }
  }
  return true;
};

const handleContractEvents = async (args) => {
  const isValid = hasRequiredKeys(["contract_id"], args);
  if (!isValid) return;

  try {
    await fetchSubscribeContractEvents(args);
    console.log(`${args.name}: Subscribed to contract events successfully!`);
  } catch (error) {
    console.error(error);
  }
};

const handleLedgerEntries = async (args) => {
  const isValid = hasRequiredKeys(
    ["contract_id", "key_xdr", "max_single_size"],
    args
  );

  if (!isValid) return;

  try {
    await fetchSubscribeToLedgerEntries(args);
    console.log(`${args.name}: Subscribed to ledger entries successfully!`);
  } catch (error) {
    console.error(error);
  }
};

const handleLedgerExpiration = async (args) => {
  const isValid = hasRequiredKeys(["hash_xdr"], args);
  if (!isValid) return;

  try {
    await fetchSubscribeToLedgerEntriesExpiration(args);
    console.log(`${args.name}: Subscribed to ledger expiration successfully!`);
  } catch (error) {
    console.error(error);
  }
};

const handleFullAccount = async (args) => {
  const isValid = hasRequiredKeys(["publickey"], args);
  if (!isValid) return;

  try {
    await fetchSubscribeToFullAccount(args);
    console.log(`${args.name}: Subscribed to full account successfully!`);
  } catch (error) {
    console.error(error);
  }
};

const SUBSCRIPTIONS_FUNCTIONS_MAP = {
  [CONTRACT_EVENTS]: handleContractEvents,
  [LEDGER_ENTRIES]: handleLedgerEntries,
  [LEDGER_EXPIRATION]: handleLedgerExpiration,
  [FULL_ACCOUNT]: handleFullAccount,
};

const subscribe = async () => {
  const suscriptions = config.suscriptions;

  for await (const suscription of suscriptions) {
    const { name, events, params } = suscription;

    console.log(`Subscribing to ${name}...`);

    const args = {
      name,
      max_single_size: 2000,
      ...params,
    };

    for await (const event of events) {
      const subscribeFunction = SUBSCRIPTIONS_FUNCTIONS_MAP[event];

      if (!subscribeFunction) {
        console.error(
          `${args.name}: Subscription type ${event} not found, please look at the subscription types in utils/constants.js`
        );
        continue;
      }

      await subscribeFunction(args);
    }
  }
};

subscribe();
