const {
  fetchSuscribeContractEvents,
  fetchSuscribeToLedgerEntries,
  fetchSuscribeToLedgerEntriesExpiration,
  fetchSuscribeToFullAccount,
} = require("../../services/suscribe");
const { EVENT_TYPES } = require("../../utils/constants");
const { suscriptions } = require("./config");

const { CONTRACT_EVENTS, LEDGER_ENTRIES, LEDGER_EXPIRATION, FULL_ACCOUNT } =
  EVENT_TYPES;

const handleContractEvents = async (args) => {
  //TODO: check if is already suscribed

  try {
    await fetchSuscribeContractEvents(args);
    console.log(`Suscribed to contract events successfully!`);
  } catch (error) {
    console.error(error);
  }
};

const handleLedgerEntries = async (args) => {
  //TODO: check if is already suscribed

  try {
    await fetchSuscribeToLedgerEntries(args);
    console.log(`Suscribed to ledger entries successfully!`);
  } catch (error) {
    console.error(error);
  }
};

const handleLedgerExpiration = async (args) => {
  //TODO: check if is already suscribed

  try {
    await fetchSuscribeToLedgerEntriesExpiration(args);
    console.log(`Suscribed to ledger expiration successfully!`);
  } catch (error) {
    console.error(error);
  }
};

const handleFullAccount = async (args) => {
  //TODO: check if is already suscribed

  try {
    await fetchSuscribeToFullAccount(args);
    console.log(`Suscribed to full account successfully!`);
  } catch (error) {
    console.error(error);
  }
};

const EVENT_FUNCTIONS_MAP = {
  [CONTRACT_EVENTS]: handleContractEvents,
  [LEDGER_ENTRIES]: handleLedgerEntries,
  [LEDGER_EXPIRATION]: handleLedgerExpiration,
  [FULL_ACCOUNT]: handleFullAccount,
};

const subscribe = async () => {
  for await (const suscription of suscriptions) {
    const { name, address, events, params } = suscription;

    console.log(`Suscribing to ${name} (${address})...`);

    const args = {
      contract_id: address,
      max_single_size: 2000,
      ...params,
    };

    for await (const event of events) {
      const suscribeFunction = EVENT_FUNCTIONS_MAP[event];

      if (!suscribeFunction) {
        console.error(
          `Event type ${event} not found, please look at the events types in utils/constants.js`
        );
        continue;
      }

      await suscribeFunction(args);
    }
  }
};

subscribe();
