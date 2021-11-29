import './errors.scss';

interface Props {
  code: string | number;
  message: string;
}

const ServerError: React.FC<Props> = ({ code, message }) => (
  <div className="error-container">
    <div className="error">
      <span className="error__code">{code}</span>
      <span className="error__slash">|</span>
      <span className="error__message">{message}</span>
    </div>
  </div>
);

export default ServerError;
