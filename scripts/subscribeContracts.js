const axios = require('axios');

const MERCURY_ACCESS_TOKEN = process.env.MERCURY_ACCESS_TOKEN;

const MERCURY_BACKEND_ENDPOINT = process.env.MERCURY_BACKEND_ENDPOINT;

// const contractAddress = process.env.CONTRACT_ADDRESS
const subscriptions = [
    {
    //     "contract": "pair_ARST_AQUA",
    //     "address": "CAXROB2BP7SIIEHPD52NQKUXFD7M7OTNYNWGXB47AUYEUAUDC6V4F357",
    //     "type": "event"
    // },{
    //     "contract": "pair_ARST_AQUA",
    //     "address": "CAXROB2BP7SIIEHPD52NQKUXFD7M7OTNYNWGXB47AUYEUAUDC6V4F357",
    //     "type": "entry"
    // },    {
    //     "contract": "Router",
    //     "address": "CAVKFXGNANLFPXORKNLZEFNHO2VIN54KCAILJKZZF3UUZ6OYDPVJ3V23",
    //     "type": "event"
    // },{
    //     "contract": "Router",
    //     "address": "CAVKFXGNANLFPXORKNLZEFNHO2VIN54KCAILJKZZF3UUZ6OYDPVJ3V23",
    //     "type": "entry"
    // },    {
    //     "contract": "Factory",
    //     "address": "CDTSHKQP7RSW4IHGSMSWMPC2SXBNEF5GAQFWXSOFG2RIGW6KTY6LDQSG",
    //     "type": "event"
    // },{
    //     "contract": "Factory",
    //     "address": "CDTSHKQP7RSW4IHGSMSWMPC2SXBNEF5GAQFWXSOFG2RIGW6KTY6LDQSG",
    //     "type": "entry"
    // },{
        "contract": "pair_USDC_XLM",
        "address": "CCJRRQE4YNU4475CCUXYFU4PDWNOUQ6V2WQAPZP2Z6LF7SPMY74W7POU",
        "type": "event"
    },{
        "contract": "pair_USDC_XLM",
        "address": "CCJRRQE4YNU4475CCUXYFU4PDWNOUQ6V2WQAPZP2Z6LF7SPMY74W7POU",
        "type": "entry"
    },
    ]


const subscribe = async (contractAddress, subscriptionType) => {
    try {
        console.log("contractAddress:", contractAddress)
        console.log("subscriptionType:", subscriptionType)
        console.log("MERCURY_ACCESS_TOKEN:", MERCURY_ACCESS_TOKEN)
        console.log("MERCURY_BACKEND_ENDPOINT:", MERCURY_BACKEND_ENDPOINT)
        const config = {
            headers: {
                'Authorization': `Bearer ${MERCURY_ACCESS_TOKEN}`
            }
        };
        const data = {
            contract_id: contractAddress,
            max_single_size: subscriptionType=="event"?200:64000
        }

        const response = await axios.post(`${MERCURY_BACKEND_ENDPOINT}/${subscriptionType}`, data, config);

        if (response.status == 200) {
            console.log("success")
        }
        // console.log(response);
        // console.log(response.data);


    } catch (error) {
        console.error('Error fetching data:', error);
    }
};

// subscribe(subscriptions[1].contractAddress, subscriptions[1].type)
for(subscription of subscriptions) {
    subscribe(subscription.address, subscription.type)
}
// subscribe();
