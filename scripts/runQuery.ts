import { axiosGraphqlInstance } from "../utils/axios";
import fs from "fs";

const contractAddress = process.env.CONTRACT_ADDRESS;

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

const variables = {
  id: contractAddress,
};

// First we will create the results folder if does not exist
const folderName = "results";

try {
  fs.mkdirSync(folderName);
  console.log(`🥑 Folder '${folderName}' created successfully.`);
} catch (err: any) {
  if (err.code === "EEXIST") {
    console.log(`🥑 The folder '${folderName}' already exists.`);
  } else {
    console.error(`An error occurred: ${err}`);
  }
}

// Now we will get some information about the contract we subscribed:
export const runQuery = async (query: string, variables: any) => {
  try {
    const body = {
      query,
      variables,
    };
    const { data } = await axiosGraphqlInstance.post("", body);
    console.log(data);

    const jsonToSave = JSON.stringify(data, null, 2);

    try {
      fs.writeFileSync("results/responseData.json", jsonToSave);
    } catch (error) {
      console.error("error saving file: ", error);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
// runQuery(query, variables)
