import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import { useTheme } from '@material-ui/core/styles';
import { useEffect, useState } from 'react';
import { useAlert, useConnection, useLocalization } from '../../hooks';
import { materialTableConfig } from '../../config';
import MaterialTable, { Column } from 'material-table';
import Decimal from 'decimal.js';
import { Actions, ITiersData } from '@gamify/onchain-program-sdk';
import { PublicKey } from '@solana/web3.js';
import { getBalance } from '../../utils/solana-api';
import { Backdrop, Button, CardActions, CircularProgress, TextField } from '@material-ui/core';
import useStyles from './styles';
import { useWallet } from '@solana/wallet-adapter-react';
import { sendSignedTransaction } from '../../shared/helper';
import NumberFormat from 'react-number-format';

const Tiers: React.FC = () => {
  const [tiers, setTiers] = useState<RowData[]>(defaultValues);
  const [pool, setPool] = useState<ITiersData>(defaultTiers);
  const [balance, setBalance] = useState<number>(0);
  const [userStakingAmount, setUserStakingAmount] = useState<number>(0);
  const { connection } = useConnection();
  const classes = useStyles();
  const theme = useTheme();

  const [loading, setLoading] = useState<boolean>(false);
  const [isAdminInputError, setIsAdminInputError] = useState(false);
  const [adminInputError, setAdminInputError] = useState('');
  const [admin, setAdmin] = useState('');
  const { publicKey, signTransaction } = useWallet();
  const { alertSuccess, alertError } = useAlert();
  const [minDaysStake, setMinDaysStake] = useState(0);
  const [isMinDaysStakeInputError, setIsMinDaysStakeInputError] = useState(false);
  const [minDaysStakeInputError, setMinDaysStakeInputError] = useState('');
  const [penaltyPercentage, setPenaltyPercentage] = useState(0);
  const [isPenaltyPercentageInputError, setIsPenaltyPercentageInputError] = useState(false);
  const [penaltyPercentageInputError, setPenaltyPercentageInputError] = useState('');
  const [isPenaltyRulesEditMode, setIsPenaltyRulesEditMode] = useState(false);
  const [isChangeAdminEditMode, setIsChangeAdminEditMode] = useState(false);

  const readTiers = async () => {
    setLoading(true);
    const action = new Actions(connection);
    setPool(await action.readTiers());
    setLoading(false);
  };
  useEffect(() => {
    readTiers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calculateBalance = async (address: PublicKey, subAmount: number) => {
    const action = new Actions(connection);
    const addressBalance = await getBalance(connection, action, address);
    setBalance(new Decimal(addressBalance).sub(subAmount).toNumber());
  };

  const handleClose = () => {
    setLoading(false);
  };

  const handleChangeAdminEditMode = () => {
    setAdmin(pool.stake_token_owner_address);
    setAdminInputError('');
    setIsAdminInputError(false);
    setIsChangeAdminEditMode(!isChangeAdminEditMode);
  };

  const handlesPenaltyRulesEditMode = () => {
    setMinDaysStake(pool.min_days_stake);
    setPenaltyPercentage(pool.penalty_withdraw);
    setMinDaysStakeInputError('');
    setIsMinDaysStakeInputError(false);
    setIsPenaltyRulesEditMode(!isPenaltyRulesEditMode);
    setPenaltyPercentageInputError('');
    setIsPenaltyPercentageInputError(false);
  };

  useEffect(() => {
    const tranformValue = async () => {
      if (!pool?.is_initialized) {
        return;
      }

      setMinDaysStake(pool.min_days_stake);
      setPenaltyPercentage(pool.penalty_withdraw);

      if (pool.stake_token_owner_address) {
        setAdmin(pool.stake_token_owner_address);
        await calculateBalance(new PublicKey(pool.stake_token_account), pool.user_staking_amount);
      }

      setUserStakingAmount(pool.user_staking_amount);
      setTiers([
        {
          level: 'Level 1',
          totalUser: pool.tier1.number_of_users,
          minAmount: pool.tier1.min_amount,
        },
        {
          level: 'Level 2',
          totalUser: pool.tier2.number_of_users,
          minAmount: pool.tier2.min_amount,
        },
        {
          level: 'Level 3',
          totalUser: pool.tier3.number_of_users,
          minAmount: pool.tier3.min_amount,
        },
        {
          level: 'Level 4',
          totalUser: pool.tier4.number_of_users,
          minAmount: pool.tier4.min_amount,
        },
        {
          level: 'Level 5',
          totalUser: pool.tier5.number_of_users,
          minAmount: pool.tier5.min_amount,
        },
      ]);
    };

    tranformValue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool]);

  const changeStakeAdmin = async () => {
    if (isAdminInputError) {
      return;
    }
    try {
      setLoading(true);

      const action = new Actions(connection);

      if (!publicKey) {
        alertError('You must connect wallet to create pool');
        setLoading(false);
        return;
      }
      const { transaction } = await action.changeStakeAdmin(publicKey, admin);
      const signedTx = await signTransaction!(transaction);
      await sendSignedTransaction(connection, signedTx.serialize());
      alertSuccess('Update successfully');
    } catch (error: any) {
      console.log(error);
      alertError(error.message);
    } finally {
      await readTiers();
      setLoading(false);
    }
  };

  const changePenaltyRules = async () => {
    if (isPenaltyPercentageInputError || isMinDaysStakeInputError) {
      return;
    }

    try {
      setLoading(true);

      const action = new Actions(connection);

      if (!publicKey) {
        alertError('You must connect wallet to create pool');
        setLoading(false);
        return;
      }
      const { transaction } = await action.updatePenaltyRules(publicKey, minDaysStake, penaltyPercentage);
      const signedTx = await signTransaction!(transaction);
      await sendSignedTransaction(connection, signedTx.serialize());
      alertSuccess('Update successfully');
    } catch (error: any) {
      console.log(error);
      alertError(error.message);
    } finally {
      await readTiers();
      setLoading(false);
    }
  };

  const onchangeAdmin = async (event: any) => {
    const value = event.target.value;
    setAdmin(value);
    if (value === '') {
      setAdminInputError('This field is required');
      setIsAdminInputError(true);
    } else {
      try {
        const acc = await connection.getAccountInfo(new PublicKey(value || ''));
        if (acc) {
          setAdminInputError('');
          setIsAdminInputError(false);
        } else {
          setAdminInputError('Invalid account');
          setIsAdminInputError(true);
        }
      } catch (error) {
        console.log(error);
        setAdminInputError('Invalid account');
        setIsAdminInputError(true);
      }
    }
  };

  const onchainMinDaysStake = (event: any) => {
    const value = event.target.value;
    setMinDaysStake(value);

    if (value === '') {
      setMinDaysStakeInputError('This field is required');
      setIsMinDaysStakeInputError(true);
    } else if (value < 0) {
      setMinDaysStakeInputError('Min days stake cannot less than 0');
      setIsMinDaysStakeInputError(true);
    } else if (!Number.isInteger(+value)) {
      setMinDaysStakeInputError('Min days stake must be integer');
      setIsMinDaysStakeInputError(true);
    } else {
      setMinDaysStakeInputError('');
      setIsMinDaysStakeInputError(false);
    }
  };

  const onchangePenaltyPercentage = (event: any) => {
    const value = event.target.value;
    setPenaltyPercentage(value);
    if (value === '') {
      setPenaltyPercentageInputError('This field is required');
      setIsPenaltyPercentageInputError(true);
    } else if (value < 0) {
      setPenaltyPercentageInputError('Penalty percentage cannot less than 0');
      setIsPenaltyPercentageInputError(true);
    } else if (value > 100) {
      setPenaltyPercentageInputError('Penalty percentage cannot greater than 100');
      setIsPenaltyPercentageInputError(true);
    } else if (!Number.isInteger(+value)) {
      setPenaltyPercentageInputError('Penalty percentage must be integer');
      setIsPenaltyPercentageInputError(true);
    } else {
      setPenaltyPercentageInputError('');
      setIsPenaltyPercentageInputError(false);
    }
  };

  const withdraw = async () => {
    try {
      setLoading(true);

      const action = new Actions(connection);

      if (!publicKey) {
        alertError('You must connect wallet to create pool');
        setLoading(false);
        return;
      }
      const { transaction } = await action.withdrawStakeByAdmin(publicKey);
      const signedTx = await signTransaction!(transaction);
      await sendSignedTransaction(connection, signedTx.serialize());
      alertSuccess('Withdraw successfully');
    } catch (error: any) {
      console.log(error);
      alertError(error.message);
    } finally {
      await readTiers();
      setLoading(false);
    }
  };

  return (
    <>
      <Backdrop className={classes.backdrop} open={loading} onClick={handleClose}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <Card style={{ marginBottom: theme.spacing(2) }}>
        <CardHeader title="BALANCE" />
        <CardContent>
          <NumberFormat
            thousandSeparator={true}
            customInput={TextField}
            variant={'outlined'}
            disabled
            required
            label={'Total stake'}
            value={userStakingAmount}
            fullWidth
          />
        </CardContent>
        <CardContent>
          <NumberFormat
            thousandSeparator={true}
            customInput={TextField}
            variant={'outlined'}
            disabled
            required
            label={'Total penalty can be withdrawn'}
            value={balance}
            fullWidth
          />
          <CardActions
            classes={{
              root: classes.cardActions,
            }}
          >
            <Button
              size="large"
              variant="contained"
              color="primary"
              disabled={loading}
              onClick={() => {
                withdraw();
              }}
            >
              {loading ? 'LOADING' : 'WITHDRAW'}
            </Button>
          </CardActions>
        </CardContent>
      </Card>
      <Card style={{ marginBottom: theme.spacing(2) }}>
        <CardHeader title="PENALTY RULES" />

        <CardContent>
          <TextField
            required
            label={'Min days stake'}
            error={Boolean(isMinDaysStakeInputError)}
            fullWidth
            inputProps={{ readOnly: !isPenaltyRulesEditMode }}
            type="number"
            helperText={minDaysStakeInputError}
            onChange={onchainMinDaysStake}
            value={minDaysStake}
            variant={'outlined'}
          />
          <CardActions
            classes={{
              root: classes.cardActions,
            }}
          ></CardActions>
        </CardContent>
        <CardContent>
          <TextField
            required
            label={'Penalty percentage'}
            type="number"
            error={Boolean(isPenaltyPercentageInputError)}
            fullWidth
            inputProps={{ readOnly: !isPenaltyRulesEditMode }}
            helperText={penaltyPercentageInputError}
            onChange={onchangePenaltyPercentage}
            value={penaltyPercentage}
            variant={'outlined'}
          />
          <CardActions
            classes={{
              root: classes.cardActions,
            }}
          >
            {isPenaltyRulesEditMode && (
              <Button
                size="large"
                variant="contained"
                color="primary"
                disabled={loading}
                onClick={() => {
                  changePenaltyRules();
                }}
              >
                {loading ? 'LOADING' : 'CHANGE'}
              </Button>
            )}
            {!isPenaltyRulesEditMode && (
              <Button
                style={{ margin: theme.spacing(2) }}
                size="large"
                variant="contained"
                color="primary"
                disabled={loading}
                onClick={handlesPenaltyRulesEditMode}
              >
                {loading ? 'LOADING' : 'EDIT'}
              </Button>
            )}
            {isPenaltyRulesEditMode && (
              <Button
                size="large"
                style={{ margin: theme.spacing(2) }}
                variant="contained"
                color="primary"
                disabled={loading}
                onClick={handlesPenaltyRulesEditMode}
              >
                {loading ? 'LOADING' : 'CANCEL'}
              </Button>
            )}
          </CardActions>
        </CardContent>
      </Card>
      <Card style={{ marginBottom: theme.spacing(2) }}>
        <CardHeader title="STAKE ADMIN" />
        <CardContent>
          <TextField
            required
            label={'Admin'}
            error={Boolean(isAdminInputError)}
            fullWidth
            inputProps={{ readOnly: !isChangeAdminEditMode }}
            helperText={adminInputError}
            onChange={onchangeAdmin}
            value={admin}
            variant={'outlined'}
          />
          <CardActions
            classes={{
              root: classes.cardActions,
            }}
          >
            {isChangeAdminEditMode && (
              <Button
                size="large"
                variant="contained"
                color="primary"
                disabled={loading}
                onClick={() => {
                  changeStakeAdmin();
                }}
              >
                {loading ? 'LOADING' : 'CHANGE'}
              </Button>
            )}
            {!isChangeAdminEditMode && (
              <Button
                style={{ margin: theme.spacing(2) }}
                size="large"
                variant="contained"
                color="primary"
                disabled={loading}
                onClick={handleChangeAdminEditMode}
              >
                {loading ? 'LOADING' : 'EDIT'}
              </Button>
            )}
            {isChangeAdminEditMode && (
              <Button
                style={{ margin: theme.spacing(2) }}
                size="large"
                variant="contained"
                color="primary"
                disabled={loading}
                onClick={handleChangeAdminEditMode}
              >
                {loading ? 'LOADING' : 'CANCEL'}
              </Button>
            )}
          </CardActions>
        </CardContent>
      </Card>
      <Card style={{ marginBottom: theme.spacing(2) }}>
        <CardHeader title="TIERS" />
        <CardContent style={{ paddingRight: '5%', paddingLeft: '5%' }}>
          <TiersTable data={tiers} />
        </CardContent>
      </Card>
    </>
  );
};

type RowData = {
  level: string;
  totalUser: number;
  minAmount: number;
};

const TiersTable: React.FC<{ data: RowData[] }> = ({ data }) => {
  const { materialTable } = useLocalization();

  const columns: Column<RowData>[] = [
    { title: 'Level', field: 'level', align: 'center' },
    { title: 'Total users', field: 'totalUser', align: 'center' },
    { title: 'Min amount (ISOLA)', field: 'minAmount', align: 'center' },
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
    </Grid>
  );
};

export default Tiers;

const defaultTiers: ITiersData = {
  is_initialized: true,
  nonce: 1,
  stake_token_account: '',
  stake_token_owner_address: '',
  tier1: {
    min_amount: 0,
    number_of_users: 0,
    total_staking_amount: 0,
  },
  tier2: {
    min_amount: 0,
    number_of_users: 0,
    total_staking_amount: 0,
  },
  tier3: {
    min_amount: 0,
    number_of_users: 0,
    total_staking_amount: 0,
  },
  tier4: {
    min_amount: 0,
    number_of_users: 0,
    total_staking_amount: 0,
  },
  tier5: {
    min_amount: 0,
    number_of_users: 0,
    total_staking_amount: 0,
  },
  platform: '',
  user_staking_amount: 0,
  withdrawed_amount: 0,
  min_days_stake: 0,
  penalty_withdraw: 0,
};

const defaultValues = [
  {
    level: 'Level 1',
    totalUser: 0,
    minAmount: 0,
  },
  {
    level: 'Level 2',
    totalUser: 0,
    minAmount: 0,
  },
  {
    level: 'Level 3',
    totalUser: 0,
    minAmount: 0,
  },
  {
    level: 'Level 4',
    totalUser: 0,
    minAmount: 0,
  },
  {
    level: 'Level 5',
    totalUser: 0,
    minAmount: 0,
  },
];
