import { forwardRef, useContext } from 'react';

import { useTheme, makeStyles } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import IconButton from '@material-ui/core/IconButton';
import Slide from '@material-ui/core/Slide';
import Typography from '@material-ui/core/Typography';
import { TransitionProps } from '@material-ui/core/transitions';

import CloseIcon from '@material-ui/icons/Close';

import { EModalType } from '../enum';
import ModalContext from '../index';

interface Props {
  modalType: EModalType;
  title: string;
  actions?: React.ReactElement;
  modalWidth?: number;
  closeable: boolean;
}

const useStyles = makeStyles((theme) => ({
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
}));

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children?: React.ReactElement<any, any> },
  ref: React.Ref<unknown>
) {
  return <Slide direction="down" ref={ref} {...props} />;
});

const ModalWrapper: React.FC<Props> = ({
  children,
  title,
  closeable,
  actions,
  modalType,
  modalWidth,
  ...rest
}) => {
  const theme = useTheme();
  const classes = useStyles();
  const { checkOpen, closeModal } = useContext(ModalContext);

  const matchesXS = useMediaQuery(theme.breakpoints.down('xs'));

  const status = checkOpen('modal', modalType);

  return (
    <Dialog
      open={status}
      maxWidth="sm"
      fullScreen={matchesXS}
      fullWidth
      TransitionComponent={Transition}
      PaperProps={{
        style: modalWidth ? { width: modalWidth } : undefined,
      }}
      {...rest}
      onClose={closeModal}
    >
      <DialogTitle disableTypography>
        {title && <Typography variant="h6">{title}</Typography>}
        {closeable && (
          <IconButton
            className={classes.closeButton}
            onClick={() => closeModal()}
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
      {actions && <DialogActions>{actions}</DialogActions>}
    </Dialog>
  );
};

export default ModalWrapper;
