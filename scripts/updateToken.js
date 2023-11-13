const axios = require('axios');

const MERCURY_GRAPHQL_ENDPOINT = process.env.MERCURY_GRAPHQL_ENDPOINT;
const MERCURY_TESTER_EMAIL = process.env.MERCURY_TESTER_EMAIL;
const MERCURY_TESTER_PASSWORD = process.env.MERCURY_TESTER_PASSWORD;
const MERCURY_ACCESS_TOKEN = process.env.MERCURY_ACCESS_TOKEN;

const mutation = `mutation MyMutation {
      authenticate(input: {email: "${MERCURY_TESTER_EMAIL}", password: "${MERCURY_TESTER_PASSWORD}"}) {
        clientMutationId
        jwtToken
      }
    }`

console.log(mutation)

const updateToken = async () => {
    try {
        const config = {
            headers: {
                'Content-Type': 'application/json'
            }
        };
        const data = {
            query: mutation
        }

        const response = await axios.post(`${MERCURY_GRAPHQL_ENDPOINT}/graphql`, data, config);

        if (response.status == 200) {
            console.log("success")
            console.log(response.data)
        }
        // console.log(response);
        // console.log(response.data);


    } catch (error) {
        console.error('Error fetching data:', error);
    }
};


updateToken();
