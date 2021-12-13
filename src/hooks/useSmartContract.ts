import { WalletSignTransactionError } from '@solana/wallet-adapter-base';
import { ErrorMessages } from '../utils/enum';
import { useAlert } from './useAlert';

export function useSmartContract() {
  const { alertError } = useAlert();

  const handleOnchainError = (err: any) => {
    console.log({ err });
    if (err as WalletSignTransactionError) {
      if (typeof err === 'string') {
        alertError(err);
      } else if (
        err &&
        (err.code === '4001' ||
          err.message === 'Transaction cancelled' ||
          err.name === WalletSignTransactionError.name)
      ) {
        alertError(ErrorMessages.UserRejectRequest);
      } else if (err && err.message) {
        alertError(err.message);
      } else {
        alertError(ErrorMessages.UnKnow);
      }
    } else {
      alertError(ErrorMessages.UnKnow);
    }
  };

  return { handleOnchainError };
}
