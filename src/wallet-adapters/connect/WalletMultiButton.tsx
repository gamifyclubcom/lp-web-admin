import {
  Button,
  ButtonProps,
  Collapse, createStyles,
  Fade, IconButton,
  ListItemIcon,
  Menu,
  MenuItem, Switch, SwitchClassKey, SwitchProps,
  Theme, withStyles,
} from '@material-ui/core';
import CopyIcon from '@material-ui/icons/FileCopy';
import DisconnectIcon from '@material-ui/icons/LinkOff';
import SwitchIcon from '@material-ui/icons/SwapHoriz';
import {
  useWalletDialog,
  WalletIcon,
} from '@solana/wallet-adapter-material-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import React, { FC, useMemo, useState } from 'react';
import { WalletConnectButton } from './WalletConnectButton';
import { WalletDialogButton } from './WalletDialogButton';
import SwapHorizIcon from '@material-ui/icons/SwapHoriz';

interface Styles extends Partial<Record<SwitchClassKey, string>> {
  focusVisible?: string;
}

interface Props extends SwitchProps {
  classes: Styles;
}

const IOSSwitch = withStyles((theme: Theme) =>
  createStyles({
    root: {
      width: 42,
      height: 26,
      padding: 0,
      margin: theme.spacing(1),
    },
    switchBase: {
      padding: 1,
      '&$checked': {
        transform: 'translateX(16px)',
        color: theme.palette.common.white,
        '& + $track': {
          backgroundColor: '#52d869',
          opacity: 1,
          border: 'none',
        },
      },
      '&$focusVisible $thumb': {
        color: '#52d869',
        border: '6px solid #fff',
      },
    },
    thumb: {
      width: 24,
      height: 24,
    },
    track: {
      borderRadius: 26 / 2,
      border: `1px solid ${theme.palette.grey[400]}`,
      backgroundColor: theme.palette.grey[50],
      opacity: 1,
      transition: theme.transitions.create(['background-color', 'border']),
    },
    checked: {},
    focusVisible: {},
  }),
)(({ classes, ...props }: Props) => {
  return (
    <Switch
      focusVisibleClassName={classes.focusVisible}
      disableRipple
      classes={{
        root: classes.root,
        switchBase: classes.switchBase,
        thumb: classes.thumb,
        track: classes.track,
        checked: classes.checked,
      }}
      {...props}
    />
  );
});

export const WalletMultiButton: FC<ButtonProps> = ({
                                                     color = 'primary',
                                                     variant = 'contained',
                                                     children,
                                                     disabled,
                                                     onClick,
                                                     ...props
                                                   }) => {
  const { publicKey, wallet, disconnect, connected } = useWallet();
  const { setOpen } = useWalletDialog();

  const [anchor, setAnchor] = useState<HTMLElement>();

  const base58 = useMemo(() => publicKey?.toBase58(), [publicKey]);

  const content = useMemo(() => {
    if (children) return children;
    if (!wallet || !base58) return null;
    return base58.substr(0, 4) + '..' + base58.substr(-4, 4);
  }, [children, wallet, base58]);


  const openSelectWallets = () => {
    setOpen(true)
  }

  const handleChange = () => {
    if (connected) {
      disconnect().catch(() => {});
    }
  };

  if (!wallet) {
    return <>
      <div style={{height: '2em', display: 'flex', justifyItems: 'flex-end', alignItems: 'center' }}>
        <IconButton onClick={openSelectWallets} aria-label="delete" color={'default'} style={{height: '100%', color: 'white', display: 'flex', justifyContent: 'center'}}>
          <SwapHorizIcon fontSize="large" />
        </IconButton>
        <WalletDialogButton color={color} variant={variant} {...props} />
        <div>
          <IOSSwitch checked={connected} onChange={handleChange} name="checkedB" />
        </div>
      </div></>;
  }

  if (!base58) {
    return <>
      <div style={{height: '2em', display: 'flex', justifyItems: 'flex-end', alignItems: 'center' }}>
        <IconButton onClick={openSelectWallets} aria-label="delete" color={'default'} style={{height: '100%', color: 'white', display: 'flex', justifyContent: 'center'}}>
          <SwapHorizIcon fontSize="large" />
        </IconButton>
        <WalletConnectButton color={color} variant={variant} {...props} />
        <div>
          <IOSSwitch checked={connected} onChange={handleChange} name="checkedB" />
        </div>
      </div>
      </>;
  }


  return (
    <>
      <div style={{height: '2em', display: 'flex', justifyItems: 'flex-end', alignItems: 'center' }}>
        <IconButton onClick={openSelectWallets} aria-label="delete" color={'default'} style={{height: '100%', color: 'white', display: 'flex', justifyContent: 'center'}}>
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
        <div>
          <IOSSwitch checked={connected} onChange={handleChange} name="checkedB" />
        </div>
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
}
