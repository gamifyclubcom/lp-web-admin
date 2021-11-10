import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import { WalletDialogProvider } from '@solana/wallet-adapter-material-ui';
import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useHistory } from 'react-router-dom';
import { useConnection } from '../hooks';
import { WalletMultiButton } from '../wallet-adapters/connect/WalletMultiButton';
import { useTheme, withStyles, Theme } from '@material-ui/core/styles';

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

const Navbar: React.FC = ({ ...rest }) => {
  const { connection } = useConnection();
  const theme = useTheme();
  const [blockTime, setBlockTime] = useState(0);

  const [value, setValue] = React.useState(0);

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
            <LinkTab label="Gamify Administrator" href="/wallets" />
            <LinkTab label="Pools Management" href="/pools" />
            <LinkTab label="Stake" href="/stake" />
            <LinkTab label="Setting" href="/setting" />
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

          {/* <CurrentWalletBadge /> */}
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

export default Navbar;
