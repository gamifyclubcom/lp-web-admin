import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Avatar from '@material-ui/core/Avatar';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

import { DEFAULT_POOL_LOGO_URL } from '../../../utils/constants';

interface Props {
  title: string;
  headerImageUrl?: string;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    logo: {
      width: theme.spacing(5),
      height: theme.spacing(5),
      marginLeft: theme.spacing(2),
      boxShadow: theme.shadows[3],
    },
    section: {
      overflow: 'hidden',
      borderRadius: 8,
      border: `1px solid ${theme.palette.divider}`,
      marginBottom: theme.spacing(2),
      boxShadow: theme.shadows[3],
    },
    sectionHeader: {
      padding: theme.spacing(2),
      backgroundColor: theme.palette.grey[400],
    },
    sectionBody: {
      padding: theme.spacing(2),
    },
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
  })
);

const FormSection: React.FC<Props> = ({ title, children, headerImageUrl }) => {
  const classes = useStyles();

  return (
    <Grid container direction="column" className={classes.section}>
      <Grid item container alignItems="center" justifyContent="space-between" className={classes.sectionHeader}>
        <Typography variant="body1">{title}</Typography>
        {headerImageUrl && (
          <Avatar src={headerImageUrl} className={classes.logo}>
            <img src={DEFAULT_POOL_LOGO_URL} alt="Default logo" />
          </Avatar>
        )}
      </Grid>
      <Grid item container direction="column" className={classes.sectionBody}>
        {children}
      </Grid>
    </Grid>
  );
};

export default FormSection;
