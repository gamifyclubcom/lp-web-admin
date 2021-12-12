export enum PoolStatusType {
  DRAFT = 'draft',
  OPEN = 'open',
  CLOSED = 'closed',
  FILLED = 'filled',
  UPCOMING = 'upcoming',
}

export enum ESolletEnv {
  MAINNET_BETA = 'mainnet-beta',
  TESTNET = 'testnet',
  DEVNET = 'devnet',
  LOCALNET = 'localnet',
}

export enum ErrorMessages {
  UserRejectRequest = 'User rejected the request.',
  TransactionTimeout = 'Transaction timeout.',
  UnKnow = 'Something went wrong. Please try again later.',
}
