const axios = require('axios');

const MERCURY_ACCESS_TOKEN = process.env.MERCURY_ACCESS_TOKEN;

const MERCURY_BACKEND_ENDPOINT = process.env.MERCURY_BACKEND_ENDPOINT;

const userAddress = "GCHR5WWPDFF3U3HP2NA6TI6FCQPYEWS3UOPIPJKZLAAFM57CEG4ZYBWP"

const subscribe = async () => {
    try {
        const config = {
            headers: {
                'Authorization': `Bearer ${MERCURY_ACCESS_TOKEN}`
            }
        };
        const data = {
            publickey: userAddress,
        }

        const response = await axios.post(`${MERCURY_BACKEND_ENDPOINT}/account`, data, config);

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
