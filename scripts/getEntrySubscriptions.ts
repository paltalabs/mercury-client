import { runQuery } from "./runQuery";

const query = `
query MyQuery {
  allLedgerEntrySubscriptions {
    edges {
      node {
        id
        contractId
        keyXdr
        maxSingleSize
        startAt
        userId
      }
    }
  }
}
`;

const variables = {};

runQuery(query, variables);
