import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Toolbar from '@material-ui/core/Toolbar';
import { WalletDialogProvider } from '@solana/wallet-adapter-material-ui';
import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth, useConnection } from '../hooks';
import { WalletMultiButton } from '../wallet-adapters/connect/WalletMultiButton';

const Navbar: React.FC = ({ ...rest }) => {
  const { cluster, changeCluster } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { connection } = useConnection();
  const [blockTime, setBlockTime] = useState(0);

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

  return (
    <AppBar elevation={0} {...rest}>
      <Toolbar className="header">
        <div className="header__left">
          <RouterLink to="/" className="logo">
            Gamify
          </RouterLink>
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

          <Button aria-controls="simple-menu" aria-haspopup="true" onClick={handleClick} className="switch-cluster-btn">
            {cluster?.toUpperCase() || 'DEVNET'}
          </Button>

          <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
            <MenuItem onClick={() => changeCluster('mainnet-beta')}>https://solana-api.projectserum.com</MenuItem>
            <MenuItem onClick={() => changeCluster('testnet')}>https://api.testnet.solana.com</MenuItem>
            <MenuItem onClick={() => changeCluster('devnet')}>https://api.devnet.solana.com</MenuItem>
          </Menu>
        </div>
      </Toolbar>
    </AppBar>
  );
};

export function displayTimestampUtc(unixTimestamp: number, shortTimeZoneName = false): string {
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
