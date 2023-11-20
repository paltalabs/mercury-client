import { runQuery } from "./runQuery";

const query = `
query MyQuery {
  allContractEventSubscriptions {
    edges {
      node {
        contractId
        topic1
        topic2
        topic3
        topic4
        subscriptionId
        userId
        maxSingleSize
      }
    }
  }
}
`;

const variables = {};

runQuery(query, variables);
