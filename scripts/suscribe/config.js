const { EVENT_TYPES } = require("../../utils/constants");

const { CONTRACT_EVENTS, LEDGER_ENTRIES, LEDGER_EXPIRATION, FULL_ACCOUNT } =
  EVENT_TYPES;

const suscriptions = [
  {
    name: "Router",
    address: "CCJRRQE4YNU4475CCUXYFU4PDWNOUQ6V2WQAPZP2Z6LF7SPMY74W7POU",
    events: [CONTRACT_EVENTS],
    params: {},
  },
  {
    name: "Factory",
    address: "CCJRRQE4YNU4475CCUXYFU4PDWNOUQ6V2WQAPZP2Z6LF7SPMY74W7POU",
    events: [CONTRACT_EVENTS],
    params: {},
  },
  {
    name: "Pair0",
    address: "CCJRRQE4YNU4475CCUXYFU4PDWNOUQ6V2WQAPZP2Z6LF7SPMY74W7POU",
    events: [CONTRACT_EVENTS],
    params: {},
  },
  {
    name: "Account0",
    address: "CCJRRQE4YNU4475CCUXYFU4PDWNOUQ6V2WQAPZP2Z6LF7SPMY74W7POU",
    events: [FULL_ACCOUNT],
    params: {},
  },
];

module.exports = {
  suscriptions,
};
