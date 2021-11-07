import Wallet from '@project-serum/sol-wallet-adapter';
// import { useAlert } from '../../hooks';
import { SolletWalletAdapter, SolletWalletAdapterConfig } from '../sollet';

export const ICONS_URL = 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/icons';

export function SolletExtensionAdapter(_: any, network: any) {
  // const { alertError } = useAlert();
  const sollet = (window as any).sollet;
  if (sollet) {
    return new Wallet(sollet, network);
  }

  return {
    on: () => {},
    connect: () => {
      console.log('Please install the Sollet Extension for Chrome');
      // alertError('Please install the Sollet Extension for Chrome');
    },
  };
}

export const getSolletExtensionWallet = (config?: SolletWalletAdapterConfig): any => {
  const sollet = (window as any).sollet;
  return {
    name: 'Sollet extension',
    url: 'https://www.sollet.io/extension',
    icon: `${ICONS_URL}/sollet.svg`,
    adapter: () => new SolletWalletAdapter({ ...config, provider: sollet }),
  };
};
