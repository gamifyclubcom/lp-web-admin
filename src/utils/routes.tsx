import { Redirect } from 'react-router';
import NotFound from '../components/404';
import AdminCreate from '../components/Admin/Create';
import AdminUpdate from '../components/Admin/Update';
// import AdminList from '../components/AdminList';
import ManageAdmins from '../components/AdminList/ManageAdmins';
import PoolCreate from '../components/Pool/Create';
import ReadPool from '../components/Pool/Read';
import UpdatePool from '../components/Pool/UpdatePool';
import ManagePool from '../components/PoolList/ManagePools';
import Setting from '../components/Setting';
import Tiers from '../components/Stake/Tiers';

export type Route = {
  path: string;
  exact: boolean;
  component: React.FC;
};

export const routes: Route[] = [
  {
    path: '/',
    exact: true,
    component: () => <Redirect to="/pools" />,
  },
  {
    path: '/pools',
    exact: true,
    component: ManagePool,
  },
  {
    path: '/pools/create',
    exact: true,
    component: PoolCreate,
  },
  {
    path: '/pools/:id',
    exact: true,
    component: ReadPool,
  },
  {
    path: '/pools/:id/update',
    exact: true,
    component: UpdatePool,
  },
  {
    path: '/admins',
    exact: true,
    component: ManageAdmins,
  },
  {
    path: '/admins/create',
    exact: true,
    component: AdminCreate,
  },
  {
    path: '/admins/:id',
    exact: true,
    component: AdminUpdate,
  },
  {
    path: '/stake',
    exact: true,
    component: Tiers,
  },
  {
    path: '/setting',
    exact: true,
    component: Setting,
  },
  {
    path: '*',
    exact: true,
    component: NotFound,
  },
];
