import DateFnsUtils from '@date-io/date-fns';
import Button from '@material-ui/core/Button';
import Chip from '@material-ui/core/Chip';
import Grid from '@material-ui/core/Grid';
import {
  createStyles,
  makeStyles,
  Theme,
  useTheme,
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import EditIcon from '@material-ui/icons/Edit';
import {
  KeyboardDatePicker,
  MuiPickersUtilsProvider,
} from '@material-ui/pickers';
import MaterialTable, { Action, Column, MTableToolbar } from 'material-table';
import { createRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import * as poolAPI from '../../api/pool';
import { materialTableConfig } from '../../config';
import { useLocalization } from '../../hooks';
import * as Types from '../../types';
import moment from 'moment';

type RowData = Types.Pool;

interface Props {}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    tokenBadge: {
      borderRadius: 4,
      width: 100,
    },
    tableHeader: {
      marginTop: theme.spacing(2),
    },
  })
);

const ManagePools: React.FC<Props> = () => {
  const theme = useTheme();
  const classes = useStyles();
  const history = useHistory();
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const { materialTable } = useLocalization();
  // const [pools, setPools] = useState<>([])
  const primaryColor = theme.palette.primary.main;

  const actions: Action<RowData>[] = [
    {
      icon: () => <EditIcon />,
      tooltip: 'Edit',
      iconProps: {
        style: { color: primaryColor },
      },
      position: 'row',
      onClick: (e: any, rowData: any) =>
        history.push(`/pools/${rowData._id}/update`),
    },
  ];

  const columns: Column<RowData>[] = [
    {
      title: 'Pool name',
      field: 'name',
    },
    {
      title: 'Join Pool Start',
      field: 'join_pool_start',
      align: 'center',
      type: 'datetime',
      dateSetting: {
        format: `MMMM DD yyyy, hh:mm A (UTCZ)`,
      },
      render: (rowData) =>
        moment(rowData.join_pool_start).format('MMMM DD yyyy, hh:mm A (UTCZ)'),
    },
    {
      title: 'Join Pool End',
      field: 'join_pool_end',
      align: 'center',
      type: 'datetime',
      dateSetting: {
        format: `MMMM DD yyyy, hh:mm A (UTCZ)`,
      },
      render: (rowData) =>
        moment(rowData.join_pool_end).format('MMMM DD yyyy, hh:mm A (UTCZ)'),
    },
    {
      title: 'Token Symbol',
      field: 'token_symbol',
      align: 'center',
      render: (data) => {
        if (!data.token_symbol) {
          return 'N/A';
        }
        return (
          <Chip label={data?.token_symbol} className={classes.tokenBadge} />
        );
      },
    },
  ];

  const tableRef = createRef<any>();

  return (
    <Grid container direction="column">
      <Typography variant="h5" gutterBottom>
        Pool Management
      </Typography>

      <MaterialTable
        tableRef={tableRef}
        columns={columns}
        onRowClick={(_, rowData) => history.push(`/pools/${rowData?._id}`)}
        data={(query) => {
          return new Promise((resolve, reject) => {
            if (toDate) {
              toDate.setHours(0);
              toDate.setMinutes(0);
              toDate.setSeconds(0);
            }
            if (fromDate) {
              fromDate.setHours(0);
              fromDate.setMinutes(0);
              fromDate.setSeconds(0);
            }
            poolAPI
              .fetchPools({
                search: query.search,
                page: query.page,
                limit: query.pageSize,
                ...(toDate && { toDate }),
                ...(fromDate && { fromDate }),
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
        options={{ ...materialTableConfig.options, pageSize: 10 }}
        localization={materialTable}
        icons={materialTableConfig.icons}
        components={{
          Toolbar: (props) => (
            <Grid container alignItems="center" justifyContent="space-between">
              <Grid container xs={8} justifyContent="space-between">
                <Grid justifyContent="center">
                  <MTableToolbar {...props} />
                </Grid>
                <Grid style={{ paddingLeft: '8px' }} justifyContent="center">
                  <MuiPickersUtilsProvider utils={DateFnsUtils}>
                    <Grid container alignItems="center">
                      <KeyboardDatePicker
                        disableToolbar
                        variant="inline"
                        format="MM/dd/yyyy"
                        margin="none"
                        id="date-picker-inline"
                        label="From date"
                        value={fromDate}
                        onChange={(date: any) => {
                          setFromDate(date);
                          tableRef.current.onQueryChange();
                        }}
                        KeyboardButtonProps={{
                          'aria-label': 'change date',
                        }}
                      />
                      <KeyboardDatePicker
                        margin="none"
                        id="date-picker-dialog"
                        label="To date"
                        format="MM/dd/yyyy"
                        value={toDate}
                        onChange={(date: any) => {
                          setToDate(date);
                          tableRef.current.onQueryChange();
                        }}
                        KeyboardButtonProps={{
                          'aria-label': 'change date',
                        }}
                      />
                    </Grid>
                  </MuiPickersUtilsProvider>
                </Grid>
              </Grid>

              <Grid item style={{ padding: theme.spacing(2) }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => history.push('/pools/create')}
                >
                  Create Pool
                </Button>
              </Grid>
            </Grid>
          ),
        }}
      />
    </Grid>
  );
};

export default ManagePools;
