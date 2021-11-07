import Wallet from '../components/Wallet';
import ManagePool from '../components/PoolList/ManagePools';
import PoolCreate from '../components/Pool/Create';
// import AdminList from '../components/AdminList';
import ManageAdmins from '../components/AdminList/ManageAdmins';
import AdminCreate from '../components/Admin/Create';
import AdminUpdate from '../components/Admin/Update';
import ReadPool from '../components/Pool/Read';
import UpdatePool from '../components/Pool/UpdatePool';
import Tiers from '../components/Stake/Tiers';
import Setting from '../components/Setting';
import NotFound from '../components/404';

export type Route = {
  path: string;
  exact: boolean;
  component: React.FC;
};

export const routes: Route[] = [
  {
    path: '/',
    exact: true,
    component: Wallet,
  },
  {
    path: '/wallet',
    exact: true,
    component: Wallet,
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
  }
];
