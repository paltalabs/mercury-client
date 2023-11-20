import {
  SubscribeToContractEventsProps,
  SubscribeToFullAccountProps,
  SubscribeToLedgerEntriesExpirationProps,
  SubscribeToLedgerEntriesProps,
} from "../types/subscribe";
import { axiosBackendInstance } from "../utils/axios";

export const fetchSubscribeToContractEvents = async (
  params: SubscribeToContractEventsProps
) => {
  const { data } = await axiosBackendInstance.post(`/event`, params);
  return data;
};

export const fetchSubscribeToLedgerEntries = async (
  params: SubscribeToLedgerEntriesProps
) => {
  const { data } = await axiosBackendInstance.post(`/entry`, params);
  return data;
};

export const fetchSubscribeToFullAccount = async (
  params: SubscribeToFullAccountProps
) => {
  const { data } = await axiosBackendInstance.post(`/account`, params);
  return data;
};

export const fetchSubscribeToLedgerEntriesExpiration = async (
  params: SubscribeToLedgerEntriesExpirationProps
) => {
  const { data } = await axiosBackendInstance.post(`/expiration`, params);
  return data;
};
