const axios = require('axios');

const MERCURY_ACCESS_TOKEN = process.env.MERCURY_ACCESS_TOKEN;

const MERCURY_BACKEND_ENDPOINT = process.env.MERCURY_BACKEND_ENDPOINT;

const contractAddress = process.env.CONTRACT_ADDRESS

const subscribe = async () => {
    try {
        const config = {
            headers: {
                'Authorization': `Bearer ${MERCURY_ACCESS_TOKEN}`
            }
        };
        const data = {
            contract_id: contractAddress,
            max_single_size: 4000
        }

        const response = await axios.post(`${MERCURY_BACKEND_ENDPOINT}/event`, data, config);

        if (response.status == 200) {
            console.log("success")
        }
        // console.log(response);
        // console.log(response.data);


    } catch (error) {
        console.error('Error fetching data:', error);
    }
};


subscribe();
