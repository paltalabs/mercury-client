import { fetchSubscribeToLedgerEntries } from "../services/subscribe";

const contractAddress = process.env.CONTRACT_ADDRESS;

const subscribe = async () => {
  try {
    const data = {
      contract_id: contractAddress!,
      max_single_size: 4000,
      key_xdr: "something",
    };
    const response = await fetchSubscribeToLedgerEntries(data);

    console.log(response);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

subscribe();
