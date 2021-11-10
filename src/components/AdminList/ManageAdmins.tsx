import { createRef } from 'react';
import MaterialTable, { Action, Column, MTableToolbar } from 'material-table';
import { useHistory } from 'react-router-dom';
import { useConfirm } from 'material-ui-confirm';
import LoadingBar from 'react-top-loading-bar';

import {
  useTheme,
  makeStyles,
  createStyles,
  Theme,
} from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Chip from '@material-ui/core/Chip';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

import EditIcon from '@material-ui/icons/Edit';
import DeleteOutline from '@material-ui/icons/DeleteOutline';

import { useAlert, useAsync, useLocalization } from '../../hooks';
import { materialTableConfig } from '../../config';
import * as Types from '../../types';
import * as adminAPI from '../../api/admin';

type RowData = Types.Admin;

interface Props {}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    address: {
      borderRadius: 4,
      width: '100%',
    },
  })
);

const ManageAdmins: React.FC<Props> = () => {
  const theme = useTheme();
  const classes = useStyles();
  const confirm = useConfirm();
  const history = useHistory();
  const { materialTable } = useLocalization();
  const { ref, startLoading, endLoading } = useAsync();
  const { alertSuccess, alertError } = useAlert();
  const tableRef = createRef();
  const primaryColor = theme.palette.primary.main;
  const secondaryColor = theme.palette.secondary.main;

  const handleDeleteAdmin = (id: string) => {
    confirm({ description: 'This action is permanent!' })
      .then(() => {
        startLoading();
        return adminAPI
          .deleteAdmin(id)
          .then(() => {
            alertSuccess('Admin deleted success');
            // tableRef.current && (tableRef.current as any).onQueryChange();
            history.push('/admins');
          })
          .catch((err) => {
            alertError('Can not delete admin');
          })
          .finally(() => {
            endLoading();
          });
      })
      .catch(() => {});
  };

  const actions: Action<RowData>[] = [
    {
      icon: () => <EditIcon />,
      tooltip: 'Edit',
      iconProps: {
        style: { color: primaryColor },
      },
      position: 'row',
      onClick: (e: any, rowData: any) => history.push(`/admins/${rowData._id}`),
    },
    {
      icon: () => <DeleteOutline />,
      tooltip: 'Edit',
      iconProps: {
        style: { color: secondaryColor },
      },
      position: 'row',
      onClick: (e: any, rowData: any) => handleDeleteAdmin(rowData._id),
    },
  ];

  const columns: Column<RowData>[] = [
    {
      title: 'Name',
      field: 'first_name',
    },
    { title: 'Email', field: 'email' },
    {
      title: 'Wallet address',
      field: 'address',
      render: (data) => (
        <Chip label={data.address} className={classes.address} />
      ),
    },
  ];

  return (
    <Grid container direction="column">
      <LoadingBar color={secondaryColor} ref={ref} />
      <Typography variant="h5" gutterBottom>
        Admin Management
      </Typography>

      <MaterialTable
        columns={columns}
        tableRef={tableRef}
        data={(query) => {
          return new Promise((resolve, reject) => {
            adminAPI
              .fetchAdmins({
                search: query.search,
                page: query.page,
                limit: query.pageSize,
              })
              .then((result) => {
                resolve({
                  data: result.docs,
                  page: result.page,
                  totalCount: result.totalDocs,
                });
              });
          });
        }}
        actions={actions}
        options={{ ...materialTableConfig.options }}
        localization={materialTable}
        icons={materialTableConfig.icons}
        components={{
          Toolbar: (props) => (
            <Grid container alignItems="center" justifyContent="space-between">
              <MTableToolbar {...props} />
              <Grid item style={{ paddingRight: theme.spacing(2) }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => history.push('/admins/create')}
                >
                  Add new Admin
                </Button>
              </Grid>
            </Grid>
          ),
        }}
      />
    </Grid>
  );
};

export default ManageAdmins;
