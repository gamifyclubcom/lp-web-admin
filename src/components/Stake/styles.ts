import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    formItem: {
      marginBottom: theme.spacing(2),
    },
    backdrop: {
      zIndex: theme.zIndex.drawer + 1,
      color: '#fff',
    },
    divider: {
      marginBottom: theme.spacing(4),
      marginTop: theme.spacing(4),
    },
    cardActions: {
      padding: 0,
      marginTop: theme.spacing(2),
      justifyContent: 'flex-end',
    },
    cardHeader: {
      margin: 0,
      display: 'flex',
      alignItems: 'center',
    },
    avatar: {
      width: 56,
      height: 56,
      boxShadow: theme.shadows[3],
      marginLeft: theme.spacing(2),
    },
  })
);

export default useStyles;
