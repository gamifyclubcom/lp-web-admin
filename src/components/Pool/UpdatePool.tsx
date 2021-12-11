import MomentUtils from '@date-io/moment';
import { yupResolver } from '@hookform/resolvers/yup';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import MenuItem from '@material-ui/core/MenuItem';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import CardHeader from '@material-ui/core/CardHeader';
import Typography from '@material-ui/core/Typography';
import { useTheme } from '@material-ui/core/styles';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import { useEffect, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { SubmitHandler, useForm } from 'react-hook-form';
import { BsFiles } from 'react-icons/bs';
import { useHistory, useParams } from 'react-router-dom';
import { useAlert, useConnection, useDebounce } from '../../hooks';
import * as Types from '../../types';
import * as api from '../../api/pool';
import {
  poolChangeAdminValidator,
  poolOffchainValidator,
  poolOnchainValidator,
} from '../../utils/validators';
import CheckBoxInput from '../common/form/CheckBoxInput';
import CheckBoxInputV2 from '../common/form/CheckBoxInputV2';
import DateInput from '../common/form/DateInput';
import DateInputV2 from '../common/form/DateInputV2';
import Input from '../common/form/Input';
import InputV2 from '../common/form/InputV2';
import useStyles from './styles';
import { DEFAULT_POOL_LOGO_URL } from '../../utils/constants';
import {
  getConnection,
  isEmpty,
  parseTransaction,
  sendSignedTransaction,
  sleep,
} from '../../shared/helper';
import {
  handdlePoolDataToUpdatePoolV2,
  handdlePoolDataToUpdatePoolV3,
  handdlePoolDataToUpdatePoolV4,
  handleOffchainPoolData,
  handleOnchainPoolData,
} from './helper';
import { PoolInputLabel } from './constants';
import { Actions } from '@gamify/onchain-program-sdk';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { getTokenInfo } from '../../utils/solana-api';
import { Backdrop } from '@material-ui/core';
import CircularProgress from '@material-ui/core/CircularProgress';
import NumberInput from '../common/form/NumberFormatInput';
import NumberInputV2 from '../common/form/NumberFormatInputV2';

type FormOnchainValues = Types.FormOnchainValues & {
  pool_start: string;
  token_total_supply: string;
  current_voting_start: string;
  current_voting_end: string;
  is_checked_fee_information: boolean;
};
type FormOffchainValues = Types.FormOffchainValues & {
  join_pool_start: string;
  is_active: boolean;
};
type FormChangeRootAdmin = { root_admin: string };

interface URLParams {
  id: string;
}

const supportedTokens = [{ key: 'SOL', label: 'SOL', value: 'SOL' }];

const defaultOffchainValues: FormOffchainValues = {
  logo: '',
  thumbnail: '',
  name: '',
  website: '',
  twitter: '',
  telegram: '',
  token_economic: '',
  description: '',
  medium: '',
  tag_line: '',
  pool_start: new Date().toISOString(),
  join_pool_start: new Date().toISOString(),
  contract_address: '',
  token_address: '',
  token_name: '',
  token_symbol: '',
  token_decimals: 0,
  token_total_supply: '0',
  token_liquidity_lock: 0,
  token_to: 'SOL',
  _id: '',
  program_id: '',
  audit_link: '',
  is_active: false,
  liquidity_percentage: 0,
  claimable_percentage: 100,
};

const defaultOnchainValues: FormOnchainValues = {
  join_pool_start: new Date().toISOString(),
  join_pool_end: new Date().toISOString(),
  pool_start: new Date().toISOString(),
  is_initialized: true,
  id: '',
  _id: '',
  token_x: '',
  token_y: '',
  token_ratio: 0,
  early_join_duration: 20,
  max_allocation_all_phases: 0,
  claim_at: new Date().toISOString(),
  early_phase_is_active: true,
  platform: '',
  root_admin: '',
  early_phase_max_total_alloc: 0,
  public_phase_max_individual_alloc: 0,
  is_active: false,
  token_total_supply: '0',
  fcfs_stake_phase_multiplication_rate: 0,
  fcfs_stake_duration: 30,
  exclusive_phase_is_active: true,
  exclusive_phase_max_total_alloc: 0,
  exclusive_join_duration: 20,
  fcfs_stake_phase_is_active: true,
  fees: 0,
  sold_amount: 0,
  voting_phase_is_active: true,
  voting_start: new Date().toISOString(),
  voting_end: new Date().toISOString(),
  max_voting_days: 0,
  is_enough_vote: false,
  current_voting_start: new Date().toISOString(),
  current_voting_end: new Date().toISOString(),
  is_checked_fee_information: true,
};

const UpdatePool: React.FC = () => {
  const classes = useStyles();
  const { alertSuccess, alertError } = useAlert();
  const [loading, setLoading] = useState<boolean>(false);
  const [pool, setPool] = useState<Types.Pool | undefined>(undefined);
  const [error, setError] = useState<Types.ServerError | null>(null);
  const { wallet, connected, connect, publicKey, signTransaction } =
    useWallet();
  const { connection } = useConnection();
  const contractAction = new Actions(connection);
  const { id }: URLParams = useParams();
  const theme = useTheme();
  const history = useHistory();

  const handleOffchainUpdate = async (data: FormOffchainValues) => {
    try {
      setLoading(true);
      const poolData = handleOffchainPoolData(data) as any;

      (await api.updateOffchainPool(poolData)) as any;
      await fetchPool();
      alertSuccess('Update success');
    } catch (error: any) {
      alertError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOnchainUpdate = async (data: FormOnchainValues) => {
    try {
      setLoading(true);
      if (!connected && wallet) {
        await connect();
        await sleep(3000);
      }
      if (!publicKey) {
        alertError('Please connect your wallet!');
        return;
      }
      if (publicKey?.toBase58() !== pool?.root_admin) {
        alertError('You are not admin of this pool');
        setLoading(false);
        return;
      }
      setLoading(true);
      const action = new Actions(connection);
      const poolVersion = await action.getVersionOfPool(
        new PublicKey(pool.contract_address)
      );
      switch (poolVersion) {
        case 2: {
          const params = handdlePoolDataToUpdatePoolV2(data, publicKey);
          const { unsignedTransaction } = await action.updateOnchainDataV2(
            params,
            new PublicKey(pool.contract_address)
          );
          if (unsignedTransaction) {
            const signedTx = await signTransaction!(unsignedTransaction);
            await sendSignedTransaction(connection, signedTx.serialize());
          }
          break;
        }
        case 3: {
          const params = handdlePoolDataToUpdatePoolV3(data, publicKey);
          const { unsignedTransaction } = await action.updateOnchainDataV3(
            params,
            new PublicKey(pool.contract_address)
          );
          if (unsignedTransaction) {
            const signedTx = await signTransaction!(unsignedTransaction);
            await sendSignedTransaction(connection, signedTx.serialize());
          }
          break;
        }
        case 4: {
          const params = handdlePoolDataToUpdatePoolV4(data, publicKey);
          const { unsignedTransaction } = await action.updateOnchainDataV4(
            params,
            new PublicKey(pool.contract_address)
          );
          if (unsignedTransaction) {
            const signedTx = await signTransaction!(unsignedTransaction);
            await sendSignedTransaction(connection, signedTx.serialize());
          }
          break;
        }
        default: {
          const poolData = handleOnchainPoolData(data) as any;

          const res = (await api.updateOnchainPool(poolData)) as any;
          if (res.rawTransaction) {
            const tx = await parseTransaction(res.rawTransaction);
            const signedTx = await signTransaction!(tx);
            await sendSignedTransaction(connection, signedTx.serialize());
          }
        }
      }

      setLoading(false);
      alertSuccess('Update success');
      await syncAndFetchPool();
    } catch (error: any) {
      console.log(error);
      setLoading(false);
      alertError(error.message);
    }
  };

  const syncAndFetchPool = async () => {
    const newPool = await api.syncPool(pool?.id || '');
    setPool(newPool);

    return newPool;
  };

  const changePoolAdmin = async (newPoolAdmin: string, poolId: string) => {
    setLoading(true);
    if (!connected) {
      if (wallet) {
        await connect();
        await sleep(3000);
      } else {
        return alertError('Please connect to wallet!');
      }
    }

    if (publicKey?.toBase58() !== pool?.root_admin) {
      alertError('You are not admin of this pool');
      setLoading(false);
      return;
    }

    if (newPoolAdmin === pool?.root_admin) {
      alertSuccess('Change Success');
      setLoading(false);
      return;
    }

    let prepareData;
    if (wallet && publicKey) {
      prepareData = await contractAction.changePoolAdmin(
        new PublicKey(pool?.contract_address as string),
        newPoolAdmin
      );
    }

    try {
      const tx = await parseTransaction(prepareData as Buffer);
      const signedTx = await signTransaction!(tx);
      await sendSignedTransaction(connection, signedTx.serialize());
      await getResultChangeAdmin(newPoolAdmin, poolId);
    } catch (err: any) {
      alertError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getResultChangeAdmin = async (newPoolAdmin: string, poolId: string) => {
    const pool = await syncAndFetchPool();
    pool.root_admin === newPoolAdmin
      ? alertSuccess('Change Success')
      : alertError('Something went wrong, please try again later');
  };

  const {
    control: onchainController,
    setValue: setOnchainValue,
    handleSubmit: handleOnchainSubmit,
    trigger: onchainTrigger,
    getValues: getValuesOnchain,
    formState: { errors: onchainError },
  } = useForm<FormOnchainValues>({
    shouldFocusError: true,
    defaultValues: defaultOnchainValues,
    reValidateMode: 'onChange',
    resolver: yupResolver(poolOnchainValidator),
  });

  const {
    control: rootAdminController,
    setValue: setRootAdminValue,
    handleSubmit: handleChangeAdminSubmit,
    formState: { errors: rootAdminError },
  } = useForm<FormChangeRootAdmin>({
    shouldFocusError: true,
    defaultValues: { root_admin: '' },
    reValidateMode: 'onChange',
    resolver: yupResolver(poolChangeAdminValidator),
  });

  const {
    control: offchainController,
    setValue: setOffchainValue,
    watch: offchainWatch,
    getValues: getValuesOffchain,
    trigger: offchainTrigger,
    handleSubmit: handleOffchainSubmit,
    formState: { errors: offchainError },
  } = useForm<FormOffchainValues>({
    shouldFocusError: true,
    defaultValues: defaultOffchainValues,
    reValidateMode: 'onChange',
    resolver: yupResolver(poolOffchainValidator),
  });

  const fetchPool = async () => {
    try {
      if (!id) return;

      setLoading(true);
      const data = await api.fetchPool(id);
      setLoading(false);
      if (!data) {
        setError({ code: 404, message: 'Not found' });
        return;
      }

      setPool(data);
    } catch (error: any) {
      setLoading(false);
      alertError(error?.toString());
    }
  };

  useEffect(() => {
    fetchPool();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  console.log(' onchainError: ', onchainError);
  console.log(' offchainError: ', offchainError);

  const [copied, setCopied] = useState(false);
  const onOffchainSubmit: SubmitHandler<FormOffchainValues> = (data) => {
    return handleOffchainUpdate(data);
  };
  const onOnchainSubmit: SubmitHandler<FormOnchainValues> = (data) => {
    return handleOnchainUpdate(data);
  };

  const onChangeAdminSubmit: SubmitHandler<FormChangeRootAdmin> = (data) => {
    return changePoolAdmin(data.root_admin, pool?.id as string);
  };

  const poolLogoUrl = useDebounce(offchainWatch('logo') as string, 300);

  const toggleEditMode = true;

  const [
    isRequreidEarlyPhaseMaxTotalAlloc,
    setIsRequreidEarlyPhaseMaxTotalAlloc,
  ] = useState(true);
  const [
    isRequreidExclusivePhaseMaxTotalAlloc,
    setIsRequreidExclusivePhaseMaxTotalAlloc,
  ] = useState(true);
  const [
    isRequreidFcfsStakePhaseMaxTotalAlloc,
    setIsRequreidFcfsStakePhaseMaxTotalAlloc,
  ] = useState(true);
  const [feeSetting, setFeeSetting] = useState(0);

  const showTransferAdmin = () => {
    return (
      <div>
        <Card style={{ marginBottom: theme.spacing(2) }}>
          <CardHeader title="POOL ADMIN" />
          <CardContent>
            <InputV2
              required
              control={rootAdminController}
              label={PoolInputLabel.root_admin}
              name="root_admin"
              isError={Boolean(rootAdminError.root_admin)}
              errorMessage={rootAdminError?.root_admin?.message}
              tooltipHelp={PoolInputLabel.root_admin_tooltip}
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
                onClick={handleChangeAdminSubmit(onChangeAdminSubmit)}
              >
                {loading ? 'CHANGING' : 'CHANGE'}
              </Button>
            </CardActions>
          </CardContent>
        </Card>
      </div>
    );
  };

  const [poolIsActive, setPoolIsActive] = useState(false);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!pool) return;
    try {
      const {
        _id,
        logo,
        thumbnail,
        contract_address,
        name,
        website,
        token_economic,
        twitter,
        telegram,
        pool_start,
        join_pool_start,
        join_pool_end,
        medium,
        description,
        is_active,
        tag_line,
        token_address,
        token_decimals,
        token_name,
        token_symbol,
        token_total_supply,
        token_liquidity_lock,
        early_join_duration,
        token_x,
        token_y,
        token_to,
        token_ratio,
        early_phase_is_active,
        platform,
        root_admin,
        max_allocation_all_phases,
        claim_at,
        program_id,
        early_phase_max_total_alloc,
        public_phase_max_individual_alloc,
        audit_link,
        liquidity_percentage,
        claimable_percentage,
        fcfs_stake_phase_multiplication_rate,
        fcfs_stake_duration,
        exclusive_phase_is_active,
        exclusive_join_duration,
        exclusive_phase_max_total_alloc,
        fcfs_stake_phase_is_active,
        fees,
        voting_phase_is_active,
        voting_start,
        voting_end,
        max_voting_days,
      } = pool;

      setPoolIsActive(is_active);
      setIsRequreidEarlyPhaseMaxTotalAlloc(early_phase_is_active);
      setIsRequreidExclusivePhaseMaxTotalAlloc(exclusive_phase_is_active);
      setIsRequreidFcfsStakePhaseMaxTotalAlloc(fcfs_stake_phase_is_active);
      setFeeSetting(fees);

      setOffchainValue('_id', _id);
      setOffchainValue('logo', logo);
      setOffchainValue('thumbnail', thumbnail);
      setOffchainValue('contract_address', contract_address);
      setOffchainValue('name', name);
      setOffchainValue('website', website);
      setOffchainValue('token_economic', token_economic);
      setOffchainValue('twitter', twitter);
      setOffchainValue('telegram', telegram);
      setOffchainValue('medium', medium);
      setOffchainValue('pool_start', pool_start);
      setOffchainValue('audit_link', audit_link);
      setOffchainValue('liquidity_percentage', liquidity_percentage);
      setOffchainValue('description', description);
      setOffchainValue('token_address', token_address);
      setOffchainValue('token_name', token_name);
      setOffchainValue('token_symbol', token_symbol);
      setOffchainValue('token_decimals', token_decimals);
      setOffchainValue('token_liquidity_lock', token_liquidity_lock);
      setOffchainValue('token_total_supply', token_total_supply);
      setOffchainValue('program_id', program_id);
      setOffchainValue('token_to', token_to);
      setOffchainValue('tag_line', tag_line);
      setOffchainValue('join_pool_start', join_pool_start);
      setOffchainValue('is_active', is_active);
      setOffchainValue('claimable_percentage', claimable_percentage);

      setRootAdminValue('root_admin', root_admin);

      setOnchainValue('_id', _id);
      setOnchainValue('pool_start', pool_start);
      setOnchainValue('token_ratio', token_ratio);
      setOnchainValue('is_active', is_active);
      setOnchainValue('join_pool_start', join_pool_start);
      setOnchainValue('join_pool_end', join_pool_end);
      setOnchainValue('early_join_duration', early_join_duration);
      setOnchainValue('max_allocation_all_phases', max_allocation_all_phases);
      setOnchainValue('platform', platform);
      setOnchainValue('token_x', token_x);
      setOnchainValue('token_y', token_y);
      setOnchainValue('claim_at', claim_at);
      setOnchainValue('early_phase_is_active', early_phase_is_active);
      setOnchainValue(
        'early_phase_max_total_alloc',
        early_phase_max_total_alloc
      );
      setOnchainValue(
        'public_phase_max_individual_alloc',
        public_phase_max_individual_alloc
      );
      setOnchainValue('token_total_supply', token_total_supply);
      setOnchainValue(
        'fcfs_stake_phase_multiplication_rate',
        fcfs_stake_phase_multiplication_rate
      );
      setOnchainValue('fcfs_stake_duration', fcfs_stake_duration);
      setOnchainValue('exclusive_phase_is_active', exclusive_phase_is_active);
      setOnchainValue('exclusive_join_duration', exclusive_join_duration);
      setOnchainValue(
        'exclusive_phase_max_total_alloc',
        exclusive_phase_max_total_alloc
      );
      setOnchainValue('fcfs_stake_phase_is_active', fcfs_stake_phase_is_active);
      setOnchainValue('voting_phase_is_active', voting_phase_is_active);
      setOnchainValue('voting_start', voting_start);
      setOnchainValue('voting_end', voting_end);
      setOnchainValue('max_voting_days', max_voting_days);
      setOnchainValue('current_voting_start', voting_start);
      setOnchainValue('current_voting_end', voting_end);

      const loatTokenInfo = async () => {
        const token = await getTokenInfo(getConnection(), token_address);
        if (token) {
          setOffchainValue('token_decimals', token.decimals || 0);
          setOffchainValue('token_total_supply', token.supply || '0');
          setOnchainValue('token_total_supply', token.supply || '0');
        }
      };
      loatTokenInfo();
    } catch (error: any) {
      console.log('error when loading', error.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (copied) {
      alertSuccess('Copied');
      setTimeout(() => {
        setCopied(false);
      }, 3000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copied]);

  const toggleEdit = async () => {
    history.push(`/pools/${pool?.id}`);
  };

  return (
    <MuiPickersUtilsProvider utils={MomentUtils}>
      <>
        <Backdrop
          className={classes.backdrop}
          open={loading}
          onClick={() => setLoading(false)}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
        <Card style={{ marginBottom: theme.spacing(2) }}>
          <CardHeader
            classes={{ action: classes.cardHeader }}
            action={
              <>
                <Button
                  variant="contained"
                  size="large"
                  color="secondary"
                  disabled={loading}
                  style={{ marginLeft: theme.spacing(2) }}
                  onClick={() => toggleEdit()}
                >
                  Back
                </Button>
                <Avatar
                  src={
                    isEmpty(poolLogoUrl) ? DEFAULT_POOL_LOGO_URL : poolLogoUrl
                  }
                  className={classes.avatar}
                >
                  L
                </Avatar>
              </>
            }
            title="OFFCHAIN POOL INFORMATION"
          />
          <CardContent>
            <form className="pool-form">
              <Grid item className={classes.formItem}>
                <InputV2
                  control={offchainController}
                  label={PoolInputLabel.logo}
                  name="logo"
                  inputProps={{}}
                  isError={Boolean(offchainError?.logo)}
                  errorMessage={offchainError?.logo?.message}
                  tooltipHelp={PoolInputLabel.logo_tooltip}
                />
              </Grid>
              <Grid item className={classes.formItem}>
                <InputV2
                  control={offchainController}
                  label={PoolInputLabel.thumbnail}
                  name="thumbnail"
                  inputProps={{}}
                  isError={Boolean(offchainError?.thumbnail)}
                  errorMessage={offchainError?.thumbnail?.message}
                  tooltipHelp={PoolInputLabel.thumbnail_tooltip}
                />
              </Grid>
              {toggleEditMode && (
                <>
                  <Grid item container className={classes.formItem}>
                    <Grid
                      item
                      style={{ flex: 1, marginRight: theme.spacing(1) }}
                    >
                      <InputV2
                        control={offchainController}
                        label={PoolInputLabel.contract_address}
                        name="contract_address"
                        isError={Boolean(offchainError?.contract_address)}
                        errorMessage={offchainError?.contract_address?.message}
                        InputProps={{
                          readOnly: true,
                          endAdornment: (
                            <CopyToClipboard
                              text={pool?.contract_address || ''}
                              onCopy={() => setCopied(true)}
                            >
                              <InputAdornment position="start">
                                <IconButton onClick={() => setCopied(true)}>
                                  {copied ? (
                                    <BsFiles color="primary" />
                                  ) : (
                                    <BsFiles />
                                  )}
                                </IconButton>
                              </InputAdornment>
                            </CopyToClipboard>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid
                      item
                      style={{ flex: 1, marginLeft: theme.spacing(1) }}
                    >
                      <InputV2
                        control={onchainController}
                        label={PoolInputLabel.token_y}
                        name="token_y"
                        isError={Boolean(onchainError?.token_y)}
                        errorMessage={onchainError?.token_y?.message}
                        inputProps={{ readOnly: true }}
                        InputProps={{
                          readOnly: true,
                          endAdornment: (
                            <CopyToClipboard
                              text={pool?.token_y || ''}
                              onCopy={() => setCopied(true)}
                            >
                              <InputAdornment position="start">
                                <IconButton onClick={() => setCopied(true)}>
                                  {copied ? (
                                    <BsFiles color="primary" />
                                  ) : (
                                    <BsFiles />
                                  )}
                                </IconButton>
                              </InputAdornment>
                            </CopyToClipboard>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>
                </>
              )}

              <Grid item container className={classes.formItem}>
                <Grid item style={{ flex: 1, marginRight: theme.spacing(1) }}>
                  <InputV2
                    required
                    control={offchainController}
                    inputProps={{
                      readOnly:
                        new Date(getValuesOffchain('pool_start')).getTime() <
                        Date.now(),
                    }}
                    label={PoolInputLabel.name}
                    name="name"
                    isError={Boolean(offchainError?.name)}
                    errorMessage={offchainError?.name?.message}
                    tooltipHelp={PoolInputLabel.name_tooltip}
                  />{' '}
                </Grid>
                <Grid item style={{ flex: 1, marginLeft: theme.spacing(1) }}>
                  <InputV2
                    control={offchainController}
                    label={PoolInputLabel.tag_line}
                    inputProps={{}}
                    name="tag_line"
                    isError={Boolean(offchainError?.tag_line)}
                    errorMessage={offchainError?.tag_line?.message}
                    tooltipHelp={PoolInputLabel.tag_line_tooltip}
                  />
                </Grid>
              </Grid>

              <Grid item container className={classes.formItem}>
                <Grid item style={{ flex: 1, marginRight: theme.spacing(1) }}>
                  <InputV2
                    required
                    control={offchainController}
                    label={PoolInputLabel.website}
                    inputProps={{
                      readOnly:
                        new Date(getValuesOffchain('pool_start')).getTime() <
                        Date.now(),
                    }}
                    name="website"
                    isError={Boolean(offchainError?.website)}
                    errorMessage={offchainError?.website?.message}
                    tooltipHelp={PoolInputLabel.website_tooltip}
                  />
                </Grid>
                <Grid item style={{ flex: 1, marginLeft: theme.spacing(1) }}>
                  <InputV2
                    control={offchainController}
                    label={PoolInputLabel.token_economic}
                    inputProps={{}}
                    name="token_economic"
                    isError={Boolean(offchainError?.token_economic)}
                    errorMessage={offchainError?.token_economic?.message}
                    tooltipHelp={PoolInputLabel.token_economic_tooltip}
                  />
                </Grid>
              </Grid>

              <Grid item container className={classes.formItem}>
                <Grid item style={{ flex: 1, marginRight: theme.spacing(1) }}>
                  <InputV2
                    control={offchainController}
                    label={PoolInputLabel.twitter}
                    inputProps={{}}
                    name="twitter"
                    isError={Boolean(offchainError?.twitter)}
                    errorMessage={offchainError?.twitter?.message}
                    tooltipHelp={PoolInputLabel.twitter_tooltip}
                  />
                </Grid>
                <Grid
                  item
                  style={{
                    flex: 1,
                    marginLeft: theme.spacing(1),
                    marginRight: theme.spacing(1),
                  }}
                >
                  <InputV2
                    control={offchainController}
                    label={PoolInputLabel.medium}
                    inputProps={{}}
                    name="medium"
                    isError={Boolean(offchainError?.medium)}
                    errorMessage={offchainError?.medium?.message}
                    tooltipHelp={PoolInputLabel.medium_tooltip}
                  />
                </Grid>
                <Grid item style={{ flex: 1, marginLeft: theme.spacing(1) }}>
                  <InputV2
                    control={offchainController}
                    inputProps={{}}
                    label={PoolInputLabel.telegram}
                    name="telegram"
                    isError={Boolean(offchainError?.telegram)}
                    errorMessage={offchainError?.telegram?.message}
                    tooltipHelp={PoolInputLabel.telegram_tooltip}
                  />
                </Grid>
              </Grid>

              <Grid item container className={classes.formItem}>
                <Grid
                  item
                  style={{ flex: 1 /* , marginRight: theme.spacing(1) */ }}
                >
                  <DateInputV2
                    control={offchainController}
                    required
                    name="pool_start"
                    label={PoolInputLabel.pool_start}
                    isError={Boolean(offchainError?.pool_start)}
                    errorMessage={offchainError?.pool_start?.message}
                    tooltipHelp={PoolInputLabel.pool_start_tooltip}
                  />
                </Grid>
                {/* <Grid
                  item
                  style={{
                    flex: 1,
                    marginLeft: theme.spacing(1),
                    marginRight: theme.spacing(1),
                  }}
                >
                  <Input
                    control={offchainController}
                    inputProps={{}}
                    label={PoolInputLabel.audit_link}
                    name="audit_link"
                    isError={Boolean(offchainError?.audit_link)}
                    errorMessage={offchainError?.audit_link?.message}
                  />
                </Grid>
                <Grid item style={{ flex: 1, marginLeft: theme.spacing(1) }}>
                  <NumberInput
                    onChange={() => offchainTrigger('liquidity_percentage')}
                    onValueChange={(values: any) => {
                      setOffchainValue(
                        'liquidity_percentage',
                        values.floatValue
                      );
                    }}
                    control={offchainController}
                    inputProps={{}}
                    label={PoolInputLabel.liquidity_percentage}
                    name="liquidity_percentage"
                    isError={Boolean(offchainError?.liquidity_percentage)}
                    errorMessage={offchainError?.liquidity_percentage?.message}
                  />
                </Grid> */}
              </Grid>

              <Grid item container className={classes.formItem}>
                <NumberInputV2
                  onChange={() => offchainTrigger('claimable_percentage')}
                  required
                  control={offchainController}
                  label={PoolInputLabel.claimable_percentage}
                  name="claimable_percentage"
                  isError={Boolean(offchainError?.claimable_percentage)}
                  errorMessage={offchainError?.claimable_percentage?.message}
                  onValueChange={(values: any) => {
                    setOffchainValue('claimable_percentage', values.floatValue);
                  }}
                  tooltipHelp={PoolInputLabel.claimable_percentage_tooltip}
                />
              </Grid>

              <Grid item className={classes.formItem}>
                <InputV2
                  control={offchainController}
                  label={PoolInputLabel.description}
                  name="description"
                  isError={Boolean(offchainError?.description)}
                  errorMessage={offchainError?.description?.message}
                  multiline
                  rows={4}
                  tooltipHelp={PoolInputLabel.description_tooltip}
                />
              </Grid>

              <Typography gutterBottom variant="h5">
                Token
              </Typography>

              <Grid item className={classes.formItem}>
                <InputV2
                  required
                  control={offchainController}
                  label={PoolInputLabel.token_address}
                  name="token_address"
                  isError={Boolean(offchainError?.token_address)}
                  errorMessage={offchainError?.token_address?.message}
                  inputProps={{ readOnly: true }}
                  InputProps={{
                    endAdornment: (
                      <CopyToClipboard
                        text={pool?.token_address || ''}
                        onCopy={() => setCopied(true)}
                      >
                        <InputAdornment position="start">
                          <IconButton onClick={() => setCopied(true)}>
                            {copied ? <BsFiles color="primary" /> : <BsFiles />}
                          </IconButton>
                        </InputAdornment>
                      </CopyToClipboard>
                    ),
                  }}
                  tooltipHelp={PoolInputLabel.token_address_tooltip}
                />
              </Grid>

              <Grid item container className={classes.formItem}>
                <Grid item style={{ flex: 1, marginRight: theme.spacing(1) }}>
                  <InputV2
                    required
                    control={offchainController}
                    label={PoolInputLabel.token_name}
                    name="token_name"
                    isError={Boolean(offchainError?.token_name)}
                    errorMessage={offchainError?.token_name?.message}
                    inputProps={{
                      readOnly:
                        new Date(getValuesOffchain('pool_start')).getTime() <
                        Date.now(),
                    }}
                    tooltipHelp={PoolInputLabel.token_name_tooltip}
                  />
                </Grid>
                <Grid
                  item
                  style={{
                    flex: 1,
                    marginLeft: theme.spacing(1),
                    marginRight: theme.spacing(1),
                  }}
                >
                  <InputV2
                    required
                    control={offchainController}
                    label={PoolInputLabel.token_symbol}
                    name="token_symbol"
                    isError={Boolean(offchainError?.token_symbol)}
                    errorMessage={offchainError?.token_symbol?.message}
                    inputProps={{
                      readOnly:
                        new Date(getValuesOffchain('pool_start')).getTime() <
                        Date.now(),
                    }}
                    tooltipHelp={PoolInputLabel.token_symbol_tooltip}
                  />
                </Grid>
                <Grid item style={{ flex: 1, marginLeft: theme.spacing(1) }}>
                  <NumberInputV2
                    onChange={() => offchainTrigger('token_decimals')}
                    onValueChange={(values: any) => {
                      setOffchainValue('token_decimals', values.floatValue);
                    }}
                    required
                    control={offchainController}
                    label={PoolInputLabel.token_decimals}
                    name="token_decimals"
                    isError={Boolean(offchainError?.token_decimals)}
                    errorMessage={offchainError?.token_decimals?.message}
                    inputProps={{ readOnly: true }}
                    tooltipHelp={PoolInputLabel.token_decimals_tooltip}
                  />
                </Grid>
              </Grid>

              <Grid item container className={classes.formItem}>
                <NumberInputV2
                  onChange={() => offchainTrigger('token_total_supply')}
                  onValueChange={(values: any) => {
                    setOffchainValue('token_total_supply', values.floatValue);
                  }}
                  required
                  control={offchainController}
                  label={PoolInputLabel.token_total_supply}
                  name="token_total_supply"
                  isError={Boolean(offchainError?.token_total_supply)}
                  errorMessage={offchainError?.token_total_supply?.message}
                  inputProps={{ readOnly: true }}
                  tooltipHelp={PoolInputLabel.token_total_supply_tooltip}
                />
              </Grid>

              {toggleEditMode && (
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
                    onClick={handleOffchainSubmit(onOffchainSubmit)}
                  >
                    {loading ? 'Updating...' : 'Save'}
                  </Button>
                </CardActions>
              )}
            </form>
          </CardContent>
        </Card>

        <Card style={{ marginBottom: theme.spacing(2) }}>
          <CardHeader title="ONCHAIN POOL INFORMATION" />
          <CardContent>
            <form>
              <Grid item className={classes.formItem}>
                <CheckBoxInput
                  control={onchainController}
                  disabled
                  label="Active"
                  name="is_active"
                  defaultChecked={false}
                />
              </Grid>
              {getValuesOnchain('voting_phase_is_active') && (
                <Grid item container className={classes.formItem}>
                  <Grid item style={{ flex: 1, marginRight: theme.spacing(1) }}>
                    <DateInputV2
                      required
                      control={onchainController}
                      disabled={
                        new Date(
                          getValuesOnchain('current_voting_start')
                        ).getTime() < Date.now()
                      }
                      name="voting_start"
                      label={PoolInputLabel.voting_start}
                      isError={Boolean(onchainError.voting_start)}
                      errorMessage={onchainError?.voting_start?.message}
                      tooltipHelp={PoolInputLabel.voting_start_tooltip}
                    />
                  </Grid>
                  <Grid item style={{ flex: 1, marginLeft: theme.spacing(1) }}>
                    <DateInputV2
                      required
                      control={onchainController}
                      name="voting_end"
                      label={PoolInputLabel.voting_end_1}
                      isError={Boolean(onchainError?.voting_end)}
                      errorMessage={onchainError?.voting_end?.message}
                      disabled={
                        new Date(
                          getValuesOnchain('current_voting_end')
                        ).getTime() < Date.now()
                      }
                      tooltipHelp={`${
                        PoolInputLabel.voting_end_1_tooltip
                      }${getValuesOnchain('max_voting_days')}${
                        PoolInputLabel.voting_end_2_tooltip
                      }`}
                    />
                  </Grid>
                </Grid>
              )}

              <Grid item container className={classes.formItem}>
                <Grid item style={{ flex: 1, marginRight: theme.spacing(1) }}>
                  <DateInputV2
                    required
                    control={onchainController}
                    name="join_pool_start"
                    label={PoolInputLabel.join_pool_start}
                    isError={Boolean(onchainError.join_pool_start)}
                    errorMessage={onchainError?.join_pool_start?.message}
                    disabled={getValuesOnchain('is_active')}
                    tooltipHelp={PoolInputLabel.join_pool_start_tooltip}
                  />
                </Grid>
                <Grid item style={{ flex: 1, marginLeft: theme.spacing(1) }}>
                  <DateInputV2
                    required
                    control={onchainController}
                    name="join_pool_end"
                    label={PoolInputLabel.join_pool_end}
                    isError={Boolean(onchainError?.join_pool_end)}
                    errorMessage={onchainError?.join_pool_end?.message}
                    disabled={getValuesOnchain('is_active')}
                    tooltipHelp={PoolInputLabel.join_pool_end_tooltip}
                  />
                </Grid>
              </Grid>
              <Grid item container className={classes.formItem}>
                <Grid
                  item
                  style={{ flex: 1 /* , marginRight: theme.spacing(1) */ }}
                >
                  <DateInputV2
                    required
                    control={onchainController}
                    name="claim_at"
                    label={PoolInputLabel.claim_at}
                    disabled={getValuesOnchain('is_active')}
                    isError={Boolean(onchainError?.claim_at)}
                    errorMessage={onchainError?.claim_at?.message}
                    tooltipHelp={PoolInputLabel.claim_at_tooltip}
                  />
                </Grid>
              </Grid>
              <Grid item container className={classes.formItem}>
                <Grid
                  item
                  style={{ flex: 1, marginRight: theme.spacing(1) }}
                  // xs={6}
                >
                  <NumberInputV2
                    onChange={() => onchainTrigger('max_allocation_all_phases')}
                    onValueChange={(values: any) => {
                      setOnchainValue(
                        'max_allocation_all_phases',
                        values.floatValue
                      );
                    }}
                    required
                    control={onchainController}
                    label={`${
                      PoolInputLabel.max_allocation_all_phases
                    } (${getValuesOffchain('token_to')})`}
                    name="max_allocation_all_phases"
                    isError={Boolean(onchainError?.max_allocation_all_phases)}
                    errorMessage={
                      onchainError?.max_allocation_all_phases?.message
                    }
                    inputProps={{ readOnly: getValuesOnchain('is_active') }}
                    tooltipHelp={
                      PoolInputLabel.max_allocation_all_phases_tooltip
                    }
                  />
                </Grid>
                <Grid
                  item
                  style={{ flex: 1, marginRight: theme.spacing(1) }}
                  // xs={6}
                ></Grid>
              </Grid>
              <Grid item container className={classes.formItem}>
                <Grid item style={{ flex: 1, marginRight: theme.spacing(1) }}>
                  <CheckBoxInputV2
                    control={onchainController}
                    label={PoolInputLabel.early_phase_is_active}
                    name="early_phase_is_active"
                    disabled={getValuesOnchain('is_active')}
                    defaultChecked={true}
                    onChange={(event) => {
                      setIsRequreidEarlyPhaseMaxTotalAlloc(
                        event.target.checked
                      );
                      setOnchainValue(
                        'early_phase_is_active',
                        event.target.checked
                      );
                      if (!event.target.checked) {
                        setIsRequreidFcfsStakePhaseMaxTotalAlloc(false);
                        setOnchainValue('fcfs_stake_phase_is_active', false);
                      }
                    }}
                    tooltipHelp={PoolInputLabel.early_phase_is_active_tooltip}
                  />
                </Grid>

                {getValuesOnchain('early_phase_is_active') && (
                  <Grid item style={{ flex: 1, marginLeft: theme.spacing(1) }}>
                    <NumberInputV2
                      onChange={() => onchainTrigger('early_join_duration')}
                      onValueChange={(values: any) => {
                        setOnchainValue(
                          'early_join_duration',
                          values.floatValue
                        );
                      }}
                      required
                      control={onchainController}
                      label={PoolInputLabel.early_join_duration}
                      name="early_join_duration"
                      isError={Boolean(onchainError?.early_join_duration)}
                      errorMessage={onchainError?.early_join_duration?.message}
                      inputProps={{ readOnly: getValuesOnchain('is_active') }}
                    />
                  </Grid>
                )}

                <Grid item style={{ flex: 1, marginLeft: theme.spacing(1) }}>
                  {getValuesOnchain('early_phase_is_active') && (
                    <NumberInputV2
                      onChange={() =>
                        onchainTrigger('early_phase_max_total_alloc')
                      }
                      onValueChange={(values: any) => {
                        setOnchainValue(
                          'early_phase_max_total_alloc',
                          values.floatValue
                        );
                      }}
                      required={isRequreidEarlyPhaseMaxTotalAlloc}
                      control={onchainController}
                      label={`${
                        PoolInputLabel.early_phase_max_total_alloc
                      } (${getValuesOffchain('token_to')})`}
                      name="early_phase_max_total_alloc"
                      isError={Boolean(
                        onchainError?.early_phase_max_total_alloc
                      )}
                      errorMessage={
                        onchainError?.early_phase_max_total_alloc?.message
                      }
                      inputProps={{ readOnly: getValuesOnchain('is_active') }}
                    />
                  )}
                </Grid>
              </Grid>

              <Grid item container className={classes.formItem}>
                <Grid item style={{ flex: 1, marginRight: theme.spacing(1) }}>
                  <CheckBoxInputV2
                    control={onchainController}
                    label={PoolInputLabel.exclusive_phase_is_active}
                    name="exclusive_phase_is_active"
                    defaultChecked={true}
                    disabled={getValuesOnchain('is_active')}
                    onChange={(event) => {
                      if (event.target.checked) {
                        setIsRequreidEarlyPhaseMaxTotalAlloc(
                          !event.target.checked
                        );
                        setOnchainValue(
                          'early_phase_is_active',
                          !event.target.checked
                        );
                      }
                      setIsRequreidExclusivePhaseMaxTotalAlloc(
                        event.target.checked
                      );
                      setOnchainValue(
                        'exclusive_phase_is_active',
                        event.target.checked
                      );
                    }}
                    tooltipHelp={
                      PoolInputLabel.exclusive_phase_is_active_tooltip
                    }
                  />
                </Grid>
                {getValuesOnchain('exclusive_phase_is_active') && (
                  <Grid item style={{ flex: 1, marginRight: theme.spacing(1) }}>
                    <NumberInputV2
                      onChange={() => onchainTrigger('exclusive_join_duration')}
                      onValueChange={(values: any) => {
                        setOnchainValue(
                          'exclusive_join_duration',
                          values.floatValue
                        );
                      }}
                      required
                      control={onchainController}
                      label={PoolInputLabel.exclusive_join_duration}
                      name="exclusive_join_duration"
                      isError={Boolean(onchainError?.exclusive_join_duration)}
                      errorMessage={
                        onchainError?.exclusive_join_duration?.message
                      }
                    />
                  </Grid>
                )}
                <Grid item style={{ flex: 1, marginLeft: theme.spacing(1) }}>
                  {getValuesOnchain('exclusive_phase_is_active') && (
                    <NumberInputV2
                      onChange={() =>
                        onchainTrigger('exclusive_phase_max_total_alloc')
                      }
                      onValueChange={(values: any) => {
                        setOnchainValue(
                          'exclusive_phase_max_total_alloc',
                          values.floatValue
                        );
                      }}
                      required={isRequreidExclusivePhaseMaxTotalAlloc}
                      control={onchainController}
                      label={`${
                        PoolInputLabel.exclusive_phase_max_total_alloc
                      } (${getValuesOffchain('token_to')})`}
                      name="exclusive_phase_max_total_alloc"
                      isError={Boolean(
                        onchainError?.exclusive_phase_max_total_alloc
                      )}
                      errorMessage={
                        onchainError?.exclusive_phase_max_total_alloc?.message
                      }
                    />
                  )}
                </Grid>
              </Grid>

              {isRequreidExclusivePhaseMaxTotalAlloc && (
                <Grid item container className={classes.formItem}>
                  <Grid item style={{ flex: 1, marginRight: theme.spacing(1) }}>
                    <CheckBoxInputV2
                      control={onchainController}
                      label={PoolInputLabel.fcfs_stake_phase_is_active}
                      name="fcfs_stake_phase_is_active"
                      defaultChecked={true}
                      disabled={getValuesOnchain('is_active')}
                      onChange={(event) => {
                        setIsRequreidFcfsStakePhaseMaxTotalAlloc(
                          event.target.checked
                        );
                        setOnchainValue(
                          'fcfs_stake_phase_is_active',
                          event.target.checked
                        );
                      }}
                      tooltipHelp={
                        PoolInputLabel.fcfs_stake_phase_is_active_tooltip
                      }
                    />
                  </Grid>
                  {isRequreidFcfsStakePhaseMaxTotalAlloc && (
                    <>
                      <Grid
                        item
                        style={{ flex: 1, marginRight: theme.spacing(1) }}
                      >
                        <NumberInputV2
                          onChange={() => onchainTrigger('fcfs_stake_duration')}
                          onValueChange={(values: any) => {
                            setOnchainValue(
                              'fcfs_stake_duration',
                              values.floatValue
                            );
                          }}
                          required
                          control={onchainController}
                          label={PoolInputLabel.fcfs_stake_duration}
                          name="fcfs_stake_duration"
                          isError={Boolean(onchainError?.fcfs_stake_duration)}
                          errorMessage={
                            onchainError?.fcfs_stake_duration?.message
                          }
                          inputProps={{
                            readOnly: getValuesOnchain('is_active'),
                          }}
                        />
                      </Grid>
                      <Grid
                        item
                        style={{ flex: 1, marginLeft: theme.spacing(1) }}
                      >
                        <NumberInputV2
                          onChange={() =>
                            onchainTrigger(
                              'fcfs_stake_phase_multiplication_rate'
                            )
                          }
                          onValueChange={(values: any) => {
                            setOnchainValue(
                              'fcfs_stake_phase_multiplication_rate',
                              values.floatValue
                            );
                          }}
                          required
                          control={onchainController}
                          label={`${
                            PoolInputLabel.fcfs_stake_phase_multiplication_rate
                          } (${getValuesOffchain('token_to')})`}
                          name="fcfs_stake_phase_multiplication_rate"
                          isError={Boolean(
                            onchainError?.fcfs_stake_phase_multiplication_rate
                          )}
                          errorMessage={
                            onchainError?.fcfs_stake_phase_multiplication_rate
                              ?.message
                          }
                          inputProps={{
                            readOnly: getValuesOnchain('is_active'),
                          }}
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
              )}

              <Grid item container className={classes.formItem}>
                <Grid item style={{ flex: 1, marginRight: theme.spacing(1) }}>
                  <NumberInputV2
                    onChange={() => onchainTrigger('token_ratio')}
                    onValueChange={(values: any) => {
                      setOnchainValue('token_ratio', values.floatValue);
                    }}
                    required
                    control={onchainController}
                    label={PoolInputLabel.token_ratio}
                    name="token_ratio"
                    isError={Boolean(onchainError?.token_ratio)}
                    errorMessage={onchainError?.token_ratio?.message}
                    inputProps={{ readOnly: getValuesOnchain('is_active') }}
                    tooltipHelp={PoolInputLabel.token_ratio_tooltip}
                  />
                </Grid>
                <Grid item style={{ flex: 1, marginLeft: theme.spacing(1) }}>
                  <InputV2
                    required
                    disabled
                    control={offchainController}
                    label={PoolInputLabel.token_to}
                    name="token_to"
                    isError={Boolean(offchainError?.token_to)}
                    errorMessage={offchainError?.token_to?.message}
                    select
                    tooltipHelp={PoolInputLabel.token_to_tooltip}
                  >
                    {supportedTokens.map((dialect) => (
                      <MenuItem key={dialect.value} value={dialect.value}>
                        {dialect.label}
                      </MenuItem>
                    ))}
                  </InputV2>
                </Grid>
              </Grid>
              <Grid item container className={classes.formItem}>
                <NumberInputV2
                  onChange={() =>
                    onchainTrigger('public_phase_max_individual_alloc')
                  }
                  onValueChange={(values: any) => {
                    setOnchainValue(
                      'public_phase_max_individual_alloc',
                      values.floatValue
                    );
                  }}
                  required
                  control={onchainController}
                  label={`${
                    PoolInputLabel.public_phase_max_individual_alloc
                  } (${getValuesOffchain('token_to')})`}
                  name="public_phase_max_individual_alloc"
                  isError={Boolean(
                    onchainError?.public_phase_max_individual_alloc
                  )}
                  errorMessage={
                    onchainError?.public_phase_max_individual_alloc?.message
                  }
                  inputProps={{ readOnly: getValuesOnchain('is_active') }}
                  tooltipHelp={
                    PoolInputLabel.public_phase_max_individual_alloc_tooltip
                  }
                />
              </Grid>
              <Grid item container className={classes.formItem}>
                <Grid item style={{ flex: 1, marginRight: theme.spacing(1) }}>
                  <CheckBoxInput
                    control={onchainController}
                    disabled={true}
                    label={`Acknowledgement of ${feeSetting}% SOL raised will be kept in platform.`}
                    name="is_checked_fee_information"
                    defaultChecked={true}
                  />
                </Grid>
              </Grid>
              {toggleEditMode && !poolIsActive && (
                <CardActions
                  classes={{
                    root: classes.cardActions,
                  }}
                >
                  <Button
                    size="large"
                    variant="contained"
                    color="primary"
                    disabled={getValuesOnchain('is_active') || loading}
                    onClick={handleOnchainSubmit(onOnchainSubmit)}
                  >
                    {loading ? 'Updating...' : 'Save'}
                  </Button>
                </CardActions>
              )}
            </form>
          </CardContent>
        </Card>
        {showTransferAdmin()}
      </>
    </MuiPickersUtilsProvider>
  );
};

export default UpdatePool;
