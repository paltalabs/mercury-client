const { axiosBackendInstance } = require("../utils/axios");

const fetchSubscribeContractEvents = async ({
  contract_id,
  max_single_size,
  ...topics
}) => {
  const { data } = await axiosBackendInstance.post(`/event`, {
    contract_id,
    max_single_size,
    ...topics,
  });
  return data;
};

const fetchSubscribeToLedgerEntries = async ({
  contract_id,
  key_xdr,
  max_single_size,
}) => {
  const { data } = await axiosBackendInstance.post(`/entry`, {
    contract_id,
    key_xdr,
    max_single_size,
  });
  return data;
};

const fetchSubscribeToFullAccount = async ({ publickey }) => {
  const { data } = await axiosBackendInstance.post(`/account`, { publickey });
  return data;
};

const fetchSubscribeToLedgerEntriesExpiration = async ({ hash_xdr }) => {
  const { data } = await axiosBackendInstance.post(`/expiration`, { hash_xdr });
  return data;
};

module.exports = {
  fetchSubscribeContractEvents,
  fetchSubscribeToLedgerEntries,
  fetchSubscribeToFullAccount,
  fetchSubscribeToLedgerEntriesExpiration,
};
