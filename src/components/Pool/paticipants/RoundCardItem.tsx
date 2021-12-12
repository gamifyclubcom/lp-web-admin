import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import NumberFormat from 'react-number-format';
import useStyles from '../styles';

interface Props {
  title: string;
  numberJoinedUser: number;
  totalRaise: number;
  totalSold: number;
}

export const RoundCardItem: React.FC<Props> = ({
  title,
  numberJoinedUser,
  totalRaise,
  totalSold,
}) => {
  const classes = useStyles();

  return (
    <>
      <CardHeader title={title} />
      <CardContent>
        <form>
          <Grid item container className={classes.formItem}>
            <NumberFormat
              thousandSeparator={true}
              customInput={TextField}
              variant={'outlined'}
              disabled
              required
              label={'Total joined users'}
              value={numberJoinedUser}
              fullWidth
            />
          </Grid>
          <Grid item container className={classes.formItem}>
            <NumberFormat
              thousandSeparator={true}
              customInput={TextField}
              variant={'outlined'}
              disabled
              required
              label={'Total raised SOL'}
              value={totalRaise}
              fullWidth
            />
          </Grid>
          <Grid item container className={classes.formItem}>
            <NumberFormat
              thousandSeparator={true}
              customInput={TextField}
              variant={'outlined'}
              disabled
              required
              label={'Total sold amount'}
              value={totalSold}
              fullWidth
            />
          </Grid>
          <Grid item container className={classes.formItem}></Grid>
        </form>
      </CardContent>
    </>
  );
};
