const axios = require('axios');
const fs = require('fs')

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
            console.log(response.data);
            const jsonToSave = JSON.stringify(response.data, null, 2)
            try {

                fs.writeFileSync('results/responseData.json', jsonToSave)
            } catch (error) {
                console.error("error saving file: ", error)
            }

        } else {
            console.log(response);

        }

    } catch (error) {
        console.error('Error fetching data:', error);
    }
};
runQuery()
