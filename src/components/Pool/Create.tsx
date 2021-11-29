import { useState } from 'react';
import { useHistory } from 'react-router-dom';

import Pool from './Pool';

import * as poolAPI from '../../api/pool';
import * as Types from '../../types';
import { useAlert, useConnection } from '../../hooks';
import {
  handdlePoolDataToCreatePoolV3,
  handdlePoolDataToCreatePoolV4,
  handlePoolData,
} from './helper';
import { sleep } from '../../shared/helper';
import { PublicKey } from '@solana/web3.js';
import { Actions } from '@gamify/onchain-program-sdk';
import { useWallet } from '@solana/wallet-adapter-react';

const CreatePool = () => {
  const history = useHistory();
  const { alertSuccess, alertError } = useAlert();
  const [loading, setLoading] = useState<boolean>(false);
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();

  const handleSubmit = async (data: Types.Pool) => {
    try {
      setLoading(true);

      if (!publicKey) {
        alertError('You must connect wallet to create pool');
        setLoading(false);
        return;
      }
      const payerPub = publicKey;
      const platform = (await poolAPI.fetchLatestPlatform()) as any;
      const poolData = handlePoolData(data) as any;
      const initPool = handdlePoolDataToCreatePoolV4(
        data,
        payerPub,
        new PublicKey(platform.publicKey)
      ) as any;

      const action = new Actions(connection);
      const {
        poolTokenXAccount,
        poolTokenYAccount,
        poolAccount,
        transaction,
        unsignedTransaction,
      } = await action.initPoolV4(initPool);

      const signedTxWithWallet = await signTransaction!(unsignedTransaction);
      const sign = signedTxWithWallet.signatures[0];
      transaction.addSignature(sign.publicKey, sign.signature as Buffer);
      await connection.sendRawTransaction(transaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });
      await sleep(2000);
      poolData.pool_account = poolAccount.publicKey.toString();
      poolData.pool_token_x = poolTokenXAccount.publicKey.toBase58();
      poolData.pool_token_y = poolTokenYAccount.publicKey.toBase58();
      poolData.payer = payerPub.toBase58();
      const result = await poolAPI.commitCreatePool(poolData);

      if (!result.success) {
        if (typeof result.message === 'object') {
          result.message.forEach((e: string) => alertError(e));
        }
        return alertError(result.message);
      }
      const { _id } = result;
      if (!_id) return alertError('Create Pool failed. Please try again');
      alertSuccess('Create successfully');
      history.push(`/pools/${_id}`);
    } catch (error: any) {
      console.log(error);
      alertError(error.message);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pool
      submitBtnText="Create"
      submitBtnLoadingText="Creating..."
      loading={loading}
      handleSubmitProp={handleSubmit}
      handleSubmitOnchainProp={() => {}}
      handleSubmitOffchainProp={() => {}}
      handleActivate={() => {}}
    />
  );
};

export default CreatePool;
