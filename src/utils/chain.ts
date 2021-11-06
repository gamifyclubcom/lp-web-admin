import { PublicKey } from '@solana/web3.js';

export const extractPoolData = (
  arr: Uint8Array
): {
  isInitialized: boolean;
  nonce: number;
  poolTokenXAccount: string;
  poolTokenYAccount: string;
} => {
  const isInitialized = arr[0] === 1 ? true : false;
  const nonce = arr[1];
  const poolTokenXAccount = new PublicKey(arr.slice(2, 34));
  const poolTokenYAccount = new PublicKey(arr.slice(34, 66));

  return {
    isInitialized,
    nonce,
    poolTokenXAccount: poolTokenXAccount.toString(),
    poolTokenYAccount: poolTokenYAccount.toString(),
  };
};
