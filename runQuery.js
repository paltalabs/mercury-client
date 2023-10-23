const axios = require('axios');

const MERCURY_ACCESS_TOKEN = process.env.MERCURY_ACCESS_TOKEN;
const MERCURY_GRAPHQL_ENDPOINT = process.env.MERCURY_GRAPHQL_ENDPOINT;

const contractAddress = process.env.CONTRACT_ADDRESS

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


// Now we will get some information about the contract we subscribed:
const runQuery = async () => {
    try {
        const config = {
            headers: {
                'Authorization': `Bearer ${MERCURY_ACCESS_TOKEN}`
            }
        };

        const variables = {
            id: contractAddress
        };

        const data = {
            query,
            variables
        }

        const response = await axios.post(`${MERCURY_GRAPHQL_ENDPOINT}/graphql`, data, config);
        if (response.status == 200) {
            console.log("success")
        }
        console.log(response);
        console.log(response.data);

    } catch (error) {
        console.error('Error fetching data:', error);
    }
};
runQuery()
