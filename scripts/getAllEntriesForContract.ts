import { runQuery } from "./runQuery";

const contractAddress = process.env.CONTRACT_ADDRESS;

const query = `
query EntriesByContractId($id: String!) {
    entryUpdateByContractId(
      contract: $id
    ) {
      nodes {
        contractId
        entryDurability
        keyXdr
        ledger
        ledgerTimestamp
        valueXdr
      }
    }
  }
`;

const variables = {
  id: contractAddress,
};

runQuery(query, variables);
