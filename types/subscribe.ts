export enum SubscriptionType {
  CONTRACT_EVENTS = "event",
  LEDGER_ENTRIES = "entry",
  LEDGER_EXPIRATION = "expiration",
  FULL_ACCOUNT = "account",
}

export interface SubscriptionConfig {
  name: string;
  events: SubscriptionType[];
  params: AnySubscribeProps;
}

export interface SubscribeToContractEventsProps {
  contract_id: string;
  max_single_size: number;
  [key: string]: any;
}

export interface SubscribeToLedgerEntriesProps {
  contract_id: string;
  key_xdr: string;
  max_single_size: number;
}

export interface SubscribeToLedgerEntriesExpirationProps {
  hash_xdr: string;
}

export interface SubscribeToFullAccountProps {
  publickey: string;
}

export interface AnySubscribeProps {
  contract_id?: string;
  max_single_size?: number;
  key_xdr?: string;
  hash_xdr?: string;
  publickey?: string;
  [key: string]: any;
}
