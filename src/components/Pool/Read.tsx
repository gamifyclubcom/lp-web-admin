import Backdrop from '@material-ui/core/Backdrop';
import CircularProgress from '@material-ui/core/CircularProgress';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as api from '../../api/pool';
import ServerError from '../../components/Error/ServerError';
import { useAlert, useConnection } from '../../hooks';
import {
  parseTransaction,
  sendSignedTransaction,
  sleep,
} from '../../shared/helper';
import * as Types from '../../types';
import Pool from './Pool';
import useStyles from './styles';
import { Whitelist } from './Whitelist';
import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import PoolWithdrawal from './Withdrawal';
import PoolTiming from './PoolTiming';
import { getTokenBalances } from '../../utils/solana-api';
import AlertDialog from './Popup';
import { useWallet } from '@solana/wallet-adapter-react';
import { Decimal } from 'decimal.js';
import { Actions } from '@gamify/onchain-program-sdk';
import { PublicKey } from '@solana/web3.js';
import PoolTiers from './UserTiers';
import { PoolParticipants } from './paticipants/Participants';
interface URLParams {
  id: string;
}

const ReadPool: React.FC = () => {
  const classes = useStyles();
  const { alertSuccess, alertError } = useAlert();
  const [loading, setLoading] = useState<boolean>(false);
  const [pool, setPool] = useState<Types.Pool | undefined>(undefined);
  const [error, setError] = useState<Types.ServerError | null>(null);
  const [value, setValue] = React.useState(0);
  const [poolIsActive, setPoolIsActive] = useState(false);
  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setValue(newValue);
  };
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [hideConfirm, setHideConfirm] = useState(false);
  const [cancelDialogText, setCancelDialogText] = useState('Cancel');
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const { wallet, connected, publicKey, connect, signTransaction } =
    useWallet();
  const { connection } = useConnection();

  const { id }: URLParams = useParams();

  const poolInfoIndex = useMemo(() => 0, []);
  const poolWhitelistIndex = useMemo(() => {
    if (Boolean(pool?.early_phase_is_active)) {
      return 1;
    }

    return null;
  }, [pool?.early_phase_is_active]);
  const poolWithdrawIndex = useMemo(() => {
    if (poolWhitelistIndex) {
      return poolWhitelistIndex + 1;
    }

    return poolInfoIndex + 1;
  }, [poolWhitelistIndex, poolInfoIndex]);
  const poolAllocationIndex = useMemo(() => {
    if (Boolean(pool?.exclusive_phase_is_active)) {
      return poolWithdrawIndex + 1;
    }

    return null;
  }, [poolWithdrawIndex, pool?.exclusive_phase_is_active]);
  const poolTimingIndex = useMemo(() => {
    if (poolIsActive) {
      if (poolAllocationIndex) {
        return poolAllocationIndex + 1;
      }

      return poolWithdrawIndex + 1;
    }

    return null;
  }, [poolIsActive, poolAllocationIndex, poolWithdrawIndex]);
  const poolParticipantsIndex = useMemo(() => {
    if (
      pool &&
      pool.is_active &&
      new Date() >= new Date(pool.join_pool_start) &&
      poolTimingIndex
    ) {
      return poolTimingIndex + 1;
    }

    return null;
  }, [pool, poolTimingIndex]);

  useEffect(() => {
    const fetchVerifiedInfo = async () => {
      try {
        if (!isVerified) {
          const data = await api.fetchPool(id);
          setIsVerified(Boolean(data?.flags?.is_finalize_participants));
        }
      } catch (err) {
        setIsVerified(false);
      }
    };

    const interval = setInterval(() => {
      fetchVerifiedInfo();
    }, 5 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchPool = async () => {
    try {
      if (!id) return;

      setLoading(true);
      const data = await api.fetchPool(id);
      if (!data) {
        setError({ code: 404, message: 'Not found' });
        setLoading(false);
        return;
      }

      setPool(data);
      setPoolIsActive(data.is_active);
      setIsVerified(Boolean(data?.flags?.is_finalize_participants));
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      alertError(error.toString());
    }
  };

  const handleClickActiveButton = async () => {
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
    const tokenYBalance = (
      await getTokenBalances(
        connection,
        pool?.token_address as string,
        pool?.token_y as string
      )
    ).toNumber();
    const totalRaise = new Decimal(pool?.max_allocation_all_phases).mul(
      pool.token_ratio
    );

    if (totalRaise.lte(tokenYBalance)) {
      setTitle(`ARE YOU SURE?`);
      setMessage(
        `Once the pool is activated, you can NOT edit some on-chain information, pool admin, and whitelist. Also it can NOT be deactivated later.`
      );
      setCancelDialogText('Cancel');
      setHideConfirm(false);
    } else {
      setMessage(
        `This pool account has not been transferred enough tokens.
        Current tokens in the pool: ${tokenYBalance.toString()}
        Required tokens [total raise * ratio]: ${totalRaise.toString()}
        Please transfer sufficient tokens to pool account before activate it: ${
          pool?.token_y
        }`
      );
      setHideConfirm(true);
      setCancelDialogText('Ok');
    }

    return setOpen(true);
  };
  useEffect(() => {
    fetchPool();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const syncAndFetchPool = async () => {
    const newPool = await api.syncPool(pool?.id || '');
    setPool(newPool);
    setPoolIsActive(newPool?.is_active);

    return newPool;
  };

  const handleActivate = async (id: string) => {
    try {
      setOpen(false);
      setLoading(true);
      if (!connected && wallet) {
        await connect();
        await sleep(3000);
      }

      if (!publicKey) {
        alertError('Please connect your wallet!');
        setLoading(false);
        return;
      }

      if (publicKey?.toBase58() !== pool?.root_admin) {
        alertError('You are not admin of this pool');
        setLoading(false);
        return;
      }
      const res = await new Actions(connection).activatePool(
        publicKey,
        new PublicKey(pool.contract_address),
        new PublicKey(pool.platform)
      );
      if (res.rawTransaction) {
        try {
          const transaction = await parseTransaction(res.rawTransaction);
          const signedTx = await signTransaction!(transaction);
          await sendSignedTransaction(connection, signedTx.serialize());
          await syncAndFetchPool();
        } catch (e: any) {
          setLoading(false);
          alertError(e.message);
          return;
        }
      }
      alertSuccess('Update success');
    } catch (error: any) {
      setLoading(false);
      alertError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSnapshot = async () => {
    try {
      setLoading(true);
      if (!connected && wallet) {
        await connect();
        await sleep(3000);
      }

      if (!publicKey) {
        alertError('Please connect your wallet!');
        setLoading(false);
        return;
      }

      if (publicKey?.toBase58() !== pool?.root_admin) {
        alertError('You are not admin of this pool');
        setLoading(false);
        return;
      }
      const action = new Actions(connection);
      const { unsignedTransaction } = await action.snapshot(
        publicKey,
        new PublicKey(pool.contract_address)
      );
      if (unsignedTransaction) {
        try {
          const signedTx = await signTransaction!(unsignedTransaction);
          await sendSignedTransaction(connection, signedTx.serialize());
          await syncAndFetchPool();
        } catch (e: any) {
          setLoading(false);
          alertError(e.message);
          return;
        }
      }
      alertSuccess('Update success');
    } catch (error: any) {
      setLoading(false);
      alertError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return <ServerError {...error} />;
  }

  const handleClose = () => {
    setLoading(false);
  };

  return (
    <>
      <AlertDialog
        setOpen={setOpen}
        open={open}
        message={message}
        title={title}
        handleConfirm={() => handleActivate(pool?.id as string)}
        hideConfirm={hideConfirm}
        cancelButtonText={cancelDialogText}
      />
      <Backdrop
        className={classes.backdrop}
        open={loading}
        onClick={handleClose}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <AppBar position="static">
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="simple tabs example"
        >
          <Tab label="POOL INFORMATION" {...a11yProps(poolInfoIndex)} />
          {poolWhitelistIndex && (
            <Tab label="WHITELIST" {...a11yProps(poolWhitelistIndex)} />
          )}
          <Tab label="WITHDRAWAL" {...a11yProps(poolWithdrawIndex)} />
          {poolAllocationIndex && (
            <Tab label="ALLOCATION" {...a11yProps(poolAllocationIndex)} />
          )}
          {poolTimingIndex && (
            <Tab label="POOL TIMING" {...a11yProps(poolTimingIndex)} />
          )}
          {poolParticipantsIndex && (
            <Tab label="PARTICIPANTS" {...a11yProps(poolParticipantsIndex)} />
          )}
        </Tabs>
      </AppBar>
      <TabPanel value={value} index={poolInfoIndex}>
        <Pool
          pool={pool}
          submitBtnText="Edit"
          submitBtnLoadingText="Loading..."
          mode="read"
          loading={loading}
          handleSubmitOnchainProp={() => {}}
          handleSubmitOffchainProp={() => {}}
          handleActivate={handleClickActiveButton}
          handleSubmitProp={() => {}}
          handleSnapshot={handleSnapshot}
        />
      </TabPanel>
      {poolWhitelistIndex && (
        <TabPanel value={value} index={poolWhitelistIndex}>
          <Whitelist whitelistedUsers={[]} poolId={id} pool={pool} />
        </TabPanel>
      )}

      <TabPanel value={value} index={poolWithdrawIndex}>
        <PoolWithdrawal pool={pool} setLoading={setLoading} />
      </TabPanel>
      {poolAllocationIndex && (
        <TabPanel value={value} index={poolAllocationIndex}>
          <PoolTiers pool={pool} />
        </TabPanel>
      )}
      {poolTimingIndex && (
        <TabPanel value={value} index={poolTimingIndex}>
          <PoolTiming
            pool={pool}
            loading={loading}
            fetchPool={fetchPool}
            setLoading={setLoading}
            syncAndFetchPool={syncAndFetchPool}
          />
        </TabPanel>
      )}
      {poolParticipantsIndex && (
        <TabPanel value={value} index={poolParticipantsIndex}>
          <PoolParticipants
            pool={pool}
            loading={loading}
            isVerified={isVerified}
            setLoading={setLoading}
          />
        </TabPanel>
      )}
    </>
  );
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          <Typography component={'div'}>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: any) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export { ReadPool };
