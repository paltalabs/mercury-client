import { fetchSubscribeToFullAccount } from "../services/subscribe";

const userAddress = "GCHR5WWPDFF3U3HP2NA6TI6FCQPYEWS3UOPIPJKZLAAFM57CEG4ZYBWP";

const subscribe = async () => {
  try {
    const data = {
      publickey: userAddress,
    };

    const response = await fetchSubscribeToFullAccount(data);
    console.log(response);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

subscribe();
