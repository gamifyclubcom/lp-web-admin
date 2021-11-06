import { toast } from 'react-toastify';
import { FaRegCheckCircle, FaInfoCircle } from 'react-icons/fa';
import { CgDanger } from 'react-icons/cg';
import { AiOutlineWarning } from 'react-icons/ai';

import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    bodyMessage: {
      marginLeft: theme.spacing(1),
    },
    messageSection: {
      display: 'flex',
    },
  })
);

export function useAlert() {
  const classes = useStyles();

  const alertSuccess = (message: string) => {
    toast.success(
      <div className={classes.messageSection}>
        <FaRegCheckCircle />
        <Typography variant="body1" className={classes.bodyMessage}>
          {message}
        </Typography>
      </div>
    , {
      style: {
        width: 'fit-content'
      }
      });
  };

  const alertError = (message: string) => {
    toast.error(
      <div className={classes.messageSection}>
        <CgDanger />

        <Typography variant="body1" className={classes.bodyMessage}>
          {message}
        </Typography>
      </div>,
    {
      style: {
        width: 'fit-content'
      }}
    );
  };

  const alertErrorV2 = (message: string) => {
    toast.error(
      <div className={classes.messageSection}>
        <CgDanger />
        <Typography variant="body1" className={classes.bodyMessage}>
          <div dangerouslySetInnerHTML={{__html: message }} />
        </Typography>
      </div>,
    {
      style: {
        width: 'fit-content'
      }}
    );
  };

  const alertInfo = (message: string) => {
    toast.info(
      <div className={classes.messageSection}>
        <FaInfoCircle />
        <Typography variant="body1" className={classes.bodyMessage}>
          {message}
        </Typography>
      </div>
    );
  };

  const alertWarning = (message: string) => {
    toast.warning(
      <div className={classes.messageSection}>
        <AiOutlineWarning />
        <Typography variant="body1" className={classes.bodyMessage}>
          {message}
        </Typography>
      </div>
    );
  };

  return {
    alertSuccess,
    alertError,
    alertErrorV2,
    alertInfo,
    alertWarning,
  };
}
