import Wallet from '@project-serum/sol-wallet-adapter';
import {
  BaseSignerWalletAdapter,
  pollUntilReady,
  WalletAdapterNetwork,
  WalletConnectionError,
  WalletDisconnectedError,
  WalletDisconnectionError,
  WalletError,
  WalletNotConnectedError,
  WalletNotFoundError,
  WalletSignTransactionError,
  WalletWindowBlockedError,
  WalletWindowClosedError,
} from '@solana/wallet-adapter-base';
import { PublicKey, Transaction } from '@solana/web3.js';

interface SolletWallet {
  postMessage(...args: unknown[]): unknown;
}

interface SolletWindow extends Window {
  sollet?: SolletWallet;
}

declare const window: SolletWindow;

export interface SolletWalletAdapterConfig {
  provider?: string | SolletWallet;
  network?: WalletAdapterNetwork;
  pollInterval?: number;
  pollCount?: number;
}

export class SolletWalletAdapter extends BaseSignerWalletAdapter {
  private _provider: string | SolletWallet | undefined;
  private _network: WalletAdapterNetwork;
  private _connecting: boolean;
  private _wallet: any | null;

  constructor(config: SolletWalletAdapterConfig = {}) {
    super();
    this._provider = config.provider || window.sollet;
    this._network = config.network || WalletAdapterNetwork.Mainnet;
    this._connecting = false;
    this._wallet = null;

    if (!this.ready)
      pollUntilReady(this, config.pollInterval || 1000, config.pollCount || 3);
  }

  get publicKey(): PublicKey | null {
    return this._wallet?.publicKey || null;
  }

  get ready(): boolean {
    return (
      typeof window !== 'undefined' &&
      (typeof this._provider === 'string' ||
        typeof window.sollet?.postMessage === 'function')
    );
  }

  get connecting(): boolean {
    return this._connecting;
  }

  get connected(): boolean {
    return !!this._wallet?.connected;
  }

  get autoApprove(): boolean {
    return !!this._wallet?.autoApprove;
  }

  async connect(): Promise<void> {
    try {
      if (this.connected || this.connecting) return;
      this._connecting = true;

      const provider = this._provider || window.sollet;
      if (!provider) throw new WalletNotFoundError();

      let wallet: any;
      try {
        wallet = new Wallet(provider, this._network);

        // HACK: sol-wallet-adapter doesn't reject or emit an event if the popup or extension is closed or blocked
        const handleDisconnect: (...args: unknown[]) => unknown = (
          wallet as any
        ).handleDisconnect;
        let timeout: NodeJS.Timer | undefined;
        let interval: NodeJS.Timer | undefined;
        try {
          await new Promise<void>((resolve, reject) => {
            const connect = () => {
              if (timeout) clearTimeout(timeout);
              wallet.off('connect', connect);
              resolve();
            };

            (wallet as any).handleDisconnect = (
              ...args: unknown[]
            ): unknown => {
              wallet.off('connect', connect);
              reject(new WalletWindowClosedError());
              return handleDisconnect.apply(wallet, args);
            };

            wallet.on('connect', connect);

            wallet.connect().catch((reason: any) => {
              wallet.off('connect', connect);
              reject(reason);
            });

            if (typeof provider === 'string') {
              let count = 0;

              interval = setInterval(() => {
                const popup = (wallet as any)._popup;
                if (popup) {
                  if (popup.closed) reject(new WalletWindowClosedError());
                } else {
                  if (count > 50) reject(new WalletWindowBlockedError());
                }

                count++;
              }, 100);
            }
          });
        } finally {
          (wallet as any).handleDisconnect = handleDisconnect;
          if (interval) clearInterval(interval);
        }
      } catch (error: any) {
        if (error instanceof WalletError) throw error;
        throw new WalletConnectionError(error?.message, error);
      }

      wallet.on('disconnect', this._disconnected);

      this._wallet = wallet;

      this.emit('connect');
    } catch (error: any) {
      this.emit('error', error);
      throw error;
    } finally {
      this._connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    const wallet = this._wallet;
    if (wallet) {
      wallet.off('disconnect', this._disconnected);

      this._wallet = null;

      try {
        // HACK: sol-wallet-adapter doesn't always fulfill its promise on disconnect
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => resolve(), 200);
          wallet.disconnect().then(
            () => {
              clearTimeout(timeout);
              resolve();
            },
            (error: any) => {
              clearTimeout(timeout);
              // HACK: sol-wallet-adapter rejects with an error on disconnect
              if (error.message === 'Wallet disconnected') {
                resolve();
              } else {
                reject(error);
              }
            }
          );
        });
      } catch (error: any) {
        this.emit('error', new WalletDisconnectionError(error?.message, error));
      }

      this.emit('disconnect');
    }
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      const wallet = this._wallet;
      if (!wallet) throw new WalletNotConnectedError();

      try {
        return await wallet.signTransaction(transaction);
      } catch (error: any) {
        throw new WalletSignTransactionError(error?.message, error);
      }
    } catch (error: any) {
      this.emit('error', error);
      throw error;
    }
  }

  async signAllTransactions(
    transactions: Transaction[]
  ): Promise<Transaction[]> {
    try {
      const wallet = this._wallet;
      if (!wallet) throw new WalletNotConnectedError();

      try {
        return await wallet.signAllTransactions(transactions);
      } catch (error: any) {
        throw new WalletSignTransactionError(error?.message, error);
      }
    } catch (error: any) {
      this.emit('error', error);
      throw error;
    }
  }

  private _disconnected = () => {
    const wallet = this._wallet;
    if (wallet) {
      wallet.off('disconnect', this._disconnected);

      this._wallet = null;

      this.emit('error', new WalletDisconnectedError());
      this.emit('disconnect');
    }
  };
}
