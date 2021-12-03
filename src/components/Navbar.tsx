import AppBar from '@material-ui/core/AppBar';
import { Theme, useTheme, withStyles } from '@material-ui/core/styles';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Toolbar from '@material-ui/core/Toolbar';
import { WalletDialogProvider } from '@solana/wallet-adapter-material-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useHistory, useLocation } from 'react-router-dom';
import { useConnection } from '../hooks';
import { useGlobal } from '../hooks/useGlobal';
import { WalletMultiButton } from '../wallet-adapters/connect/WalletMultiButton';

interface LinkTabProps {
  label?: string;
  href?: string;
}

const LinkTab = withStyles((theme: Theme) => ({
  root: {
    textTransform: 'unset',
    minWidth: 'unset',
  },
}))((props: LinkTabProps) => {
  const history = useHistory();

  return (
    <Tab
      component="a"
      onClick={(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        event.preventDefault();
        if (props.href) {
          history.push(props.href);
        }
      }}
      {...props}
    />
  );
});

const links = [
  {
    href: '/pools',
    value: 0,
  },
  {
    href: '/stake',
    value: 1,
  },
  {
    href: '/setting',
    value: 2,
  },
];

const Navbar: React.FC = ({ ...rest }) => {
  const history = useHistory();
  const { connection } = useConnection();
  const theme = useTheme();
  const [blockTime, setBlockTime] = useState(0);
  const [value, setValue] = React.useState(0);
  const location = useLocation();
  const { commonSettings } = useGlobal();

  const { publicKey } = useWallet();
  // const [commonSetting, setCommonSetting] =
  //   useState<ICommonSetting>(defaultSetting);
  const isSupperAdmin = useMemo(() => {
    return publicKey?.toString() === commonSettings?.admin?.toString();
  }, [commonSettings, publicKey]);

  useEffect(() => {
    if (history.location.pathname === '/setting' && !isSupperAdmin) {
      history.push('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.location.pathname, isSupperAdmin]);

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

  useEffect(() => {
    const link = links.filter((link) => {
      return link.href === location.pathname;
    });
    if (link.length > 0) {
      setValue(link[0].value);
    }
  }, [location.pathname]);

  const handleChange = (event: any, newValue: number) => {
    setValue(newValue);
  };

  return (
    <AppBar elevation={0} {...rest}>
      <Toolbar className="header">
        <div className="header__left">
          <RouterLink to="/" className="logo">
            <div
              style={{
                backgroundImage: "url('/images/gamify_logo.svg')",
                backgroundPosition: 'center center',
                backgroundSize: 'cover',
                width: 100,
                height: 28,
                marginRight: theme.spacing(3),
              }}
            />
          </RouterLink>
          <Tabs value={value} onChange={handleChange}>
            <LinkTab label="Pools" href="/pools" />
            <LinkTab label="Staking" href="/stake" />
            {isSupperAdmin ? (
              <LinkTab label="Settings" href="/setting" />
            ) : null}
          </Tabs>
        </div>

        <div className="header__right">
          <div>{displayTimestampUtc(blockTime)}</div>
          <div>
            <WalletDialogProvider>
              <WalletMultiButton
                color={'default'}
                style={{
                  borderRadius: '20px',
                  display: 'flex',
                  justifyContent: 'center',
                  height: '3em',
                }}
              />
            </WalletDialogProvider>
          </div>
        </div>
      </Toolbar>
    </AppBar>
  );
};

export function displayTimestampUtc(
  unixTimestamp: number,
  shortTimeZoneName = false
): string {
  const expireDate = new Date(unixTimestamp);
  const dateString = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(expireDate);
  const timeString = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
    timeZone: 'UTC',
    timeZoneName: shortTimeZoneName ? 'short' : 'long',
  }).format(expireDate);
  return `${dateString} at ${timeString}`;
}

export { Navbar };
