import MomentUtils from '@date-io/moment';
import { Actions, IPoolV4ContractData } from '@gamify/onchain-program-sdk';
import { Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Grid from '@material-ui/core/Grid';
import { useTheme } from '@material-ui/core/styles';
import Skeleton from '@material-ui/lab/Skeleton';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import { PublicKey } from '@solana/web3.js';
import Decimal from 'decimal.js';
import { saveAs } from 'file-saver';
import moment from 'moment';
import { useEffect, useMemo, useState } from 'react';
import Countdown from 'react-countdown';
import * as poolAPI from '../../../api/pool';
import { envConfig } from '../../../config';
import { useConnection, useCountDown } from '../../../hooks';
import * as Types from '../../../types';
import { RoundCardItem } from './RoundCardItem';

const { REACT_APP_API_BASE_URL } = envConfig;
interface Props {
  pool?: Types.Pool;
  loading: boolean;
  isVerified: boolean;
  setLoading: (state: boolean) => void;
}

const convertTokenToSOL = (
  amountInToken: number,
  rate: number,
  tokenDecimal: number
) => {
  return new Decimal(amountInToken)
    .div(rate)
    .toDecimalPlaces(tokenDecimal)
    .toNumber();
};

export const PoolParticipants: React.FC<Props> = ({
  pool,
  loading = false,
  isVerified,
  setLoading,
}) => {
  const theme = useTheme();
  const { renderCountDownValue } = useCountDown();
  const { connection } = useConnection();
  const [poolData, setPoolData] = useState<Partial<IPoolV4ContractData>>({});
  const [tokenToDecimal, setTokenToDecimal] = useState(0);
  const [blockTime, setBlockTime] = useState(0);

  const canExportParticipants = useMemo(() => {
    return moment
      .unix(new Decimal(blockTime).dividedBy(1000).toNumber())
      .isAfter(pool?.join_pool_end);
  }, [pool, blockTime]);

  const joinPoolEnd = useMemo(() => {
    return pool?.join_pool_end;
  }, [pool]);

  const handleExport = async (contract_address: string) => {
    const res = (await poolAPI.exportJoinedUsersList(contract_address)) as any;
    const fileName = `joined-users-${moment(new Date()).format(
      'yyyyMMdd-hhmmss'
    )}.csv`;
    const fileType = 'application/vnd.ms-excel;charset=utf-8;';
    const blob = new Blob([res], { type: fileType });
    const file = new File([blob], fileName, { type: fileType });
    saveAs(file);
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!pool) return;

    const fetchTokenToDecimal = async () => {
      const action = new Actions(connection);
      const decimal = await action.getTokenDecimals(
        new PublicKey(pool.token_x)
      );
      setTokenToDecimal(decimal);
    };

    const fetchData = async () => {
      await fetchTokenToDecimal();
      const action = new Actions(connection);
      const poolData = await action.readPool(
        new PublicKey(pool.contract_address)
      );
      setPoolData(poolData as IPoolV4ContractData);
    };

    setLoading(true);
    fetchData().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool]);

  useEffect(() => {
    const getBlockTime = async () => {
      try {
        const epochInfo = await connection.getEpochInfo();
        const lastSlot = epochInfo.absoluteSlot;
        const blockTime = await connection.getBlockTime(lastSlot);
        setBlockTime((blockTime || 0) * 1000);
      } catch (error) {
        console.log(error, 'getBlockTime::error');
      }
    };
    (async () => {
      await getBlockTime();
    })();

    const countBlocktime = () => {
      setBlockTime((prevTime) => prevTime + 1000);
    };

    const blockTimeInterval = setInterval(countBlocktime, 1000);
    return () => {
      clearInterval(blockTimeInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const poolRounds = useMemo(() => {
    let result: {
      key: string;
      title: string;
      numberJoinedUser: number;
      totalRaise: number;
      totalSold: number;
    }[] = [];
    if (Boolean(poolData?.campaign?.early_join_phase?.is_active)) {
      result.push({
        key: 'whitelist',
        title: 'GMFC whitelist round',
        numberJoinedUser:
          poolData?.campaign?.early_join_phase.number_joined_user || 0,
        totalRaise: convertTokenToSOL(
          poolData?.campaign?.early_join_phase?.max_total_alloc || 0,
          poolData?.rate || 1,
          tokenToDecimal
        ),
        totalSold: convertTokenToSOL(
          poolData?.campaign?.early_join_phase?.sold_allocation || 0,
          poolData?.rate || 1,
          tokenToDecimal
        ),
      });
    }
    if (Boolean(poolData?.campaign?.exclusive_phase?.is_active)) {
      result.push({
        key: 'exclusive',
        title: 'GMFC exclusive round',
        numberJoinedUser:
          poolData?.campaign?.exclusive_phase.number_joined_user || 0,
        totalRaise: convertTokenToSOL(
          poolData?.campaign?.exclusive_phase?.max_total_alloc || 0,
          poolData?.rate || 1,
          tokenToDecimal
        ),
        totalSold: convertTokenToSOL(
          poolData?.campaign?.exclusive_phase?.sold_allocation || 0,
          poolData?.rate || 1,
          tokenToDecimal
        ),
      });
    }
    if (Boolean(poolData?.campaign?.fcfs_stake_phase?.is_active)) {
      result.push({
        key: 'fcfs-staker',
        title: 'GMFC FCFS for stakers round',
        numberJoinedUser:
          poolData?.campaign?.fcfs_stake_phase.number_joined_user || 0,
        totalRaise: convertTokenToSOL(
          poolData?.campaign?.fcfs_stake_phase?.max_total_alloc || 0,
          poolData?.rate || 1,
          tokenToDecimal
        ),
        totalSold: convertTokenToSOL(
          poolData?.campaign?.fcfs_stake_phase?.sold_allocation || 0,
          poolData?.rate || 1,
          tokenToDecimal
        ),
      });
    }
    if (Boolean(poolData?.campaign?.public_phase?.is_active)) {
      result.push({
        key: 'fcfs',
        title: 'GMFC FCFS round',
        numberJoinedUser:
          poolData?.campaign?.public_phase.number_joined_user || 0,
        totalRaise: convertTokenToSOL(
          poolData?.campaign?.public_phase?.max_total_alloc || 0,
          poolData?.rate || 1,
          tokenToDecimal
        ),
        totalSold: convertTokenToSOL(
          poolData?.campaign?.public_phase?.sold_allocation || 0,
          poolData?.rate || 1,
          tokenToDecimal
        ),
      });
    }

    return result;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolData]);

  return (
    <MuiPickersUtilsProvider utils={MomentUtils}>
      <Card style={{ marginBottom: theme.spacing(2) }}>
        <div style={{ padding: theme.spacing(2) }}>
          <Typography variant="h4" gutterBottom>
            Reliable on-chain data
          </Typography>
        </div>
        {loading ? (
          <div style={{ padding: theme.spacing(2) }}>
            <Skeleton variant="rect" width="100%" height={250} />
          </div>
        ) : (
          poolRounds.map((round) => (
            <RoundCardItem
              key={round.key}
              title={round.title}
              numberJoinedUser={round.numberJoinedUser}
              totalRaise={round.totalRaise}
              totalSold={round.totalSold}
            />
          ))
        )}
        <div style={{ padding: theme.spacing(2) }}>
          <Typography variant="h4" gutterBottom>
            Unreliable off-chain data
          </Typography>
        </div>
        <CardContent style={{ whiteSpace: 'pre-line' }}>
          <div style={{ whiteSpace: 'pre-line' }}>
            {`WARNING!!!
Please keep in mind this list is NOT RELIABLE 100%. There're some situations that on-chain data and the data in our database is not synchronized.
Another note: if one user joined pool multiple times, there're multiple records in this file.
After downloading this file you must:
1. Aggregate the data to make the list of addresses without duplications.
2. For each address, please use api ${REACT_APP_API_BASE_URL}/pools/${pool?._id}/users?userAccount={USER_WALLET_ADDRESS} to check the actual on-chain data.
3. Then you can get the reliable list of user and their contributed amount.`}
          </div>
          <Grid container justifyContent="center">
            {canExportParticipants ? (
              isVerified ? (
                <Button
                  size="large"
                  variant="contained"
                  color="primary"
                  style={{ margin: theme.spacing(2) }}
                  disabled={loading}
                  onClick={() => handleExport(pool?.contract_address as string)}
                >
                  {loading ? 'Loading' : 'Export joined users list'}
                </Button>
              ) : (
                <Button
                  size="large"
                  variant="contained"
                  color="primary"
                  style={{ margin: theme.spacing(2) }}
                  disabled
                >
                  {`Verifying...`}
                </Button>
              )
            ) : (
              <Grid
                container
                direction="column"
                style={{ marginTop: theme.spacing(2) }}
                justifyContent="center"
                alignItems="center"
              >
                <Grid item>
                  <span>Export not available, you can export after</span>
                </Grid>

                <Grid item>
                  <Grid
                    container
                    style={{
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: theme.spacing(2),
                      padding: theme.spacing(2),
                    }}
                  >
                    <Countdown
                      onComplete={() => {
                        window.location.reload();
                      }}
                      date={joinPoolEnd}
                      renderer={({
                        days,
                        hours,
                        minutes,
                        seconds,
                        completed,
                      }) => {
                        const daysValue = renderCountDownValue({
                          targetDate: joinPoolEnd,
                          isCompleted: completed,
                          timeUnit: days,
                        });
                        const hoursValue = renderCountDownValue({
                          targetDate: joinPoolEnd,
                          isCompleted: completed,
                          timeUnit: hours,
                        });
                        const minutesValue = renderCountDownValue({
                          targetDate: joinPoolEnd,
                          isCompleted: completed,
                          timeUnit: minutes,
                        });
                        const secondsValue = renderCountDownValue({
                          targetDate: joinPoolEnd,
                          isCompleted: completed,
                          timeUnit: seconds,
                        });

                        return (
                          <Grid container spacing={2}>
                            <span
                              style={{
                                marginLeft: theme.spacing(1),
                                marginRight: theme.spacing(1),
                              }}
                            >{`${daysValue} days`}</span>
                            <span
                              style={{
                                marginLeft: theme.spacing(1),
                                marginRight: theme.spacing(1),
                              }}
                            >{`${hoursValue} hours`}</span>
                            <span
                              style={{
                                marginLeft: theme.spacing(1),
                                marginRight: theme.spacing(1),
                              }}
                            >{`${minutesValue} minutes`}</span>
                            <span
                              style={{
                                marginLeft: theme.spacing(1),
                                marginRight: theme.spacing(1),
                              }}
                            >{`${secondsValue} seconds`}</span>
                          </Grid>
                        );
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    </MuiPickersUtilsProvider>
  );
};
