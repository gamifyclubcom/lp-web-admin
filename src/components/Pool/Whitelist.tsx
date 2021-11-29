import { Actions } from '@gamify/onchain-program-sdk';
import Backdrop from '@material-ui/core/Backdrop';
import Button from '@material-ui/core/Button';
import Chip from '@material-ui/core/Chip';
import CircularProgress from '@material-ui/core/CircularProgress';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Grid from '@material-ui/core/Grid';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import TablePagination from '@material-ui/core/TablePagination';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { PublicKey } from '@solana/web3.js';
import MaterialTable, { Column } from 'material-table';
import { useState, useRef } from 'react';
import * as poolAPI from '../../api/pool';
import { materialTableConfig } from '../../config';
import { useAlert, useConnection, useLocalization } from '../../hooks';
import * as Types from '../../types';
import { WhitelistUsers } from '../../types';
import { useWallet } from '@solana/wallet-adapter-react';
import { parseTransaction, sendSignedTransaction } from '../../shared/helper';

type RowData = Types.WhitelistedUser;
interface Props {
  whitelistedUsers: WhitelistUsers;
  poolId?: string;
  pool: any;
}

interface ICheckWalletAddress {
  address: PublicKey;
  associatedAddress: PublicKey;
  status: boolean;
}

const useStyles = makeStyles((theme) => ({
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
  },
}));

