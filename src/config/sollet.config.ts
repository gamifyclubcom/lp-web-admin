import { clusterApiUrl, PublicKey } from '@solana/web3.js';
import { ENV as ChainID } from '@solana/spl-token-registry';

import { ESolletEnv } from '../utils/enum';
import { ISolletChain } from '../utils/interface';

const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID: PublicKey = new PublicKey(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
);
const clockSysvarAccount: PublicKey = new PublicKey('SysvarC1ock11111111111111111111111111111111');

const SOLLET_CHAINS: ISolletChain[] = [
  {
    name: ESolletEnv.MAINNET_BETA,
    endpoint: 'https://solana-api.projectserum.com/',
    chainID: ChainID.MainnetBeta,
  },
  {
    name: ESolletEnv.TESTNET,
    endpoint: clusterApiUrl('testnet'),
    chainID: ChainID.Testnet,
  },
  {
    name: ESolletEnv.DEVNET,
    endpoint: clusterApiUrl('devnet'),
    chainID: ChainID.Devnet,
  },
  {
    name: ESolletEnv.LOCALNET,
    endpoint: 'http://127.0.0.1:8899',
    chainID: ChainID.Devnet,
  },
];

export const solletConfig = {
  SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
  SOLLET_CHAINS,
  clockSysvarAccount,
};
