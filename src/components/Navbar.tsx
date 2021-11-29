import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { WalletDialogProvider } from '@solana/wallet-adapter-material-ui';
import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useHistory, useLocation } from 'react-router-dom';
import { useConnection, useAuth } from '../hooks';
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

const links = [
  {
    href: '/wallet',
    value: 0,
  },
  {
    href: '/pools',
    value: 1,
  },
  {
    href: '/stake',
    value: 2,
  },
  {
    href: '/setting',
    value: 3,
  },
];

const Navbar: React.FC = ({ ...rest }) => {
  const { connection } = useConnection();
  const theme = useTheme();
  const [blockTime, setBlockTime] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { cluster, changeCluster } = useAuth();
  const [value, setValue] = React.useState(0);
  const location = useLocation();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

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
            <LinkTab label="Home Admin" href="/wallet" />
            <LinkTab label="Pools" href="/pools" />
            <LinkTab label="Staking" href="/stake" />
            <LinkTab label="Settings" href="/setting" />
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
          <Button
            aria-controls="simple-menu"
            aria-haspopup="true"
            onClick={handleClick}
            className="switch-cluster-btn"
          >
            {cluster?.toUpperCase() || 'DEVNET'}
          </Button>

          <Menu
            id="simple-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={() => changeCluster('mainnet-beta')}>
              https://solana-api.projectserum.com
            </MenuItem>
            <MenuItem onClick={() => changeCluster('testnet')}>
              https://api.testnet.solana.com
            </MenuItem>
            <MenuItem onClick={() => changeCluster('devnet')}>
              https://api.devnet.solana.com
            </MenuItem>
          </Menu>
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
