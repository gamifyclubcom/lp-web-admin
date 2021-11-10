import { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Modal from '@material-ui/core/Modal';
import TextField from '@material-ui/core/TextField';

import * as types from '../../types';

function getModalStyle() {
  return {
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  };
}

const useStyles = makeStyles((theme) => ({
  paper: {
    position: 'absolute',
    width: 600,
    height: 250,
    backgroundColor: theme.palette.background.paper,
    border: '1px solid #bbbbb',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
  },
  paper_input: {
    marginTop: 20,
  },
  text_right: {
    textAlign: 'right',
  },
}));

interface Props {
  onSubmit: SubmitHandler<types.TokenInfo>;
  open: boolean;
  handleClose(): void;
}

const AddTokenModal = ({ onSubmit, open, handleClose }: Props) => {
  const [modalStyle] = useState(getModalStyle);
  const classes = useStyles();
  const { register, handleSubmit } = useForm<types.TokenInfo>();

  const body = (
    <div style={modalStyle} className={classes.paper}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="">
          <TextField
            id="outlined-size-small"
            size="small"
            label="Token address"
            variant="outlined"
            fullWidth
            {...register('address')}
          />
        </div>
        <div className={classes.paper_input}>
          <TextField
            id="outlined-size-small"
            size="small"
            label="Token Symbol"
            variant="outlined"
            fullWidth
            {...register('symbol')}
          />
        </div>
        <div className={classes.paper_input}>
          <TextField
            id="outlined-size-small"
            size="small"
            label="Token Name"
            variant="outlined"
            fullWidth
            {...register('name')}
          />
        </div>
        <div className={classes.paper_input + ' ' + classes.text_right}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit(onSubmit)}
          >
            Confirm
          </Button>
        </div>
      </form>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="simple-modal-title"
      aria-describedby="simple-modal-description"
    >
      {body}
    </Modal>
  );
};

export default AddTokenModal;
