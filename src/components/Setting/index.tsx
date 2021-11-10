import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import { useTheme } from '@material-ui/core/styles';
import { useEffect, useState } from 'react';
import { useAlert, useConnection } from '../../hooks';
import { Actions, ICommonSetting } from '@gamify/onchain-program-sdk';
import { PublicKey } from '@solana/web3.js';
import {
  Backdrop,
  Button,
  CardActions,
  CircularProgress,
  TextField,
} from '@material-ui/core';
import useStyles from './styles';
import { useWallet } from '@solana/wallet-adapter-react';
import { sendSignedTransaction } from '../../shared/helper';

const Setting: React.FC = () => {
  const [commonSetting, setPool] = useState<ICommonSetting>(defaultSetting);
  const { connection } = useConnection();
  const classes = useStyles();
  const theme = useTheme();

  const [loading, setLoading] = useState<boolean>(false);

  const { publicKey, signTransaction } = useWallet();
  const { alertSuccess, alertError } = useAlert();

  // Fee
  const [fee, setFees] = useState(0);
  const [isFeeInputError, setIsFeeError] = useState(false);
  const [feeInputError, setFeeInputError] = useState('');
  const [isFeeEditMode, setIsFeeEditMode] = useState(false);

  // Admin
  const [isChangeAdminEditMode, setIsChangeAdminEditMode] = useState(false);
  const [isAdminInputError, setIsAdminInputError] = useState(false);
  const [adminInputError, setAdminInputError] = useState('');
  const [admin, setAdmin] = useState('');

  // Vote
  const [maxVotingDays, setMaxVotingDays] = useState(0);
  const [isMaxVotingDaysInputError, setIsMaxVotingDaysInputError] =
    useState(false);
  const [maxVotingDaysInputError, setMaxVotingDaysInputError] = useState('');

  const [requiredAbsoluteVote, setRequiredAbsoluteVote] = useState(0);
  const [
    isRequiredAbsoluteVoteInputError,
    setIsRequiredAbsoluteVoteInputError,
  ] = useState(false);
  const [requiredAbsoluteVoteInputError, setRequiredAbsoluteVoteInputError] =
    useState('');

  const [tokenVotingPowerRate, setTokenVotingPowerRate] = useState(0);
  const [
    isTokenVotingPowerRateInputError,
    setIsTokenVotingPowerRateInputError,
  ] = useState(false);
  const [tokenVotingPowerRateInputError, setTokenVotingPowerRateInputError] =
    useState('');

  const [isVoteSettingEditMode, setIsVoteSettingEditMode] = useState(false);

  const readCommonSetting = async () => {
    setLoading(true);
    const action = new Actions(connection);
    setPool(await action.readCommonSettingByProgramId());
    setLoading(false);
  };
  useEffect(() => {
    readCommonSetting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    setLoading(false);
  };

  const handleChangeAdminEditMode = () => {
    setAdmin(commonSetting.admin);
    setAdminInputError('');
    setIsAdminInputError(false);
    setIsChangeAdminEditMode(!isChangeAdminEditMode);
  };

  const handlesFeeEditMode = () => {
    setFees(commonSetting.fees);
    setIsFeeEditMode(!isFeeEditMode);
    setFeeInputError('');
    setIsFeeError(false);
  };

  useEffect(() => {
    const tranformValue = async () => {
      if (!commonSetting?.is_initialized) {
        return;
      }

      setFees(commonSetting.fees);
      setMaxVotingDays(commonSetting.vote_setting.max_voting_days);
      setRequiredAbsoluteVote(
        commonSetting.vote_setting.required_absolute_vote
      );
      setTokenVotingPowerRate(
        commonSetting.vote_setting.token_voting_power_rate
      );

      if (commonSetting.admin) {
        setAdmin(commonSetting.admin);
      }
    };

    tranformValue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonSetting]);

  const changeSuperAdmin = async () => {
    if (isAdminInputError) {
      return;
    }
    try {
      setLoading(true);

      const action = new Actions(connection);

      if (!publicKey) {
        alertError('You must connect wallet to create pool');
        setLoading(false);
        return;
      }
      const { transaction } = await action.transferSuperAdmin(
        publicKey,
        new PublicKey(admin)
      );
      const signedTx = await signTransaction!(transaction);
      await sendSignedTransaction(connection, signedTx.serialize());
      alertSuccess('Update successfully');
    } catch (error: any) {
      console.log(error);
      alertError(error.message);
    } finally {
      await readCommonSetting();
      setLoading(false);
    }
  };

  const changeFee = async () => {
    if (isFeeInputError) {
      return;
    }

    try {
      setLoading(true);

      const action = new Actions(connection);

      if (!publicKey) {
        alertError('You must connect wallet to create pool');
        setLoading(false);
        return;
      }
      const { transaction } = await action.updateFeeSetting(publicKey, fee);
      const signedTx = await signTransaction!(transaction);
      await sendSignedTransaction(connection, signedTx.serialize());
      alertSuccess('Update successfully');
    } catch (error: any) {
      console.log(error);
      alertError(error.message);
    } finally {
      await readCommonSetting();
      setLoading(false);
    }
  };

  const onchangeAdmin = async (event: any) => {
    const value = event.target.value;
    setAdmin(value);
    if (value === '') {
      setAdminInputError('This field is required');
      setIsAdminInputError(true);
    } else {
      try {
        const acc = await connection.getAccountInfo(new PublicKey(value || ''));
        if (acc) {
          setAdminInputError('');
          setIsAdminInputError(false);
        } else {
          setAdminInputError('Invalid account');
          setIsAdminInputError(true);
        }
      } catch (error) {
        console.log(error);
        setAdminInputError('Invalid account');
        setIsAdminInputError(true);
      }
    }
  };

  const onchangeFee = (event: any) => {
    const value = event.target.value;
    setFees(value);

    if (value === '') {
      setFeeInputError('This field is required');
      setIsFeeError(true);
    } else if (value < 0) {
      setFeeInputError('Fee cannot less than 0');
      setIsFeeError(true);
    } else if (value > 100) {
      setFeeInputError('Fee cannot greater than 100');
      setIsFeeError(true);
    } else {
      setFeeInputError('');
      setIsFeeError(false);
    }
  };

  const onchangeMaxVotingDays = (event: any) => {
    const value = event.target.value;
    setMaxVotingDays(value);

    if (value === '') {
      setMaxVotingDaysInputError('This field is required');
      setIsMaxVotingDaysInputError(true);
    } else if (value < 0) {
      setMaxVotingDaysInputError(
        'Maximum days for voting period cannot be less than 0'
      );
      setIsMaxVotingDaysInputError(true);
    } else if (!Number.isInteger(+value)) {
      setMaxVotingDaysInputError(
        'Maximum days for voting period must be integer'
      );
      setIsMaxVotingDaysInputError(true);
    } else {
      setMaxVotingDaysInputError('');
      setIsMaxVotingDaysInputError(false);
    }
  };

  const onchangeRequiredAbsoluteVote = (event: any) => {
    const value = event.target.value;
    setRequiredAbsoluteVote(value);
    if (value === '') {
      setRequiredAbsoluteVoteInputError('This field is required');
      setIsRequiredAbsoluteVoteInputError(true);
    } else if (value < 0) {
      setRequiredAbsoluteVoteInputError(
        'Number of Absolute votes required to activate pool cannot less than 0'
      );
      setIsRequiredAbsoluteVoteInputError(true);
    } else if (!Number.isInteger(+value)) {
      setRequiredAbsoluteVoteInputError(
        'Number of Absolute votes required to activate pool must be integer'
      );
      setIsRequiredAbsoluteVoteInputError(true);
    } else {
      setRequiredAbsoluteVoteInputError('');
      setIsRequiredAbsoluteVoteInputError(false);
    }
  };

  const onchangeTokenVotingPowerRate = (event: any) => {
    const value = event.target.value;
    setTokenVotingPowerRate(value);
    if (value === '') {
      setTokenVotingPowerRateInputError('This field is required');
      setIsTokenVotingPowerRateInputError(true);
    } else if (value < 0) {
      setTokenVotingPowerRateInputError(
        'Voting Power equal to (ISOLA) cannot be less than 0'
      );
      setIsTokenVotingPowerRateInputError(true);
    } else if (!Number.isInteger(+value)) {
      setTokenVotingPowerRateInputError('Penalty percentage must be integer');
      setIsTokenVotingPowerRateInputError(true);
    } else {
      setTokenVotingPowerRateInputError('');
      setIsTokenVotingPowerRateInputError(false);
    }
  };

  const changeVoteSetting = async () => {
    if (
      isRequiredAbsoluteVoteInputError ||
      isMaxVotingDaysInputError ||
      isTokenVotingPowerRateInputError
    ) {
      return;
    }

    try {
      setLoading(true);

      const action = new Actions(connection);

      if (!publicKey) {
        alertError('You must connect wallet to update vote setting');
        setLoading(false);
        return;
      }
      const { transaction } = await action.updateVoteSetting(publicKey, {
        is_enabled: false,
        max_voting_days: maxVotingDays,
        required_absolute_vote: requiredAbsoluteVote,
        token_voting_power_rate: tokenVotingPowerRate,
      });
      const signedTx = await signTransaction!(transaction);
      await sendSignedTransaction(connection, signedTx.serialize());
      alertSuccess('Update successfully');
    } catch (error: any) {
      console.log(error);
      alertError(error.message);
    } finally {
      await readCommonSetting();
      setLoading(false);
    }
  };

  const handlesPenaltyRulesEditMode = () => {
    setMaxVotingDays(commonSetting.vote_setting.max_voting_days);
    setRequiredAbsoluteVote(commonSetting.vote_setting.required_absolute_vote);
    setTokenVotingPowerRate(commonSetting.vote_setting.token_voting_power_rate);
    setMaxVotingDaysInputError('');
    setIsMaxVotingDaysInputError(false);
    setIsVoteSettingEditMode(!isVoteSettingEditMode);
    setRequiredAbsoluteVoteInputError('');
    setIsRequiredAbsoluteVoteInputError(false);
    setTokenVotingPowerRateInputError('');
    setIsTokenVotingPowerRateInputError(false);
  };

  return (
    <>
      <Backdrop
        className={classes.backdrop}
        open={loading}
        onClick={handleClose}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Card style={{ marginBottom: theme.spacing(2) }}>
        <CardHeader title="Fee setting" />

        <CardContent>
          <TextField
            required
            label={'Fee'}
            error={Boolean(isFeeInputError)}
            fullWidth
            inputProps={{ readOnly: !isFeeEditMode }}
            type="number"
            helperText={feeInputError}
            onChange={onchangeFee}
            value={fee}
            variant={'outlined'}
          />
          <CardActions
            classes={{
              root: classes.cardActions,
            }}
          >
            {isFeeEditMode && (
              <Button
                size="large"
                variant="contained"
                color="primary"
                disabled={loading}
                onClick={() => {
                  changeFee();
                }}
              >
                {loading ? 'LOADING' : 'CHANGE'}
              </Button>
            )}
            {!isFeeEditMode && (
              <Button
                style={{ margin: theme.spacing(2) }}
                size="large"
                variant="contained"
                color="primary"
                disabled={loading}
                onClick={handlesFeeEditMode}
              >
                {loading ? 'LOADING' : 'EDIT'}
              </Button>
            )}
            {isFeeEditMode && (
              <Button
                size="large"
                style={{ margin: theme.spacing(2) }}
                variant="contained"
                color="primary"
                disabled={loading}
                onClick={handlesFeeEditMode}
              >
                {loading ? 'LOADING' : 'CANCEL'}
              </Button>
            )}
          </CardActions>
        </CardContent>
      </Card>

      {false && (
        <Card style={{ marginBottom: theme.spacing(2) }}>
          <CardHeader title="Voting Settings" />

          <CardContent>
            <TextField
              required
              label={'Maximum days for voting period'}
              error={Boolean(isMaxVotingDaysInputError)}
              fullWidth
              inputProps={{ readOnly: !isVoteSettingEditMode }}
              type="number"
              helperText={maxVotingDaysInputError}
              onChange={onchangeMaxVotingDays}
              value={maxVotingDays}
              variant={'outlined'}
            />
            <CardActions
              classes={{
                root: classes.cardActions,
              }}
            ></CardActions>
          </CardContent>

          <CardContent>
            <TextField
              required
              label={'Number of Absolute votes required to activate pool'}
              type="number"
              error={Boolean(isRequiredAbsoluteVoteInputError)}
              fullWidth
              inputProps={{ readOnly: !isVoteSettingEditMode }}
              helperText={requiredAbsoluteVoteInputError}
              onChange={onchangeRequiredAbsoluteVote}
              value={requiredAbsoluteVote}
              variant={'outlined'}
            />
            <CardActions
              classes={{
                root: classes.cardActions,
              }}
            ></CardActions>
          </CardContent>

          <CardContent>
            <TextField
              required
              label={'Voting Power equal to (ISOLA)'}
              type="number"
              error={Boolean(isTokenVotingPowerRateInputError)}
              fullWidth
              inputProps={{ readOnly: !isVoteSettingEditMode }}
              helperText={tokenVotingPowerRateInputError}
              onChange={onchangeTokenVotingPowerRate}
              value={tokenVotingPowerRate}
              variant={'outlined'}
            />
            <CardActions
              classes={{
                root: classes.cardActions,
              }}
            >
              {isVoteSettingEditMode && (
                <Button
                  size="large"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  onClick={() => {
                    changeVoteSetting();
                  }}
                >
                  {loading ? 'LOADING' : 'CHANGE'}
                </Button>
              )}
              {!isVoteSettingEditMode && (
                <Button
                  style={{ margin: theme.spacing(2) }}
                  size="large"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  onClick={handlesPenaltyRulesEditMode}
                >
                  {loading ? 'LOADING' : 'EDIT'}
                </Button>
              )}
              {isVoteSettingEditMode && (
                <Button
                  size="large"
                  style={{ margin: theme.spacing(2) }}
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  onClick={handlesPenaltyRulesEditMode}
                >
                  {loading ? 'LOADING' : 'CANCEL'}
                </Button>
              )}
            </CardActions>
          </CardContent>
        </Card>
      )}

      <Card style={{ marginBottom: theme.spacing(2) }}>
        <CardHeader title="Super admin" />
        <CardContent>
          <TextField
            required
            label={'Admin'}
            error={Boolean(isAdminInputError)}
            fullWidth
            inputProps={{ readOnly: !isChangeAdminEditMode }}
            helperText={adminInputError}
            onChange={onchangeAdmin}
            value={admin}
            variant={'outlined'}
          />
          <CardActions
            classes={{
              root: classes.cardActions,
            }}
          >
            {isChangeAdminEditMode && (
              <Button
                size="large"
                variant="contained"
                color="primary"
                disabled={loading}
                onClick={() => {
                  changeSuperAdmin();
                }}
              >
                {loading ? 'LOADING' : 'CHANGE'}
              </Button>
            )}
            {!isChangeAdminEditMode && (
              <Button
                style={{ margin: theme.spacing(2) }}
                size="large"
                variant="contained"
                color="primary"
                disabled={loading}
                onClick={handleChangeAdminEditMode}
              >
                {loading ? 'LOADING' : 'EDIT'}
              </Button>
            )}
            {isChangeAdminEditMode && (
              <Button
                style={{ margin: theme.spacing(2) }}
                size="large"
                variant="contained"
                color="primary"
                disabled={loading}
                onClick={handleChangeAdminEditMode}
              >
                {loading ? 'LOADING' : 'CANCEL'}
              </Button>
            )}
          </CardActions>
        </CardContent>
      </Card>
    </>
  );
};

const defaultSetting: ICommonSetting = {
  is_initialized: true,
  version: 0,
  fees: 0,
  admin: '',
  vote_setting: {
    max_voting_days: 7,
    required_absolute_vote: 200,
    token_voting_power_rate: 100,
    is_enabled: false,
  },
};

export default Setting;
