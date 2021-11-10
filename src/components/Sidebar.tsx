import { useState, useEffect } from 'react';
import { matchPath, useLocation } from 'react-router-dom';

import { makeStyles, Theme } from '@material-ui/core/styles';
import Avatar from '@material-ui/core/Avatar';
import Box from '@material-ui/core/Box';
import Drawer from '@material-ui/core/Drawer';
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import Typography from '@material-ui/core/Typography';
import {
  BsGearFill,
  BsHouseDoorFill,
  BsFillCollectionFill,
  BsExclamationOctagonFill,
} from 'react-icons/bs';
import NavItem from './NavItem';
import { useAuth } from '../hooks';
import { useWallet } from '@solana/wallet-adapter-react';

const items = [
  {
    href: '/wallet',
    icon: <BsHouseDoorFill />,
    title: 'Home',
    active: true,
  },
  {
    href: '/pools',
    icon: <BsFillCollectionFill />,
    title: 'Pools Management',
    active: false,
  },
  // Temporary disable feature which is not in used.
  /*
  {
    href: '/admins',
    icon: <BsShieldLockFill />,
    title: 'Admin Management',
    active: false,
  },
  */
  {
    href: '/stake',
    icon: <BsGearFill />,
    title: 'Stake',
    active: false,
  },
  {
    href: '/setting',
    icon: <BsGearFill />,
    title: 'Setting',
    active: false,
  },
];

const useStyles = makeStyles((theme: Theme) => ({
  box: {
    padding: theme.spacing(2),
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
  boxAvatar: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(2),
  },
}));

const DashboardSidebar: React.FC = () => {
  const classes = useStyles();
  const location = useLocation();
  const [links, setLinks] = useState(items);
  const { logout } = useAuth();
  const { disconnect } = useWallet();

  useEffect(() => {
    setLinks((links) =>
      links.map((link) => ({
        ...link,
        active: !!matchPath(location.pathname, {
          path: link.href,
          exact: false,
          strict: true,
        }),
      }))
    );
  }, [location.pathname]);

  const a = async () => {
    await disconnect();
    logout();
  };

  const content = (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Box className={classes.boxAvatar}>
        <Avatar
          src=""
          style={{
            cursor: 'pointer',
            width: 64,
            height: 64,
          }}
        >
          AD
        </Avatar>
        <Typography color="textPrimary" variant="h5">
          Gamify Administrator
        </Typography>
        <Typography color="textSecondary" variant="body2">
          Administrator
        </Typography>
      </Box>
      <Divider />
      <Box className={classes.box}>
        <List>
          {links.map((item) => (
            <NavItem
              href={item.href}
              key={item.title}
              title={item.title}
              active={item.active}
              icon={item.icon}
            />
          ))}
          <NavItem
            href="/logout"
            title="Logout"
            icon={<BsExclamationOctagonFill />}
            onClick={() => a()}
          />
        </List>
      </Box>
      <Box style={{ flexGrow: 1 }} />
    </Box>
  );

  return (
    <>
      <Drawer
        anchor="left"
        open
        variant="persistent"
        PaperProps={{
          style: { width: 256, top: 64, height: 'calc(100% - 64px)' },
        }}
      >
        {content}
      </Drawer>
    </>
  );
};

export default DashboardSidebar;
