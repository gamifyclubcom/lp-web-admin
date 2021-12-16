import MomentUtils from '@date-io/moment';
import { yupResolver } from '@hookform/resolvers/yup';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import { useTheme } from '@material-ui/core/styles';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import { useEffect, useMemo, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useAlert, useConnection } from '../../hooks';
import * as Types from '../../types';
import { poolSettimeValidator } from '../../utils/validators';
import DateInput from '../common/form/DateInput';
import Input from '../common/form/Input';
import useStyles from './styles';
import {
  parseTransaction,
  sendSignedTransaction,
  sleep,
} from '../../shared/helper';
import { PoolInputLabel } from './constants';
import * as poolSdk from '@gamify/onchain-program-sdk';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { FormValues, getUpdatePoolV4TimingParams } from './pool-timing-helper';

interface Props {
  pool?: Types.Pool;
  loading?: boolean;
  fetchPool: () => void;
  setLoading: (loading: boolean) => void;
  syncAndFetchPool: () => void;
}

const defaultValues: FormValues = {
  early_phase_is_active: true,
  exclusive_phase_is_active: true,
  fcfs_stake_phase_is_active: true,

  join_pool_start: new Date().toISOString(),
  join_pool_end: new Date().toISOString(),
  claim_at: new Date().toISOString(),
  early_join_duration: 20,
  fcfs_stake_join_duration: 20,
  exclusive_join_duration: 20,

  new_join_pool_start: new Date().toISOString(),
  new_join_pool_end: new Date().toISOString(),
  new_claim_at: new Date().toISOString(),
  new_early_join_duration: 20,
  new_fcfs_stake_join_duration: 20,
  new_exclusive_join_duration: 20,
};

