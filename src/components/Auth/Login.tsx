import React, { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import Button from '@material-ui/core/Button';

import { useAuth } from '../../hooks';
import { WalletDialogProvider } from '@solana/wallet-adapter-material-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButtonSingle } from '../../wallet-adapters/connect/WalletMultiButtonSingle';
import queryString from 'query-string';

const Login: React.FC = () => {
  const history = useHistory();
  const { connected, publicKey, signMessage, adapter } = useWallet();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  const handleLogin = async () => {
    if (connected) {
      setLoading(true);
      try {
        await login(publicKey, signMessage, adapter);
        const { redirectUrl } = queryString.parse(location.search);
        if(redirectUrl) {
          history.push(`${redirectUrl}`)
        } else {
          history.push('/wallet')
        }
      } catch (error) {
        setLoading(false);
      }
    } else {
      console.log('Wallet is not connected');
    }
  };

  if (connected) {
    return (
      <div className="login signin">
        <span className="signin__heading">Your Wallet is connected</span>
        <span className="signin__description">Your current address</span>
        <span className="signin__address">{publicKey?.toString()}</span>
        <Button fullWidth color="primary" style={{ height: '50px' }} variant="contained" onClick={handleLogin}>
          {loading ? 'CONNECTING...' : 'SIGN IN WITH ADDRESS'}
        </Button>
      </div>
    );
  }

  return (
    <div className="login">
      <WalletDialogProvider>
        <span className="login__heading">Connect Your Wallet</span>
        <span className="login__description">Connect your wallet to continue signing in</span>
        <WalletMultiButtonSingle
          color={'primary'}
          style={{
            height: '50px',
            width: '35em',
          }}
        />
      </WalletDialogProvider>
    </div>
  );
};

export default Login;
