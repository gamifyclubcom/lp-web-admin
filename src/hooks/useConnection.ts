import { Connection } from '@solana/web3.js';
import { useContext } from 'react';
import ConnectionContext from './../contexts/connection';

export function useConnection() {
  const context = useContext(ConnectionContext);

  return {
    connection: context.connection as Connection,
    sendConnection: context.sendConnection,
    config: {
      endpoint: context.endpoint,
      env: context.env,
      tokens: context.tokens,
      tokenMap: context.tokenMap,
    },
    slippageConfig: {
      slippage: context.slippage,
      setSlippage: context.setSlippage,
    },
  };
}
