import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import { useTheme } from '@material-ui/core/styles';
import { useEffect, useState } from 'react';
import { useAlert, useConnection, useLocalization } from '../../hooks';
import * as Types from '../../types';
import { getBalance } from '../../utils/solana-api';
import * as poolSdk from '@gamify/onchain-program-sdk';
import { PublicKey } from '@solana/web3.js';
import { materialTableConfig } from '../../config';
import MaterialTable, { Column } from 'material-table';
import { parseTransaction, round, sendSignedTransaction } from '../../shared/helper';
import { useWallet } from '@solana/wallet-adapter-react';
import AlertDialog from './Popup';
import { TextField } from '@material-ui/core';
import { Actions } from '@gamify/onchain-program-sdk';
import Decimal from 'decimal.js';

interface Props {
  pool?: Types.Pool;
  setLoading: (loading: boolean) => void;
}
const PoolWithdrawal: React.FC<Props> = ({ pool, setLoading }) => {
  const { wallet, connected, connect, publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { alertSuccess, alertError } = useAlert();
  const [tokenPerBalance, setTokenPerBalance] = useState(0);
  const [tokenSalesBalance, setTokenSalesBalance] = useState(0);
  const [feeSetting, setFeeSetting] = useState(0);
  const [soldAmount, setSoldAmount] = useState(0);

  const [open, setOpen] = useState(false);

  const handleWithdraw = async () => {
    try {
      setOpen(false);
      setLoading(true);
      if (!connected && wallet) {
        await connect();
      }

      if (!wallet || !publicKey) console.log(publicKey?.toBase58());
      if (publicKey?.toBase58() !== pool?.root_admin) {
        alertError('You are not admin of this pool');
        setLoading(false);
        return;
      }
      const action = new poolSdk.Actions(connection);

      const contractPublicKey = new PublicKey(pool?.contract_address as string);
      // @ts-ignore
      const walletKey = new PublicKey(publicKey?.toBase58());
      const rawTx = await action.withdrawByAdmin(walletKey, walletKey, contractPublicKey);
      const tx = await parseTransaction(rawTx.rawTx);
      const signedTx = await signTransaction!(tx);
      await sendSignedTransaction(connection, signedTx.serialize());
      await fetchBalance();
      alertSuccess('Withdraw success');
    } catch (error: any) {
      alertError(error.message);
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const action = new Actions(connection);
      setTokenPerBalance(await getBalance(connection, action, new PublicKey(pool!.token_x)));
      setTokenSalesBalance(await getBalance(connection, action, new PublicKey(pool!.token_y)));
      setFeeSetting(pool!.fees);
      setSoldAmount(pool!.sold_amount);
    } catch (e) {
      console.log(e);
    }
  };

  const onclickWithdraw = async () => {
    if (!connected && wallet) {
      await connect();
    }

    if (!wallet || !publicKey) console.log(publicKey?.toBase58());
    if (publicKey?.toBase58() !== pool?.root_admin) {
      alertError('You are not admin of this pool');
      setLoading(false);
      return;
    }

    if (Date.now() > new Date(pool?.join_pool_end || 0).getTime()) {
      return handleWithdraw();
    }

    return setOpen(true);
  };

  useEffect(() => {
    if (!pool) {
      return;
    }

    fetchBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, connection]);

  return (
    <Card>
      <AlertDialog
        setOpen={setOpen}
        open={open}
        message={
          'You can withdraw your current SOL amount. Your token amount can not be withdrawn until join pool time ends'
        }
        title={''}
        handleConfirm={() => handleWithdraw()}
        hideConfirm={false}
        cancelButtonText={'Cancel'}
      />
      <CardHeader title="Withdrawal" />
      <CardContent style={{ paddingRight: '8%', paddingLeft: '8%' }}>
        <Grid container item justifyContent="space-between">
          <Grid item style={{ margin: 'auto' }} xs={2}>
            <Grid>Pool admin</Grid>
          </Grid>
          <Grid item xs={10}>
            <TextField
              fullWidth={true}
              value={pool?.root_admin}
              autoComplete="off"
              disabled
              type="text"
              variant="outlined"
            />
          </Grid>
        </Grid>
      </CardContent>
      <CardContent style={{ paddingRight: '8%', paddingLeft: '8%' }}>
        <BalancesTable
          data={[
            { token_name: pool?.token_to || '', amount: tokenPerBalance, fee_percentage: `${feeSetting}%`, fee:  round(new Decimal(soldAmount).mul(feeSetting).div(100).toNumber(), 9)},
            { token_name: pool?.token_symbol || '', amount: tokenSalesBalance, fee_percentage: '0%', fee: 0 },
          ]}
          handleWithdraw={onclickWithdraw}
        />
      </CardContent>
    </Card>
  );
};

type RowData = {
  amount: number;
  token_name: string;
  fee_percentage: string;
  fee: number;
};

const BalancesTable: React.FC<{ data: RowData[]; handleWithdraw: () => void }> = ({ data, handleWithdraw }) => {
  const { materialTable } = useLocalization();
  const theme = useTheme();

  const columns: Column<RowData>[] = [
    {
      title: 'Token name in pool',
      field: 'token_name',
      align: 'center',
    },
    { title: 'Your amount', field: 'amount', align: 'center' },
    { title: 'Fee percentage', field: 'fee_percentage', align: 'center' },
    { title: 'Fee amount', field: 'fee', align: 'center' },
  ];

  return (
    <Grid container direction="column">
      <Grid style={{}} justifyContent="center">
        <Grid item>
          <MaterialTable
            columns={columns}
            data={data}
            options={{ ...materialTableConfig.options, search: false, paging: false, toolbar: false }}
            localization={materialTable}
            icons={materialTableConfig.icons}
          />
        </Grid>
      </Grid>

      <Grid container alignItems="center" justifyContent="center">
        <Grid item style={{ padding: theme.spacing(2) }}>
          <Button variant="contained" color="primary" onClick={handleWithdraw}>
            Withdraw
          </Button>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default PoolWithdrawal;