const PoolTiming: React.FC<Props> = ({
  pool,
  loading = false,
  fetchPool,
  setLoading,
  syncAndFetchPool,
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const { wallet, connected, connect, publicKey, signTransaction } =
    useWallet();
  const { connection } = useConnection();
  const [earlyJoinIsActive, setEarlyJoinIsActive] = useState(false);
  const [exclusiveJoinIsActive, setExclusiveJoinIsActive] = useState(false);
  const [fcfsStakersJoinIsActive, setFcfsStakersJoinIsActive] = useState(false);

  const {
    control,
    setValue,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    shouldFocusError: true,
    defaultValues,
    reValidateMode: 'onChange',
    resolver: yupResolver(poolSettimeValidator),
  });

  console.log(' error: ', errors);

  const { alertError } = useAlert();
  const [copied, setCopied] = useState(false);
  const { alertSuccess } = useAlert();
  const onOnchainSubmit: SubmitHandler<FormValues> = (data) => {
    return handleOnchainUpdate(data);
  };
  const handleOnchainUpdate = async (data: FormValues) => {
    try {
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
      const contractPublicKey = new PublicKey(pool?.contract_address as string);
      // @ts-ignore
      const walletKey = new PublicKey(publicKey.toBase58());
      const action = new poolSdk.Actions(connection);

      const {
        needUpdate,
        earlyJoinEndAt,
        exclusiveJoinEndAt,
        fcfsStakeJoinEndAt,
        earlyJoinStartAt,
        exclusiveJoinStartAt,
        fcfsStakeJoinStartAt,
        publicJoinStartAt,
        publicJoinEndAt,
        claimAt,
      } = getUpdatePoolV4TimingParams({
        data,
        earlyJoinIsActive,
        exclusiveJoinIsActive,
        fcfsStakersJoinIsActive,
        getValues,
      });

      if (needUpdate) {
        const res = await action.setPoolTimesV4(walletKey, contractPublicKey, {
          ...(earlyJoinStartAt && { earlyJoinStartAt }),
          ...(earlyJoinEndAt && { earlyJoinEndAt }),
          ...(exclusiveJoinStartAt && { exclusiveJoinStartAt }),
          ...(exclusiveJoinEndAt && { exclusiveJoinEndAt }),
          ...(publicJoinStartAt && { publicJoinStartAt }),
          ...(publicJoinEndAt && { publicJoinEndAt }),
          ...(claimAt && { claimAt }),
          ...(fcfsStakeJoinStartAt && { fcfsStakeJoinStartAt }),
          ...(fcfsStakeJoinEndAt && { fcfsStakeJoinEndAt }),
        });

        if (res.rawTx) {
          const tx = await parseTransaction(res.rawTx);
          const signedTx = await signTransaction!(tx);
          await sendSignedTransaction(connection, signedTx.serialize());
        }

        syncAndFetchPool();
      }

      setLoading(false);
      alertSuccess('Update success');
    } catch (error: any) {
      console.log(error);
      setLoading(false);
      alertError(error.message);
    }
  };

  // let [toggleEditMode, setToggleEditMode] = useState(mode === 'update');
  const [toggleEditMode, setToggleEditMode] = useState(false);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!pool) return;

    try {
      const {
        join_pool_start,
        join_pool_end,
        claim_at,
        early_join_duration,
        early_phase_is_active,
        fcfs_stake_duration,
        exclusive_join_duration,
        exclusive_phase_is_active,
        fcfs_stake_phase_is_active,
      } = pool;
      setEarlyJoinIsActive(early_phase_is_active);
      setValue('early_phase_is_active', early_phase_is_active);
      setExclusiveJoinIsActive(exclusive_phase_is_active);
      setValue('exclusive_phase_is_active', exclusive_phase_is_active);
      setFcfsStakersJoinIsActive(fcfs_stake_phase_is_active);
      setValue('fcfs_stake_phase_is_active', fcfs_stake_phase_is_active);

      setValue('join_pool_start', join_pool_start);
      setValue('join_pool_end', join_pool_end);
      setValue('claim_at', claim_at);
      setValue('early_join_duration', early_join_duration);
      setValue('fcfs_stake_join_duration', fcfs_stake_duration || 0);
      setValue('exclusive_join_duration', exclusive_join_duration || 0);

      setValue('new_join_pool_start', join_pool_start);
      setValue('new_join_pool_end', join_pool_end);
      setValue('new_claim_at', claim_at);
      setValue('new_early_join_duration', early_join_duration);
      setValue('new_fcfs_stake_join_duration', fcfs_stake_duration || 0);
      setValue('new_exclusive_join_duration', exclusive_join_duration || 0);
    } catch (error: any) {
      console.log(error.toString());
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
    setToggleEditMode(!toggleEditMode);
  };

  return (
    <MuiPickersUtilsProvider utils={MomentUtils}>
      <Card style={{ marginBottom: theme.spacing(2) }}>
        <CardHeader title="POOL TIMING" />
        <CardContent>
          <form>
            <Grid item container className={classes.formItem}>
              <Grid item style={{ flex: 1, marginRight: theme.spacing(1) }}>
                <DateInput
                  required
                  control={control}
                  disabled={
                    !toggleEditMode ||
                    new Date(getValues('join_pool_start')).getTime() <
                      Date.now()
                  }
                  name="new_join_pool_start"
                  label={PoolInputLabel.join_pool_start}
                  isError={Boolean(errors.new_join_pool_start)}
                  errorMessage={errors?.new_join_pool_start?.message}
                />
              </Grid>
              <Grid item style={{ flex: 1, marginLeft: theme.spacing(1) }}>
                <DateInput
                  required
                  control={control}
                  name="new_join_pool_end"
                  disabled={
                    !toggleEditMode ||
                    new Date(getValues('join_pool_end')).getTime() < Date.now()
                  }
                  label={PoolInputLabel.join_pool_end}
                  isError={Boolean(errors?.new_join_pool_end)}
                  errorMessage={errors?.new_join_pool_end?.message}
                />
              </Grid>
            </Grid>
            <Grid item container className={classes.formItem}>
              <Grid item style={{ flex: 1 }}>
                <DateInput
                  required
                  control={control}
                  name="new_claim_at"
                  disabled={
                    !toggleEditMode ||
                    new Date(getValues('claim_at')).getTime() < Date.now()
                  }
                  label={PoolInputLabel.claim_at}
                  isError={Boolean(errors?.new_claim_at)}
                  errorMessage={errors?.new_claim_at?.message}
                />
              </Grid>
            </Grid>
            <Grid item container className={classes.formItem}>
              {earlyJoinIsActive && (
                <Grid item style={{ flex: 1 }}>
                  <Input
                    required
                    control={control}
                    label={PoolInputLabel.early_join_duration}
                    name="new_early_join_duration"
                    type="number"
                    inputProps={{
                      readOnly:
                        !toggleEditMode ||
                        new Date(getValues('join_pool_start')).getTime() +
                          getValues('early_join_duration') * 60 * 1000 <
                          Date.now(),
                    }}
                    isError={Boolean(errors?.new_early_join_duration)}
                    errorMessage={errors?.new_early_join_duration?.message}
                  ></Input>
                </Grid>
              )}
            </Grid>
            <Grid item container className={classes.formItem}>
              {exclusiveJoinIsActive && (
                <Grid item style={{ flex: 1 }}>
                  <Input
                    required
                    control={control}
                    label={PoolInputLabel.exclusive_join_duration}
                    name="new_exclusive_join_duration"
                    type="number"
                    inputProps={{
                      readOnly:
                        !toggleEditMode ||
                        new Date(getValues('join_pool_start')).getTime() +
                          getValues('exclusive_join_duration') * 60 * 1000 <
                          Date.now(),
                    }}
                    isError={Boolean(errors?.new_exclusive_join_duration)}
                    errorMessage={errors?.new_exclusive_join_duration?.message}
                  ></Input>
                </Grid>
              )}
            </Grid>
            <Grid item container className={classes.formItem}>
              {fcfsStakersJoinIsActive && (
                <Grid item style={{ flex: 1 }}>
                  <Input
                    required
                    control={control}
                    label={PoolInputLabel.fcfs_stake_duration}
                    name="new_fcfs_stake_join_duration"
                    type="number"
                    inputProps={{
                      readOnly:
                        !toggleEditMode ||
                        new Date(
                          fcfsStakersJoinIsActive
                            ? new Date(getValues('join_pool_start')).getTime() +
                              getValues('exclusive_join_duration') * 60 * 1000 +
                              getValues('fcfs_stake_join_duration') * 60 * 1000
                            : new Date(getValues('join_pool_start')).getTime() +
                              getValues('fcfs_stake_join_duration') * 60 * 1000
                        ).getTime() < Date.now(),
                    }}
                    isError={Boolean(errors?.new_fcfs_stake_join_duration)}
                    errorMessage={errors?.new_fcfs_stake_join_duration?.message}
                  ></Input>
                </Grid>
              )}
            </Grid>
          </form>
        </CardContent>
      </Card>

      <Grid container justifyContent="center" alignItems="center">
        <Grid>
          {toggleEditMode && (
            <Button
              size="large"
              style={{ width: 300 }}
              variant="contained"
              color="primary"
              disabled={loading}
              onClick={handleSubmit(onOnchainSubmit)}
            >
              {loading ? 'Saving' : 'Save'}
            </Button>
          )}

          <Button
            size="large"
            style={{ width: 300, marginLeft: theme.spacing(2) }}
            variant="contained"
            color={toggleEditMode ? 'secondary' : 'primary'}
            disabled={loading}
            onClick={() => toggleEdit()}
          >
            {toggleEditMode ? 'Cancel' : 'Edit'}
          </Button>
        </Grid>
      </Grid>
    </MuiPickersUtilsProvider>
  );
};

export default PoolTiming;
