import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import moment from 'moment';
import { envConfig, solletConfig } from '../config';
import { ESolletEnv } from '../utils/enum';
import { ISolletChain } from '../utils/interface';

const { SOLLET_ENV, SOLANA_EXPLORER_URL } = envConfig;
const { SOLLET_CHAINS } = solletConfig;

export const isEmpty = (str?: string | null): boolean => {
  if (!str) {
    return true;
  }
  return str.trim() === '';
};

export const getPercent = (curr: number, total: number): number => {
  return Math.ceil((curr * 100) / total);
};

export const transformLamportsToSOL = (lamports: number): number => {
  return lamports / LAMPORTS_PER_SOL;
};

export const getListPageFromTotalPage = (totalPage: number): number[] => {
  let listPage: number[] = [];
  let count = 1;

  while (count <= totalPage) {
    listPage.push(count);
    count++;
  }

  return listPage;
};

export const convertUnixTimestampToDate = (
  timestamp: number,
  format?: string
): string => {
  return moment.unix(timestamp).format(format || 'ddd MMM DD, YYYY HH:mm');
};

const binaryArrayToNumber = (arr: Uint8Array): number => {
  let len = arr.length;
  let pow: any = [];
  let decimal: any = [];
  for (let i = 0; i <= len - 1; i++) {
    pow.unshift(i);
  }
  arr.forEach((x, index) => {
    decimal.push(x * 2 ** pow[index]);
  });
  let toDecimal = decimal.reduce((acc: number, curr: number) => acc + curr, 0);
  return toDecimal;
};

const binaryArrayToBoolean = (arr: Uint8Array): boolean => {
  const value = binaryArrayToNumber(arr);
  if (value === 0) {
    return false;
  }

  return true;
};

export const extractPoolData = (
  arr: Uint8Array
): {
  isInitialized: boolean;
  nonce: number;
  poolTokenXAccount: PublicKey;
  poolTokenYAccount: PublicKey;
  whitelistAccount: PublicKey;
  rateNumerator: number;
  rateDenominator: number;
  feeNumerator: number;
  feeDenominator: number;
  startJoinPublic: number;
  earlyAccessDuration: number;
} => {
  const isInitialized = binaryArrayToBoolean(arr.slice(0, 1));
  const nonce = binaryArrayToNumber(arr.slice(1, 2));
  const poolTokenXAccount = new PublicKey(arr.slice(2, 34));
  const poolTokenYAccount = new PublicKey(arr.slice(34, 66));
  const whitelistAccount = new PublicKey(arr.slice(66, 98));
  const rateNumerator = binaryArrayToNumber(arr.slice(98, 106));
  const rateDenominator = binaryArrayToNumber(arr.slice(106, 114));

  return {
    isInitialized,
    nonce,
    poolTokenXAccount,
    poolTokenYAccount,
    whitelistAccount,
    rateNumerator, // TODO: should fix later
    rateDenominator, // TODO: should fix later,
    feeNumerator: 12, // TODO: should fix later,
    feeDenominator: 12, // TODO: should fix later,
    startJoinPublic: 12, // TODO: should fix later,
    earlyAccessDuration: 12, // TODO: should fix later,
  };
};

export const generateOnChainUrl = (
  variant: 'tx' | 'address',
  value: string
): string => {
  return `${SOLANA_EXPLORER_URL}/${variant}/${value}?cluster=${SOLLET_ENV}`;
};

export const getCurrentChain = (): ISolletChain => {
  let matched: ISolletChain | null;
  const defaultChain = SOLLET_CHAINS.find(
    (slc) => slc.name === ESolletEnv.TESTNET
  )!;

  if (SOLLET_ENV && (SOLLET_ENV as ESolletEnv)) {
    matched = SOLLET_CHAINS.find((slc) => slc.name === SOLLET_ENV) || null;
  } else {
    matched = null;
  }

  if (matched) {
    return matched;
  }

  return defaultChain;
};

const numberFormatter = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const getConnection = (): Connection => {
  const chain = getCurrentChain();
  const { endpoint } = chain;
  return new Connection(endpoint, 'recent');
};

const isSmallNumber = (val: number) => {
  return val < 0.001 && val > 0;
};

export const formatNumber = {
  format: (val?: number, useSmall?: boolean) => {
    if (!val && val !== 0) {
      return '--';
    }
    if (useSmall && isSmallNumber(val)) {
      return 0.001;
    }

    return numberFormatter.format(val);
  },
};

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function parseTransaction(rawTransaction: string | Buffer) {
  let transactionBuffer;
  if (typeof rawTransaction === 'string') {
    transactionBuffer = Buffer.from(rawTransaction, 'base64');
  } else {
    transactionBuffer = rawTransaction;
  }
  const transaction = Transaction.from(transactionBuffer);
  return transaction;
}

export async function sendSignedTransaction(
  conn: Connection,
  transaction: Buffer
) {
  await conn.sendRawTransaction(transaction, {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  });

  await sleep(5000);
}

export function round(num: number, decimals: number) {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
