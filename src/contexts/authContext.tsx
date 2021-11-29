import { createContext, useEffect, useState } from 'react';
import { Cluster, PublicKey } from '@solana/web3.js';
import { useConnection, useLocalStorageState } from '../hooks';
import { formatNumber, transformLamportsToSOL } from '../shared/helper';
import {
  isTokenOwnedByAddress,
  verifyAndDecode,
  createTokenWithSignMessageFunc,
  createTokenWithWalletAdapter,
} from '@gamify/onchain-program-sdk';
import { useWallet } from '@solana/wallet-adapter-react';

interface AuthState {
  isAuthenticated: boolean;
  cluster: Cluster;
  balance: {
    value: number;
    formatted: string;
  };
  login: (...args: any[]) => Promise<void>;
  logout: () => void;
  changeCluster: (cluster: Cluster) => void;
}

const defaultState: AuthState = {
  isAuthenticated: false,
  cluster: 'devnet',
  balance: {
    value: 0,
    formatted: '0',
  },
  login: async () => {},
  logout: () => {},
  changeCluster: () => {},
};

const AuthContext = createContext<AuthState>(defaultState);

export const AuthProvider: React.FC = ({ children }) => {
  const { wallet, publicKey: walletPublicKey } = useWallet();
  const [publicKey, setPublicKey] = useLocalStorageState('public_key');
  const [accessToken, setAccessToken] = useLocalStorageState('access_token');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return false;
  });

  const [balance, setBalance] = useState<{
    value: number;
    formatted: string;
  }>({
    value: 0,
    formatted: '0',
  });
  const { connection } = useConnection();
  const [cluster, setCluster] = useState<Cluster>('devnet');

  useEffect(() => {
    console.log({ wallet, publicKey: walletPublicKey });
    const getAuthenStatus = () => {
      if (!walletPublicKey || !publicKey || !accessToken) {
        return false;
      }

      if (walletPublicKey?.toString() !== publicKey) {
        return false;
      }

      if (!isTokenOwnedByAddress(accessToken, publicKey)) {
        return false;
      }

      const result = verifyAndDecode(accessToken);
      if (!result.isValid || result.isExpired) {
        return false;
      }

      return true;
    };
    setIsAuthenticated(getAuthenStatus());
  }, [wallet, walletPublicKey]);

  useEffect(() => {
    console.log({ publicKey });
    if (publicKey) {
      console.log('1');
      connection
        .getAccountInfo(new PublicKey(publicKey))
        .then((response) => {
          const balanceResult = transformLamportsToSOL(response?.lamports!);
          setBalance({
            value: balanceResult,
            formatted: formatNumber.format(balanceResult) as string,
          });
        })
        .catch((err) => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey]);

  const changeCluster = (newCluster: Cluster): void => {
    setCluster(newCluster);
  };

  const login = async (
    walletAddress: PublicKey,
    signMessage?: (message: Uint8Array) => Promise<Uint8Array>,
    adapter?: any
  ): Promise<void> => {
    try {
      let token;
      if (signMessage) {
        token = await createTokenWithSignMessageFunc(
          signMessage!,
          walletAddress
        );
      } else {
        token = await createTokenWithWalletAdapter(adapter._wallet);
      }
      setIsAuthenticated(true);
      setPublicKey(walletAddress.toString());
      setAccessToken(token);
    } catch (e) {
      setIsAuthenticated(false);
      setPublicKey(null);
      console.log(e);
      throw new Error('Can not login, please try again');
    }
  };

  const logout = async () => {
    setIsAuthenticated(false);
    setPublicKey(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        cluster,
        balance,
        login,
        logout,
        changeCluster,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
