import { Cluster } from '@solana/web3.js';

// const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
// const API_URL_BACKEND = process.env.NEXT_PUBLIC_API_URL_BACKEND || 'http://localhost:3000';
// const API_URL_SMART_CONTRACT = process.env.NEXT_PUBLIC_API_URL_SMART_CONTRACT || 'http://localhost:8899';
// const MONGO_URI = process.env.MONGO_URI;
const SOLLET_ENV = (process.env.REACT_APP_NETWORK_CLUSTER as Cluster) || 'testnest';
// const POOL_CONTRACT_PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_POOL_CONTRACT_PROGRAM_ID!);
const SOLANA_EXPLORER_URL = 'https://explorer.solana.com';
// const JOINED_USER_SEED = process.env.NEXT_PUBLIC_JOINED_USER_SEED!;
const REACT_APP_API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export const envConfig = {
  REACT_APP_API_BASE_URL,
  SOLANA_EXPLORER_URL,
  SOLLET_ENV,
};
