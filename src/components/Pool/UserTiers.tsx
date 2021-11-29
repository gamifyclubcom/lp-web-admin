import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import { useEffect, useState } from 'react';
import { useLocalization } from '../../hooks';
import * as Types from '../../types';
import { materialTableConfig } from '../../config';
import MaterialTable, { Column } from 'material-table';
import moment from 'moment';
import Decimal from 'decimal.js';

interface Props {
  pool?: Types.Pool;
}

const defaultValues = [
  {
    no: 1,
    level: 'Level 1',
    weight: 0,
    totalUser: 0,
    maxIndividual: 0,
    totalAmount: 0,
  },
  {
    no: 2,
    level: 'Level 2',
    weight: 0,
    totalUser: 0,
    maxIndividual: 0,
    totalAmount: 0,
  },
  {
    no: 3,
    level: 'Level 3',
    weight: 0,
    totalUser: 0,
    maxIndividual: 0,
    totalAmount: 0,
  },
  {
    no: 4,
    level: 'Level 4',
    weight: 0,
    totalUser: 0,
    maxIndividual: 0,
    totalAmount: 0,
  },
  {
    no: 5,
    level: 'Level 5',
    weight: 0,
    totalUser: 0,
    maxIndividual: 0,
    totalAmount: 0,
  },
];
const PoolTiers: React.FC<Props> = ({ pool }) => {
  const [tiers, setTiers] = useState<RowData[]>(defaultValues);
  const [snapshotTime, setSnapshotTime] = useState('No snapshot yet');
  const [totalExclusiveRound, setTotalExclusiveRound] = useState(0);

  useEffect(() => {
    const tranformValue = () => {
      if (!pool || pool?.version === 1) {
        return;
      }

      if (pool.exclusive_snapshot_time) {
        setSnapshotTime(
          moment(pool.exclusive_snapshot_time).format(
            'MMMM DD yyyy, hh:mm A (UTCZ)'
          )
        );
      }

      setTotalExclusiveRound(pool.exclusive_phase_max_total_alloc);

      setTiers([
        {
          no: 1,
          level: 'Level 1',
          weight: pool!.exclusive_level1!.weight,
          totalUser: pool!.exclusive_level1!.number_of_users,
          maxIndividual: pool!.exclusive_level1!.max_individual_amount,
          totalAmount: new Decimal(pool!.exclusive_level1!.number_of_users)
            .mul(pool!.exclusive_level1!.max_individual_amount)
            .toNumber(),
        },
        {
          no: 2,
          level: 'Level 2',
          weight: pool!.exclusive_level2!.weight,
          totalUser: pool!.exclusive_level2!.number_of_users,
          maxIndividual: pool!.exclusive_level2!.max_individual_amount,
          totalAmount: new Decimal(pool!.exclusive_level2!.number_of_users)
            .mul(pool!.exclusive_level2!.max_individual_amount)
            .toNumber(),
        },
        {
          no: 3,
          level: 'Level 3',
          weight: pool!.exclusive_level3!.weight,
          totalUser: pool!.exclusive_level3!.number_of_users,
          maxIndividual: pool!.exclusive_level3!.max_individual_amount,
          totalAmount: new Decimal(pool!.exclusive_level3!.number_of_users)
            .mul(pool!.exclusive_level3!.max_individual_amount)
            .toNumber(),
        },
        {
          no: 4,
          level: 'Level 4',
          weight: pool!.exclusive_level4!.weight,
          totalUser: pool!.exclusive_level4!.number_of_users,
          maxIndividual: pool!.exclusive_level4!.max_individual_amount,
          totalAmount: new Decimal(pool!.exclusive_level4!.number_of_users)
            .mul(pool!.exclusive_level4!.max_individual_amount)
            .toNumber(),
        },
        {
          no: 5,
          level: 'Level 5',
          weight: pool!.exclusive_level5!.weight,
          totalUser: pool!.exclusive_level5!.number_of_users,
          maxIndividual: pool!.exclusive_level5!.max_individual_amount,
          totalAmount: new Decimal(pool!.exclusive_level5!.number_of_users)
            .mul(pool!.exclusive_level5!.max_individual_amount)
            .toNumber(),
        },
      ]);
    };

    tranformValue();
  }, [pool]);

  return (
    <Card>
      <CardHeader title="Allocation" />
      <CardContent style={{ paddingRight: '5%', paddingLeft: '5%' }}>
        <Grid justifyContent="space-between">
          <Grid>Snapshot time: {snapshotTime}</Grid>
          <Grid>
            Total raise in GMFC exclusive round: {totalExclusiveRound} SOL
          </Grid>
        </Grid>
      </CardContent>
      <CardContent style={{ paddingRight: '5%', paddingLeft: '5%' }}>
        <TiersTable data={tiers} />
      </CardContent>
    </Card>
  );
};

type RowData = {
  no: number;
  level: string;
  weight: number;
  totalUser: number;
  maxIndividual: number;
  totalAmount: number;
};

const TiersTable: React.FC<{ data: RowData[] }> = ({ data }) => {
  const { materialTable } = useLocalization();

  const columns: Column<RowData>[] = [
    {
      title: 'No',
      field: 'no',
      align: 'center',
      width: '50%',
    },
    { title: 'Level', field: 'level', align: 'center' },
    {
      title: 'Pool weight',
      field: 'weight',
      align: 'center',
    },
    { title: 'Total users', field: 'totalUser', align: 'center' },
    {
      title: 'Allocation per user (SOL)',
      field: 'maxIndividual',
      align: 'center',
    },
    { title: 'Total Allocation (SOL)', field: 'totalAmount', align: 'center' },
  ];

  return (
    <Grid container direction="column">
      <Grid style={{}} justifyContent="center">
        <Grid item>
          <MaterialTable
            columns={columns}
            data={data}
            options={{
              ...materialTableConfig.options,
              search: false,
              paging: false,
              toolbar: false,
            }}
            localization={materialTable}
            icons={materialTableConfig.icons}
          />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default PoolTiers;
