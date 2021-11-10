import {
  BrowserRouter,
  Redirect,
  Route,
  RouteProps,
  Switch,
} from 'react-router-dom';
import Login from './components/Auth/Login';
import GlobalStyles from './components/GlobalStyles';
import Layout from './components/Layout';
import { useAuth } from './hooks';
import { routes } from './utils/routes';
import queryString from 'query-string';

interface ProtectedRouteProps extends RouteProps {
  isAuthenticated: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  component: Component,
  isAuthenticated,
  ...rest
}) =>
  isAuthenticated ? (
    <Route {...rest} component={Component} />
  ) : window.location.pathname === '/logout' ? (
    <Redirect to={{ pathname: '/login' }} />
  ) : (
    <Redirect
      to={{
        pathname: '/login',
        search: `redirectUrl=${window.location.pathname}`,
      }}
    />
  );

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const redirectUrl =
    (queryString.parse(window.location.search).redirectUrl as string) ||
    '/wallet';
  return (
    <BrowserRouter>
      <GlobalStyles />
      <Switch>
        <Route
          path="/login"
          exact
          render={() =>
            isAuthenticated ? <Redirect to={redirectUrl} /> : <Login />
          }
        />
        <Route path="/">
          <Layout>
            <Switch>
              {routes.map(({ path, exact, component: Component }) => (
                <ProtectedRoute
                  key={path}
                  path={path}
                  exact={exact}
                  component={Component}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </Switch>
          </Layout>
        </Route>
      </Switch>
    </BrowserRouter>
  );
};
export default App;
