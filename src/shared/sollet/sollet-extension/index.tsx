import Wallet from '@project-serum/sol-wallet-adapter';
import { toast } from 'react-toastify';

export function SolletExtensionAdapter(_: any, network: any) {
  const sollet = (window as any).sollet;
  if (sollet) {
    return new Wallet(sollet, network);
  }

  return {
    on: () => {},
    connect: () => {
      toast.error('Please install the Sollet Extension for Chrome');
    },
  };
}
