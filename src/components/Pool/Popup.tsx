import React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  message: string;
  title: string;
  hideConfirm: boolean;
  handleConfirm: () => void;
  cancelButtonText?: string
}

const AlertDialog: React.FC<Props> = ({ open, setOpen, handleConfirm, message, title, hideConfirm, cancelButtonText = 'Cancel' }) => {
  const handleClickOpen = () => {
    handleConfirm();
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        {title !== '' && <DialogTitle id="alert-dialog-title">{title}</DialogTitle>}
        <DialogContent>
          <DialogContentText style={{whiteSpace: "pre-line"}} id="alert-dialog-description">{message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            {cancelButtonText}
          </Button>
          {!hideConfirm && (
            <Button onClick={handleClickOpen} color="primary" autoFocus>
              Confirm
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AlertDialog;
