import { NavLink as RouterLink } from 'react-router-dom';
import clsx from 'clsx';

import { makeStyles, Theme } from '@material-ui/core/styles';
import Icon from '@material-ui/core/Icon';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';

const useStyles = makeStyles((theme: Theme) => ({
  active: {
    backgroundColor: `${theme.palette.primary.main} !important`,
    color: '#fff',
    boxShadow: theme.shadows[4],
    borderRadius: 4,
    '& .MuiListItemIcon-root': {
      color: '#fff',
    },
    '&:hover': {
      backgroundColor: `${theme.palette.primary.light} !important`,
    },
  },
  icon: {
    marginRight: 0,
    color: theme.palette.primary.dark,
  },
  iconSelected: {
    color: '#fff',
  },
}));

type Props = {
  href: string;
  icon: JSX.Element;
  title: string;
  active?: boolean;
  onClick?(): void;
};

const NavItem: React.FC<Props> = ({ href, icon, title, active, ...rest }) => {
  const classes = useStyles();

  return (
    <ListItem button component={RouterLink} to={href} activeClassName={classes.active} {...rest}>
      {icon && (
        <ListItemIcon>
          <Icon
            className={clsx(classes.icon, {
              [classes.iconSelected]: active,
            })}
          >
            {icon}
          </Icon>
        </ListItemIcon>
      )}
      <ListItemText primary={title} />
    </ListItem>
  );
};

export default NavItem;
