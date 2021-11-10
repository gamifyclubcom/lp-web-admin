import Container from '@material-ui/core/Container';
import Box from '@material-ui/core/Box';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import { BsStar } from 'react-icons/bs';
import * as types from '../../types';
import { useAuth } from '../../hooks';

interface Props {
  address: string | undefined;
  addTokenInfo(data: types.TokenInfo): Promise<void>;
  tokens: types.TokenInfo[];
}

const Wallet: React.FC<Props> = ({ address, tokens }) => {
  const { balance } = useAuth();

  const listTokens = tokens.map((token: types.TokenInfo, index: number) => (
    <div className="item" key={index}>
      <div className="item__icon">
        <BsStar />
      </div>
      <span className="item__token-name">{token.name}</span>
      <span className="item__amount">
        {token.amount} {token.symbol}
      </span>
    </div>
  ));

  return (
    <Container maxWidth="sm">
      <Box style={{ marginTop: 3 }}>
        <Card>
          <CardContent>
            <Box style={{ maxWidth: 600 }} className="wallet">
              <div className="header">
                <span>Wallet Details</span>
              </div>
              <div className="address">
                <p className="address__title">Your current address</p>
                <p className="address__hash">{address}</p>
              </div>
              <div className="balances">
                <span className="balances__title">Your balances</span>
                <div className="balances__list">
                  <div className="item">
                    <div className="item__icon">
                      <BsStar />
                    </div>
                    <span className="item__token-name">SOLANA</span>
                    <span className="item__amount">
                      {balance.formatted} SOL
                    </span>
                  </div>
                  {listTokens}
                </div>
              </div>
              {/* Temporary disable incompleted feature
              <div>
                <Button variant="contained" color="primary" onClick={handleOpen}>
                  Add token
                </Button>
                <AddTokenModal handleClose={handleClose} open={open} onSubmit={onSubmit}></AddTokenModal>
              </div> */}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Wallet;
