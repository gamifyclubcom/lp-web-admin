import { useEffect, useState } from 'react';
import Wallet from './Wallet';
import * as walletAPI from '../../api/wallet';
import * as types from '../../types';
import { WALLET_LIST_TOKEN_INFO_KEY } from '../../utils/constants';
import { useWallet } from '@solana/wallet-adapter-react';

const WalletContainer: React.FC = () => {
  const { publicKey } = useWallet();
  const [tokens, setTokens] = useState<types.TokenInfo[]>([]);

  const addTokenInfo = async (tokenInfo: types.TokenInfo) => {
    const amount = await walletAPI.getTokenAmount(tokenInfo.address);
    let addressExisted = false;

    tokens.forEach((item) => {
      if (item.address.toString() === tokenInfo.address.toString()) {
        addressExisted = true;
      }
    });

    if (addressExisted) {
      console.log('address existed');
      return;
    }

    tokenInfo = { ...tokenInfo, ...{ amount } };
    setTokens((tokens) => [...tokens, tokenInfo]);

    localStorage.setItem(WALLET_LIST_TOKEN_INFO_KEY, JSON.stringify([...tokens, tokenInfo]));
  };
  useEffect(() => {
    let tokenExisted;
    tokenExisted = localStorage.getItem(WALLET_LIST_TOKEN_INFO_KEY);

    if (!tokenExisted) {
      return;
    }

    tokenExisted = JSON.parse(tokenExisted);
    setTokens(tokenExisted);
  }, []);

  return <Wallet address={publicKey?.toString()} addTokenInfo={addTokenInfo} tokens={tokens} />;
};

export default WalletContainer;
