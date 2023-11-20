import { fetchSubscribeToContractEvents } from "../services/subscribe";

const contractAddress = process.env.CONTRACT_ADDRESS;

const subscribe = async () => {
  try {
    const data = {
      contract_id: contractAddress!,
      max_single_size: 4000,
    };

    const response = await fetchSubscribeToContractEvents(data);
    console.log(response);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

subscribe();
