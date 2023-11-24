import { axiosGraphqlInstance } from "../utils/axios";

const MERCURY_TESTER_EMAIL = process.env.MERCURY_TESTER_EMAIL;
const MERCURY_TESTER_PASSWORD = process.env.MERCURY_TESTER_PASSWORD;

const mutation = `mutation MyMutation {
      authenticate(input: {email: "${MERCURY_TESTER_EMAIL}", password: "${MERCURY_TESTER_PASSWORD}"}) {
        clientMutationId
        jwtToken
      }
    }`;

const updateToken = async () => {
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
        "Authorization": undefined
      },
    };
    const body = {
      query: mutation,
    };
    const { data } = await axiosGraphqlInstance.post("", body, config);

    console.log(data);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

updateToken();