const Whitelist: React.FC<Props> = ({ whitelistedUsers, poolId, pool }) => {
  const theme = useTheme();
  const { materialTable } = useLocalization();
  const { wallet, connected, connect, publicKey, signTransaction } =
    useWallet();
  const { connection } = useConnection();
  const contractAction = new Actions(connection);

  const columns: Column<RowData>[] = [
    { title: 'User Address', field: 'userAccount' },
    {
      title: 'Is Whitelist',
      field: 'isWhitelisted',
      render: (data) => {
        return data.isWhitelisted ? (
          <Chip label="Whitelisted" color="primary" />
        ) : null;
      },
    },
  ];

  const { alertError } = useAlert();
  const [openBackdrop, preventInteractions] = useState(false);
  const [open, setOpenDialog] = useState(false);
  const [userWalletAddress, setUserWalletAddress] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleClickOpen = async () => {
    if (!connected) {
      await connect();
    }

    if (connected && publicKey?.toBase58() !== pool.root_admin) {
      alertError(
        'You are not admin of this pool. Please try to use another wallet'
      );
      setOpenDialog(false);
      return;
    }

    if (pool.is_active) {
      setOpenDialog(false);
      return alertError(
        'The whitelist cannot be changed after the pool is activated.'
      );
    }

    setUserWalletAddress('');
    setOpenDialog(true);
  };

  const handleDeleteParticipant = async () => {
    const selectedRows = pool?.selectedRows;
    if (!selectedRows?.length) {
      return alertError('Please select at least one participant');
    }
    if (!connected) {
      alertError('Please connect wallet before remove participants');
      setOpenDialog(false);
      return;
    }
    if (connected && publicKey?.toBase58() !== pool.root_admin) {
      alertError(
        'You are not admin of this pool. Please try to use another wallet'
      );
      setOpenDialog(false);
      return;
    }

    let prepareData;
    let listUserAddress;
    let listUserPubKey;
    if (wallet && publicKey) {
      listUserPubKey = selectedRows.map(
        (user: { userAccount: any }) => new PublicKey(user.userAccount)
      );
      listUserAddress = selectedRows.map(
        (user: { userAccount: any }) => user.userAccount
      );
      prepareData = await contractAction.removeMultiUsersFromWhiteList(
        new PublicKey(publicKey),
        new PublicKey(pool.contract_address),
        listUserPubKey
      );
    }

    try {
      preventInteractions(true);
      const tx = await parseTransaction(prepareData.rawTx);
      const signedTx = await signTransaction!(tx);
      await sendSignedTransaction(connection, signedTx.serialize());
      await poolAPI.removeUserToWhitelist({
        poolId: poolId || '',
        userAccounts: listUserAddress,
      });

      preventInteractions(false);
    } catch (e) {
      alertError('Something went wrong. Please try again');
      preventInteractions(false);
      console.log(e);
    } finally {
      tableRef.current && tableRef.current.onQueryChange();
    }
  };

  const handleClose = () => {
    setOpenDialog(false);
    setUserWalletAddress('');
  };

  const classes = useStyles();
  const onChangeWalletAddress = (value: any) => {
    setUserWalletAddress(value.target.value);
  };

  const handleSubmit = async () => {
    if (!publicKey) {
      alertError('Wallet is not connected');
      setOpenDialog(false);
      return;
    }
    if (connected && publicKey?.toBase58() !== pool.root_admin) {
      alertError(
        'You are not admin of this pool. Please try to use another wallet'
      );
      setOpenDialog(false);
      return;
    }
    let listAddress = userWalletAddress
      .replaceAll(/([ ]+)/g, '\n')
      .replaceAll(/([^a-zA-Z0-9\n])/g, '');
    const userWalletAddressParsed: string[] = listAddress
      .replaceAll(/([^a-zA-Z0-9\n])/g, '')
      .split('\n')
      .filter((item: any) => item !== '');
    if (!userWalletAddressParsed.length) {
      return alertError('List of user wallet address is required');
    }
    let removeDuplicate = new Set(userWalletAddressParsed);
    if (removeDuplicate.size < userWalletAddressParsed.length) {
      return alertError('Do not enter duplicate addresses');
    }
    if (userWalletAddressParsed.length > 12) {
      return alertError('Do not enter more than 12 addresses at once.');
    }

    setIsLoading(true);
    let checkUserAddress: ICheckWalletAddress[] = [];

    preventInteractions(true);

    // check whitelistable account's pool associated account info
    for (const address of userWalletAddressParsed) {
      try {
        const isWhitelisted = await contractAction.isAccountWhitelisted(
          new PublicKey(address),
          new PublicKey(pool.contract_address)
        );
        if (!isWhitelisted) {
          checkUserAddress = [
            ...checkUserAddress,
            {
              address: new PublicKey(address),
              associatedAddress: new PublicKey(address),
              status: true,
            },
          ];
        }
      } catch (e: any) {
        setIsLoading(false);
        preventInteractions(false);
        if (e?.message.includes('Invalid public key input')) {
          return alertError(
            'Exist at least address is wrong format. Please check and try again.'
          );
        }
        return alertError('Something went wrong. Please try again later.');
      }
    }

    try {
      const accounts = checkUserAddress.map(
        (item) => new PublicKey(item.address)
      );
      if (accounts.length === 0) {
        return alertError('Already updated');
      }

      let prepareData = await contractAction.addMultiUserToWhiteList(
        publicKey,
        new PublicKey(pool.contract_address),
        accounts
      );

      const tx2 = await parseTransaction(prepareData.rawTx);
      const signedTx2 = await signTransaction!(tx2);
      await sendSignedTransaction(connection, signedTx2.serialize());

      await poolAPI.addUserToWhitelist({
        poolId: poolId || '',
        userAccount: checkUserAddress.map((item) => item.address.toBase58()),
      });

      preventInteractions(false);
      setOpenDialog(false);
    } catch (e) {
      alertError('Something went wrong. Please try again');
      preventInteractions(false);
      setOpenDialog(false);
      console.log(e);
    } finally {
      tableRef.current && tableRef.current.onQueryChange();
      setIsLoading(false);
    }
  };
  const tableRef = useRef<any>();

  return (
    <div>
      <MaterialTable
        tableRef={tableRef}
        columns={columns}
        data={(query) => {
          return new Promise((resolve, reject) => {
            poolAPI
              .indexWhitelistedUsers({
                page: query.page,
                limit: query.pageSize,
                poolId: poolId,
              })
              .then((result) => {
                resolve({
                  data: result.docs,
                  page: result.page,
                  totalCount: result.totalDocs,
                });
              })
              .finally(() => {
                setIsLoading(false);
              });
          });
        }}
        options={{
          ...materialTableConfig.options,
          selection: true,
          rowStyle: (rowData) => ({
            backgroundColor: rowData.tableData.checked ? '#37b15933' : '',
          }),
        }}
        onSelectionChange={(rows) => {
          pool.selectedRows = rows;
        }}
        localization={materialTable}
        icons={materialTableConfig.icons}
        components={{
          Toolbar: (props) => (
            <div>
              <Grid
                container
                alignItems="center"
                justifyContent="space-between"
                style={{ padding: theme.spacing(2) }}
              >
                <Typography variant="h5">WHITELIST MANAGEMENT</Typography>
                <Grid item>
                  <Button
                    size="large"
                    variant="contained"
                    color="primary"
                    onClick={handleClickOpen}
                  >
                    Add participants
                  </Button>
                </Grid>
              </Grid>

              {/* <MTableToolbar {...props} />  */}
              {/* TODO: enhance search in FE vs BE */}
            </div>
          ),
          Pagination: (props) => (
            <div className="paginationComponent d-flex">
              <div style={{ minWidth: 200, marginLeft: 14 }}>
                <Button
                  color="secondary"
                  variant="contained"
                  onClick={handleDeleteParticipant}
                  size="small"
                >
                  DELETE
                </Button>
              </div>
              <TablePagination {...props} />
            </div>
          ),
        }}
      />

      <Backdrop className={classes.backdrop} open={openBackdrop}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <Dialog
        open={open && connected}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">Add user to whitelist</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Add user to whitelist, the address should be an user wallet address
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            multiline
            rows={8}
            value={userWalletAddress}
            onChange={onChangeWalletAddress}
            id="userWalletAddress"
            label="List of user wallet addresses"
            placeholder="Address 1&#13;&#10;Address 2&#13;&#10;Address 3"
            type="text"
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Whitelist;
