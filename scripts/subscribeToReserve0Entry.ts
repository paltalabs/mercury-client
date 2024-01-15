import { fetchSubscribeToLedgerEntries } from "../services/subscribe";


const subscribe = async (contractAddress: string, key_xdr: string, durability:string) => {
  try {
    const data = {
      contract_id: contractAddress!,
      max_single_size: 64000,
      key_xdr: key_xdr,
      durability: durability,
    };
    const response = await fetchSubscribeToLedgerEntries(data);
    
    console.log(response);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

// const contractAddress = process.env.CONTRACT_ADDRESS;
// const contractAddress = "CDYLINP2CX64S2YC4CCI44XH4H7K6Z2WB5UV3U33VIK36T7YATR2QTXP";
const durability = "persistent";
// const dataKeys = [
//   'AAAAEAAAAAEAAAABAAAADwAAAAhSZXNlcnZlMA==',
//   'AAAAEAAAAAEAAAABAAAADwAAAAhSZXNlcnZlMQ==',
//   'AAAAEAAAAAEAAAABAAAADwAAAAZUb2tlbjAAAA==',
//   'AAAAEAAAAAEAAAABAAAADwAAAAZUb2tlbjEAAA=='
// ]
// const dataKeys = [
//   'AAAAEAAAAAEAAAABAAAADwAAAAEwAAAA',
//   'AAAAEAAAAAEAAAABAAAADwAAAAExAAAA',
//   'AAAAEAAAAAEAAAABAAAADwAAAAEyAAAA',
//   'AAAAEAAAAAEAAAABAAAADwAAAAEzAAAA',
// ]

const contractAddress = "CDWAP4TOTGCXCGT7JPXHDZHBWDPFHXZU3S2G63PMMDE6SY4HVYOL6QDL"
const dataKeys = [
  "AAAAEAAAAAEAAAACAAAADwAAAAdCYWxhbmNlAAAAABIAAAAAAAAAAFUWWe5g5Lq9tT6zwW0X7eaXAekYqJ/ShE4o1fKizkYK"
]
dataKeys.forEach(key_xdr => {
  subscribe(contractAddress, key_xdr, durability);
});
