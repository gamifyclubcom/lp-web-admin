import {
  Button,
  ButtonProps,
  Collapse,
  Fade,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
} from '@material-ui/core';
import CopyIcon from '@material-ui/icons/FileCopy';
import DisconnectIcon from '@material-ui/icons/LinkOff';
import SwitchIcon from '@material-ui/icons/SwapHoriz';
import { useWalletDialog, WalletIcon } from '@solana/wallet-adapter-material-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import React, { FC, useMemo, useState } from 'react';
import { WalletConnectButton } from './WalletConnectButton';
import { WalletDialogButton } from './WalletDialogButton';
import SwapHorizIcon from '@material-ui/icons/SwapHoriz';

export const WalletMultiButtonSingle: FC<ButtonProps> = ({
  color = 'primary',
  variant = 'contained',
  children,
  disabled,
  onClick,
  ...props
}) => {
  const { publicKey, wallet, disconnect } = useWallet();
  const { setOpen } = useWalletDialog();

  const [anchor, setAnchor] = useState<HTMLElement>();

  const base58 = useMemo(() => publicKey?.toBase58(), [publicKey]);

  const content = useMemo(() => {
    if (children) return children;
    if (!wallet || !base58) return null;
    return base58.substr(0, 4) + '..' + base58.substr(-4, 4);
  }, [children, wallet, base58]);

  const openSelectWallets = () => {
    setOpen(true);
  };

  if (!wallet) {
    return (
      <>
        <div
          style={{ height: '2em', marginLeft: '-3em', display: 'flex', justifyItems: 'flex-end', alignItems: 'center' }}
        >
          <IconButton
            onClick={openSelectWallets}
            aria-label="delete"
            color={'primary'}
            style={{ height: '100%', display: 'flex', justifyContent: 'center' }}
          >
            <SwapHorizIcon fontSize="large" />
          </IconButton>
          <WalletDialogButton color={color} variant={variant} {...props} />
        </div>
      </>
    );
  }

  if (!base58) {
    return (
      <>
        <div
          style={{ height: '2em', marginLeft: '-3em', display: 'flex', justifyItems: 'flex-end', alignItems: 'center' }}
        >
          <IconButton
            onClick={openSelectWallets}
            aria-label="delete"
            color={'primary'}
            style={{ height: '100%', display: 'flex', justifyContent: 'center' }}
          >
            <SwapHorizIcon fontSize="large" />
          </IconButton>
          <WalletConnectButton color={color} variant={variant} {...props} />
        </div>
      </>
    );
  }

  return (
    <>
      <div
        style={{ height: '2em', marginLeft: '-3em', display: 'flex', justifyItems: 'flex-end', alignItems: 'center' }}
      >
        <IconButton
          onClick={openSelectWallets}
          aria-label="delete"
          color={'primary'}
          style={{ height: '100%', display: 'flex', justifyContent: 'center' }}
        >
          <SwapHorizIcon fontSize="large" />
        </IconButton>
        <Button
          color={color}
          variant={variant}
          startIcon={<WalletIcon wallet={wallet} />}
          onClick={(event) => setAnchor(event.currentTarget)}
          aria-controls="wallet-menu"
          aria-haspopup="true"
          {...props}
        >
          {content}
        </Button>
      </div>

      <Menu
        id="wallet-menu"
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(undefined)}
        marginThreshold={0}
        TransitionComponent={Fade}
        transitionDuration={250}
        keepMounted
      >
        <MenuItem onClick={() => setAnchor(undefined)} button={false}>
          <Button
            color={color}
            variant={variant}
            startIcon={<WalletIcon wallet={wallet} />}
            onClick={(event) => setAnchor(undefined)}
            fullWidth
            {...props}
          >
            {wallet.name}
          </Button>
        </MenuItem>
        <Collapse in={!!anchor}>
          <MenuItem
            onClick={async () => {
              setAnchor(undefined);
              await navigator.clipboard.writeText(base58);
            }}
          >
            <ListItemIcon>
              <CopyIcon />
            </ListItemIcon>
            Copy address
          </MenuItem>
          <MenuItem
            onClick={() => {
              setAnchor(undefined);
              setOpen(true);
            }}
          >
            <ListItemIcon>
              <SwitchIcon />
            </ListItemIcon>
            Connect a different wallet
          </MenuItem>
          <MenuItem
            onClick={() => {
              setAnchor(undefined);
              // eslint-disable-next-line @typescript-eslint/no-empty-function
              disconnect().catch(() => {});
            }}
          >
            <ListItemIcon>
              <DisconnectIcon />
            </ListItemIcon>
            Disconnect
          </MenuItem>
        </Collapse>
      </Menu>
    </>
  );
};
