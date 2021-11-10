import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="not-found">
    <div className="fof">
      <h1>404</h1>
      <h3>Sorry, The page you are looking for does not exists</h3>
      <span>
        <Link to="/wallet">Back Home</Link>
      </span>
    </div>
  </div>
);
export default NotFound;
