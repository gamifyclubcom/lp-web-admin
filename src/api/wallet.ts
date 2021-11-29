import { PublicKey, Connection, clusterApiUrl } from '@solana/web3.js';
import Wallet from '@project-serum/sol-wallet-adapter';

declare global {
  interface Window {
    sollet?: {
      postMessage(params: unknown): void;
    };
  }
}

const connection = new Connection(clusterApiUrl('devnet'));
const network = clusterApiUrl('devnet');

let wallet: Wallet;

export async function initial(): Promise<Wallet> {
  let retries = 30;
  if (wallet) return wallet;

  while (!window.sollet && retries > 0) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    retries--;
  }

  const providerUrl = window.sollet;
  wallet = new Wallet(providerUrl, network);

  return wallet;
}

export function connect(): void {
  wallet.connect();
}

export function disconnect(): void {
  if (!wallet.connected) {
    return;
  }

  wallet.disconnect();
}

export async function sign(
  data: Uint8Array,
  display: string
): Promise<{ signature: Buffer; publicKey: PublicKey }> {
  const { signature, publicKey } = await wallet.sign(data, display);

  return { signature, publicKey };
}

export async function getSolBalance(
  solAddress: string | undefined
): Promise<number> {
  if (!solAddress) {
    return 0;
  }

  const publicKey = new PublicKey(solAddress);
  const solBalance = await connection.getBalance(publicKey);

  return solBalance * 0.000000001 || 0;
}

export async function getTokenAmount(tokenAddress: string): Promise<number> {
  const publicKey = new PublicKey(tokenAddress);
  const tokenAmount = await connection.getTokenAccountBalance(publicKey);

  return tokenAmount?.value?.uiAmount || 0;
}
