import MomentUtils from '@date-io/moment';
import { yupResolver } from '@hookform/resolvers/yup';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import MenuItem from '@material-ui/core/MenuItem';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import CardHeader from '@material-ui/core/CardHeader';
import Typography from '@material-ui/core/Typography';
import { useTheme } from '@material-ui/core/styles';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import FormHelperText from '@material-ui/core/FormHelperText';
import { useEffect, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { SubmitHandler, useForm } from 'react-hook-form';
import { BsFiles } from 'react-icons/bs';
import { useHistory } from 'react-router-dom';
import { useAlert, useConnection, useDebounce } from '../../hooks';
import * as Types from '../../types';
import { getTokenInfo } from '../../utils/solana-api';
import { poolValidator } from '../../utils/validators';
import CheckBoxInput from '../common/form/CheckBoxInput';
import CheckBoxInputV2 from '../common/form/CheckBoxInputV2';
import DateInput from '../common/form/DateInput';
import DateInputV2 from '../common/form/DateInputV2';
import Input from '../common/form/Input';
import InputV2 from '../common/form/InputV2';
import useStyles from './styles';
import { DEFAULT_POOL_LOGO_URL } from '../../utils/constants';
import { getConnection, isEmpty } from '../../shared/helper';
import { PoolInputLabel } from './constants';
import { useWallet } from '@solana/wallet-adapter-react';
import NumberInput from '../common/form/NumberFormatInput';
import NumberInputV2 from '../common/form/NumberFormatInputV2';
import { Actions } from '@gamify/onchain-program-sdk';
import { convertToRaw, EditorState } from 'draft-js';
import RichText from '../common/form/RichText';

type FormValues = Types.Pool & { is_checked_fee_information: boolean };

interface Props {
  pool?: Types.Pool;
  submitBtnText: string;
  submitBtnLoadingText: string;
  loading?: boolean;
  mode?: 'create' | 'update' | 'read';
  tokenAccountInfo?: string;
  handleSubmitProp(data: Partial<FormValues>): void;
  changePoolAdmin?: (newPoolAdmin: string, poolId: string) => void;
  handleSubmitOnchainProp(data: Partial<FormValues>): void;
  handleSubmitOffchainProp(data: Partial<FormValues>): void;
  handleActivate(id?: string): void;
  handleSnapshot?: () => void;
}

const supportedTokens = [{ key: 'SOL', label: 'SOL', value: 'SOL' }];

const defaultValues: FormValues = {
  version: 1,
  logo: '',
  thumbnail: '',
  name: '',
  website: '',
  twitter: '',
  telegram: '',
  token_economic: '',
  description: '',
  medium: '',
  tag_line: '',
  pool_start: new Date().toISOString(),
  join_pool_start: new Date().toISOString(),
  join_pool_end: new Date().toISOString(),
  contract_address: '',
  token_address: '',
  token_name: '',
  token_symbol: '',
  token_decimals: 0,
  token_total_supply: '0',
  token_liquidity_lock: 0,
  is_initialized: true,
  id: '',
  token_x: '',
  token_y: '',
  token_ratio: 0,
  max_allocation_all_phases: 0,
  claim_at: new Date().toISOString(),
  early_phase_is_active: false,
  platform: '',
  root_admin: '',
  token_to: 'SOL',
  early_phase_max_total_alloc: 0,
  public_phase_max_individual_alloc: 0,
  early_join_duration: 20,
  program_id: '',
  is_active: false,
  audit_link: '',
  liquidity_percentage: 0,
  claimable_percentage: 100,
  fcfs_stake_phase_multiplication_rate: 3,
  fcfs_stake_duration: 30,
  fcfs_stake_phase_is_active: true,
  exclusive_phase_is_active: true,
  exclusive_join_duration: 30,
  exclusive_phase_max_total_alloc: 0,
  fees: 0,
  sold_amount: 0,
  voting_phase_is_active: true,
  voting_start: new Date().toISOString(),
  voting_end: new Date().toISOString(),
  max_voting_days: 0,
  is_enough_vote: false,
  is_checked_fee_information: false,
};

const Pool: React.FC<Props> = ({
  pool,
  submitBtnText,
  submitBtnLoadingText,
  loading = false,
  mode = 'create',
  handleSubmitProp,
  changePoolAdmin,
  handleSubmitOnchainProp,
  handleSubmitOffchainProp,
  handleActivate,
  handleSnapshot,
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const history = useHistory();
  const { connected, publicKey } = useWallet();

  const {
    control,
    setValue,
    watch,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<FormValues>({
    shouldFocusError: true,
    defaultValues,
    reValidateMode: 'onChange',
    resolver: yupResolver(poolValidator),
  });

  const [copied, setCopied] = useState(false);
  const { alertSuccess } = useAlert();
  const onSubmit: SubmitHandler<FormValues> = (data) => {
    return handleSubmitProp(data);
  };
  const onOffchainSubmit: SubmitHandler<FormValues> = (data) => {
    return handleSubmitOffchainProp(data);
  };
  const onOnchainSubmit: SubmitHandler<FormValues> = (data) => {
    return handleSubmitOnchainProp(data);
  };
  const poolLogoUrl = useDebounce(watch('logo') as string, 300);

  const connection = useConnection();
  const readMode = mode === 'read';
  const createMode = mode === 'create';
  // let [toggleEditMode, setToggleEditMode] = useState(mode === 'update');
  const toggleEditMode = mode === 'update';
  const loadTokenInfor = async (address: string) => {
    setValue('token_address', address || '');
    await trigger('token_address');
    const token = await getTokenInfo(connection.connection, address);
    if (token) {
      setValue('token_decimals', token.decimals || 0);
      setValue('token_total_supply', token.supply || '0');
      await trigger('token_decimals');
      await trigger('token_total_supply');
    } else {
      setValue('token_decimals', 0);
      setValue('token_total_supply', '0');
    }
  };
  const [isEnabledVoting, setIsEnabledVoting] = useState(false);
  const [
    isRequreidEarlyPhaseMaxTotalAlloc,
    setIsRequreidEarlyPhaseMaxTotalAlloc,
  ] = useState(true);
  const [
    isRequreidExclusivePhaseMaxTotalAlloc,
    setIsRequreidExclusivePhaseMaxTotalAlloc,
  ] = useState(true);
  const [
    isRequreidFcfsStakePhaseMaxTotalAlloc,
    setIsRequreidFcfsStakePhaseMaxTotalAlloc,
  ] = useState(true);
  const [feeSetting, setFeeSetting] = useState(0);
  const [maxVotingDays, setMaxVotingDays] = useState(0);
  if (readMode) {
    setValue('is_checked_fee_information', true);
  }

  const showTransferAdmin = () => {
    if (toggleEditMode || createMode || readMode) {
      return (
        <div>
          <Card style={{ marginBottom: theme.spacing(2) }}>
            <CardHeader title="POOL ADMIN" />
            <CardContent>
              <InputV2
                required
                control={control}
                label={PoolInputLabel.root_admin}
                name="root_admin"
                isError={Boolean(errors.root_admin)}
                inputProps={{ readOnly: readMode }}
                errorMessage={errors?.root_admin?.message}
                tooltipHelp={PoolInputLabel.root_admin_tooltip}
              />

              {!createMode && !readMode && (
                <CardActions
                  classes={{
                    root: classes.cardActions,
                  }}
                >
                  <Button
                    size="large"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    onClick={() => {
                      if (changePoolAdmin) {
                        changePoolAdmin(
                          getValues('root_admin'),
                          pool?._id as string
                        );
                      }
                    }}
                  >
                    {loading ? 'CHANGING' : 'CHANGE'}
                  </Button>
                </CardActions>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }
  };

  useEffect(() => {
    if (!!publicKey?.toBase58()) {
      if (!getValues('root_admin')) {
        setValue('root_admin', publicKey?.toString() || '');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!pool) return;

    try {
      const {
        _id,
        logo,
        thumbnail,
        contract_address,
        name,
        website,
        token_economic,
        twitter,
        telegram,
        pool_start,
        join_pool_start,
        join_pool_end,
        medium,
        description,
        is_active,
        tag_line,
        token_address,
        token_decimals,
        token_name,
        token_symbol,
        token_total_supply,
        token_liquidity_lock,
        token_x,
        token_y,
        early_join_duration,
        token_to,
        token_ratio,
        early_phase_is_active,
        platform,
        root_admin,
        max_allocation_all_phases,
        claim_at,
        program_id,
        early_phase_max_total_alloc,
        public_phase_max_individual_alloc,
        audit_link,
        liquidity_percentage,
        claimable_percentage,
        fcfs_stake_phase_multiplication_rate,
        fcfs_stake_duration,
        exclusive_phase_is_active,
        exclusive_join_duration,
        exclusive_phase_max_total_alloc,
        fcfs_stake_phase_is_active,
        fees,
        voting_phase_is_active,
        voting_start,
        voting_end,
        max_voting_days,
      } = pool;

      setIsRequreidEarlyPhaseMaxTotalAlloc(early_phase_is_active);
      setIsRequreidExclusivePhaseMaxTotalAlloc(exclusive_phase_is_active);
      setIsRequreidFcfsStakePhaseMaxTotalAlloc(fcfs_stake_phase_is_active);
      setFeeSetting(fees);
      setMaxVotingDays(max_voting_days);

      setValue('_id', _id);
      setValue('logo', logo);
      setValue('thumbnail', thumbnail);
      setValue('contract_address', contract_address);
      setValue('name', name);
      setValue('website', website);
      setValue('token_economic', token_economic);
      setValue('twitter', twitter);
      setValue('telegram', telegram);
      setValue('medium', medium);
      setValue('pool_start', pool_start);
      setValue('join_pool_start', join_pool_start);
      setValue('join_pool_end', join_pool_end);
      setValue('max_allocation_all_phases', max_allocation_all_phases);
      setValue('platform', platform);
      setValue('claim_at', claim_at);
      setValue('description', description);
      setValue('token_address', token_address);
      setValue('early_join_duration', early_join_duration);
      setValue('token_name', token_name);
      setValue('token_symbol', token_symbol);
      setValue('token_decimals', token_decimals);
      setValue('token_liquidity_lock', token_liquidity_lock);
      setValue('token_total_supply', token_total_supply);
      setValue('early_phase_is_active', early_phase_is_active);
      setValue('early_phase_max_total_alloc', early_phase_max_total_alloc);
      setValue(
        'public_phase_max_individual_alloc',
        public_phase_max_individual_alloc
      );
      setValue('token_x', token_x);
      setValue('token_y', token_y);
      setValue('token_to', token_to);
      setValue('token_ratio', token_ratio);
      setValue('root_admin', root_admin);
      setValue('tag_line', tag_line);
      setValue('program_id', program_id);
      setValue('is_active', is_active);
      setValue('audit_link', audit_link);
      setValue('liquidity_percentage', liquidity_percentage);
      setValue('claimable_percentage', claimable_percentage);
      setValue(
        'fcfs_stake_phase_multiplication_rate',
        fcfs_stake_phase_multiplication_rate
      );
      setValue('fcfs_stake_duration', fcfs_stake_duration);
      setValue('exclusive_phase_is_active', exclusive_phase_is_active);
      setValue('exclusive_join_duration', exclusive_join_duration);
      setValue(
        'exclusive_phase_max_total_alloc',
        exclusive_phase_max_total_alloc
      );
      setValue('fcfs_stake_phase_is_active', fcfs_stake_phase_is_active);
      setValue('voting_phase_is_active', voting_phase_is_active);
      setValue('voting_start', voting_start);
      setValue('voting_end', voting_end);
      setValue('max_voting_days', max_voting_days);
      setIsEnabledVoting(voting_phase_is_active);

      const loatTokenInfo = async () => {
        const token = await getTokenInfo(getConnection(), token_address);
        if (token) {
          setValue('token_decimals', token.decimals || 0);
          setValue('token_total_supply', token.supply || '0');
        }
      };
      loatTokenInfo();
    } catch (error) {
      console.log('validate error', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool]);

  useEffect(() => {
    const readCommonSetting = async () => {
      const action = new Actions(connection.connection);
      const commonSetting = await action.readCommonSettingByProgramId();
      setFeeSetting(commonSetting.fees);
      setMaxVotingDays(commonSetting.vote_setting.max_voting_days);
      setValue('max_voting_days', commonSetting.vote_setting.max_voting_days);
      setIsEnabledVoting(commonSetting.vote_setting.is_enabled);
    };
    if (createMode) {
      readCommonSetting();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (copied) {
      alertSuccess('Copied');
      setTimeout(() => {
        setCopied(false);
      }, 3000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copied]);

  const toggleEdit = async () => {
    try {
      if (!toggleEditMode) {
        // eslint-disable-next-line no-restricted-globals
        history.push(`/pools/${pool?.id}/update`);
      } else {
        // eslint-disable-next-line no-restricted-globals
        history.push(`/pools/${pool?.id}`);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <MuiPickersUtilsProvider utils={MomentUtils}>
      <>
        <Card style={{ marginBottom: theme.spacing(2) }}>
          <CardHeader
            classes={{ action: classes.cardHeader }}
            action={
              <>
                {readMode &&
                  pool &&
                  !pool.is_active &&
                  (isEnabledVoting
                    ? new Date(pool.voting_end) < new Date() &&
                      pool.is_enough_vote
                    : true) && (
                    <Button
                      size="large"
                      variant="contained"
                      color="primary"
                      disabled={loading}
                      onClick={() => handleActivate(pool?._id)}
                    >
                      {loading ? submitBtnLoadingText : 'Activate'}
                    </Button>
                  )}
                {readMode &&
                  pool &&
                  pool.exclusive_phase_is_active &&
                  new Date() < new Date(pool.join_pool_start) && (
                    <Button
                      size="large"
                      variant="contained"
                      color="primary"
                      style={{ marginLeft: theme.spacing(2) }}
                      disabled={loading}
                      onClick={() => handleSnapshot!()}
                    >
                      {loading ? submitBtnLoadingText : 'Snapshot'}
                    </Button>
                  )}
                {!createMode && (
                  <Button
                    variant="contained"
                    size="large"
                    color="secondary"
                    disabled={loading}
                    style={{ marginLeft: theme.spacing(2) }}
                    onClick={() => toggleEdit()}
                  >
                    {toggleEditMode ? 'Cancel' : 'Edit'}
                  </Button>
                )}
                <Avatar
                  src={
                    isEmpty(poolLogoUrl) ? DEFAULT_POOL_LOGO_URL : poolLogoUrl
                  }
                  className={classes.avatar}
                >
                  L
                </Avatar>
              </>
            }
            title="OFFCHAIN POOL INFORMATION"
          />
          <CardContent>
            <form className="pool-form">
              <Grid item className={classes.formItem}>
                <InputV2
                  control={control}
                  label={PoolInputLabel.logo}
                  name="logo"
                  inputProps={{ readOnly: readMode }}
                  isError={Boolean(errors?.logo)}
                  errorMessage={errors?.logo?.message}
                  tooltipHelp={PoolInputLabel.logo_tooltip}
                />
              </Grid>
              <Grid item className={classes.formItem}>
                <InputV2
                  control={control}
                  label={PoolInputLabel.thumbnail}
                  name="thumbnail"
                  inputProps={{ readOnly: readMode }}
                  isError={Boolean(errors?.thumbnail)}
                  errorMessage={errors?.thumbnail?.message}
                  tooltipHelp={PoolInputLabel.thumbnail_tooltip}
                />
              </Grid>
              {(toggleEditMode || readMode) && (
                <>
                  <Grid item container className={classes.formItem}>
                    <Grid
                      item
                      style={{ flex: 1, marginRight: theme.spacing(1) }}
                    >
                      <InputV2
                        control={control}
                        disabled
                        label={PoolInputLabel.contract_address}
                        name="contract_address"
                        isError={Boolean(errors?.contract_address)}
                        errorMessage={errors?.contract_address?.message}
                        inputProps={{ readOnly: true }}
                        InputProps={{
                          endAdornment: (
                            <CopyToClipboard
                              text={pool?.contract_address || ''}
                              onCopy={() => setCopied(true)}
                            >
                              <InputAdornment position="start">
                                <IconButton onClick={() => setCopied(true)}>
                                  {copied ? (
                                    <BsFiles color="primary" />
                                  ) : (
                                    <BsFiles />
                                  )}
                                </IconButton>
                              </InputAdornment>
                            </CopyToClipboard>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid
                      item
                      style={{ flex: 1, marginLeft: theme.spacing(1) }}
                    >
                      <InputV2
                        control={control}
                        disabled
                        label={PoolInputLabel.token_y}
                        name="token_y"
                        isError={Boolean(errors?.token_y)}
                        errorMessage={errors?.token_y?.message}
                        inputProps={{ readOnly: true }}
                        InputProps={{
                          endAdornment: (
                            <CopyToClipboard
                              text={pool?.token_y || ''}
                              onCopy={() => setCopied(true)}
                            >
                              <InputAdornment position="start">
                                <IconButton onClick={() => setCopied(true)}>
                                  {copied ? (
                                    <BsFiles color="primary" />
                                  ) : (
                                    <BsFiles />
                                  )}
                                </IconButton>
                              </InputAdornment>
                            </CopyToClipboard>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>
                </>
              )}

              <Grid item container className={classes.formItem}>
                <Grid item style={{ flex: 1, marginRight: theme.spacing(1) }}>
                  <InputV2
                    required
                    control={control}
                    inputProps={{ readOnly: readMode }}
                    label={PoolInputLabel.name}
                    name="name"
                    isError={Boolean(errors?.name)}
                    errorMessage={errors?.name?.message}
                    tooltipHelp={PoolInputLabel.name_tooltip}
                  />{' '}
                </Grid>
                <Grid item style={{ flex: 1, marginLeft: theme.spacing(1) }}>
                  <InputV2
                    control={control}
                    label={PoolInputLabel.tag_line}
                    inputProps={{ readOnly: readMode }}
                    name="tag_line"
                    isError={Boolean(errors?.tag_line)}
                    errorMessage={errors?.tag_line?.message}
                    tooltipHelp={PoolInputLabel.tag_line_tooltip}
                  />
                </Grid>
              </Grid>

              <Grid item container className={classes.formItem}>
                <Grid item style={{ flex: 1, marginRight: theme.spacing(1) }}>
                  <InputV2
                    required
                    control={control}
                    label={PoolInputLabel.website}
                    inputProps={{ readOnly: readMode }}
                    name="website"
                    isError={Boolean(errors?.website)}
                    errorMessage={errors?.website?.message}
                    tooltipHelp={PoolInputLabel.website_tooltip}
                  />
                </Grid>
                <Grid item style={{ flex: 1, marginLeft: theme.spacing(1) }}>
                  <InputV2
                    control={control}
                    label={PoolInputLabel.token_economic}
                    inputProps={{ readOnly: readMode }}
                    name="token_economic"
                    isError={Boolean(errors?.token_economic)}
                    errorMessage={errors?.token_economic?.message}
                    tooltipHelp={PoolInputLabel.token_economic_tooltip}
                  />
                </Grid>
              </Grid>

              <Grid item container className={classes.formItem}>
                <Grid item style={{ flex: 1, marginRight: theme.spacing(1) }}>
                  <InputV2
                    control={control}
                    label={PoolInputLabel.twitter}
                    inputProps={{ readOnly: readMode }}
                    name="twitter"
                    isError={Boolean(errors?.twitter)}
                    errorMessage={errors?.twitter?.message}
                    tooltipHelp={PoolInputLabel.twitter_tooltip}
                  />
                </Grid>
                <Grid
                  item
                  style={{
                    flex: 1,
                    marginLeft: theme.spacing(1),
                    marginRight: theme.spacing(1),
                  }}
                >
                  <InputV2
                    control={control}
                    label={PoolInputLabel.medium}
                    inputProps={{ readOnly: readMode }}
                    name="medium"
                    isError={Boolean(errors?.medium)}
                    errorMessage={errors?.medium?.message}
                    tooltipHelp={PoolInputLabel.medium_tooltip}
                  />
                </Grid>
                <Grid item style={{ flex: 1, marginLeft: theme.spacing(1) }}>
                  <InputV2
                    control={control}
                    inputProps={{ readOnly: readMode }}
                    label={PoolInputLabel.telegram}
                    name="telegram"
                    isError={Boolean(errors?.telegram)}
                    errorMessage={errors?.telegram?.message}
                    tooltipHelp={PoolInputLabel.telegram_tooltip}
                  />
                </Grid>
              </Grid>

              <Grid item container className={classes.formItem}>
                <Grid
                  item
                  style={{ flex: 1 /* , marginRight: theme.spacing(1) */ }}
                >
                  <DateInputV2
                    required
                    disabled={readMode}
                    control={control}
                    name="pool_start"
                    label={PoolInputLabel.pool_start}
                    isError={Boolean(errors?.pool_start)}
                    errorMessage={errors?.pool_start?.message}
                    tooltipHelp={PoolInputLabel.pool_start_tooltip}
                  />
                </Grid>
                {/* <Grid
                  item
                  style={{
                    flex: 1,
                    marginLeft: theme.spacing(1),
                    marginRight: theme.spacing(1),
                  }}
                >
                  <Input
                    control={control}
                    inputProps={{ readOnly: readMode }}
                    label={PoolInputLabel.audit_link}
                    name="audit_link"
                    isError={Boolean(errors?.audit_link)}
                    errorMessage={errors?.audit_link?.message}
                  />
                </Grid>
                <Grid item style={{ flex: 1, marginLeft: theme.spacing(1) }}>
                  <NumberInput
                    onChange={() => trigger('liquidity_percentage')}
                    onValueChange={(values: any) => {
                      setValue('liquidity_percentage', values.floatValue);
                    }}
                    control={control}
                    inputProps={{ readOnly: readMode }}
                    label={PoolInputLabel.liquidity_percentage}
                    name="liquidity_percentage"
                    isError={Boolean(errors?.liquidity_percentage)}
                    errorMessage={errors?.liquidity_percentage?.message}
                  />
                </Grid> */}
              </Grid>

              <Grid item container className={classes.formItem}>
                <NumberInputV2
                  onChange={() => trigger('claimable_percentage')}
                  required
                  control={control}
                  label={PoolInputLabel.claimable_percentage}
                  name="claimable_percentage"
                  isError={Boolean(errors?.claimable_percentage)}
                  errorMessage={errors?.claimable_percentage?.message}
                  inputProps={{ readOnly: readMode }}
                  onValueChange={(values: any) => {
                    setValue('claimable_percentage', values.floatValue);
                  }}
                  tooltipHelp={PoolInputLabel.claimable_percentage_tooltip}
                />
              </Grid>

              <Grid item className={classes.formItem}>
                <RichText
                  control={control}
                  label={PoolInputLabel.description}
                  readOnly={readMode}
                  // inputProps={{ readOnly: readMode }}
                  name="description"
                  isError={Boolean(errors?.description)}
                  errorMessage={errors?.description?.message}
                  tooltipHelp={PoolInputLabel.description_tooltip}
                  defaultValue={getValues('description')}
                  key={Math.floor(Math.random() * 3)}
                  onEditorStateChange={(editorState: EditorState) => {
                    setValue(
                      'description',
                      JSON.stringify(
                        convertToRaw(editorState.getCurrentContent())
                      )
                    );
                  }}
                />
              </Grid>

              <Typography gutterBottom variant="h5">
                Token
              </Typography>

              <Grid item className={classes.formItem}>
                <InputV2
                  required
                  control={control}
                  label={PoolInputLabel.token_address}
                  name="token_address"
                  isError={Boolean(errors?.token_address)}
                  errorMessage={errors?.token_address?.message}
                  inputProps={{ readOnly: toggleEditMode || readMode }}
                  onChange={(event) => loadTokenInfor(event.target.value)}
                  InputProps={{
                    endAdornment: (
                      <CopyToClipboard
                        text={pool?.token_address || ''}
                        onCopy={() => setCopied(true)}
                      >
                        <InputAdornment position="start">
                          <IconButton onClick={() => setCopied(true)}>
                            {copied ? <BsFiles color="primary" /> : <BsFiles />}
                          </IconButton>
                        </InputAdornment>
                      </CopyToClipboard>
                    ),
                  }}
                  tooltipHelp={PoolInputLabel.token_address_tooltip}
                />
              </Grid>

              <Grid item container className={classes.formItem}>
                <Grid item style={{ flex: 1, marginRight: theme.spacing(1) }}>
                  <InputV2
                    required
                    control={control}
                    label={PoolInputLabel.token_name}
                    name="token_name"
                    isError={Boolean(errors?.token_name)}
                    errorMessage={errors?.token_name?.message}
                    inputProps={{ readOnly: readMode }}
                    tooltipHelp={PoolInputLabel.token_name_tooltip}
                  />
                </Grid>
                <Grid
                  item
                  style={{
                    flex: 1,
                    marginLeft: theme.spacing(1),
                    // marginRight: theme.spacing(1),
                  }}
                >
                  <InputV2
                    required
                    control={control}
                    label={PoolInputLabel.token_symbol}
                    name="token_symbol"
                    isError={Boolean(errors?.token_symbol)}
                    errorMessage={errors?.token_symbol?.message}
                    inputProps={{ readOnly: readMode }}
                    tooltipHelp={PoolInputLabel.token_symbol_tooltip}
                  />
                </Grid>
              </Grid>

              <Grid item container className={classes.formItem}>
                <Grid item style={{ flex: 1, marginRight: theme.spacing(1) }}>
                  <NumberInputV2
                    onChange={() => trigger('token_total_supply')}
                    required
                    control={control}
                    label={PoolInputLabel.token_total_supply}
                    name="token_total_supply"
                    isError={Boolean(errors?.token_total_supply)}
                    errorMessage={errors?.token_total_supply?.message}
                    inputProps={{ readOnly: true }}
                    onValueChange={(values: any) => {
                      setValue('token_total_supply', values.floatValue);
                    }}
                    tooltipHelp={PoolInputLabel.token_total_supply_tooltip}
                  />
                </Grid>
                <Grid item style={{ flex: 1, marginLeft: theme.spacing(1) }}>
                  <NumberInputV2
                    onChange={() => trigger('token_decimals')}
                    onValueChange={(values: any) => {
                      setValue('token_decimals', values.floatValue);
                    }}
                    required
                    control={control}
                    label={PoolInputLabel.token_decimals}
                    name="token_decimals"
                    isError={Boolean(errors?.token_decimals)}
                    errorMessage={errors?.token_decimals?.message}
                    inputProps={{ readOnly: true }}
                    tooltipHelp={PoolInputLabel.token_decimals_tooltip}
                  />
                </Grid>
              </Grid>

              {toggleEditMode && (
                <CardActions
                  classes={{
                    root: classes.cardActions,
                  }}
                >
                  <Button
                    size="large"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    onClick={handleSubmit(onOffchainSubmit)}
                  >
                    {loading ? submitBtnLoadingText : 'Save'}
                  </Button>
                </CardActions>
              )}
            </form>
          </CardContent>
        </Card>

        <Card style={{ marginBottom: theme.spacing(2) }}>
          <CardHeader title="ONCHAIN POOL INFORMATION" />
          <CardContent>
            <form>
              <Grid item className={classes.formItem}>
                <CheckBoxInput
                  control={control}
                  disabled
                  label="Active"
                  name="is_active"
                  defaultChecked={false}
                />
              </Grid>
              {isEnabledVoting && (
                <Grid item container className={classes.formItem}>
                  <Grid item style={{ flex: 1, marginRight: theme.spacing(1) }}>
                    <DateInputV2
                      required
                      control={control}
                      disabled={readMode}
                      name="voting_start"
                      label={PoolInputLabel.voting_start}
                      isError={Boolean(errors.voting_start)}
                      errorMessage={errors?.voting_start?.message}
                      tooltipHelp={PoolInputLabel.voting_start_tooltip}
                    />
                  </Grid>
                  <Grid item style={{ flex: 1, marginLeft: theme.spacing(1) }}>
                    <DateInputV2
                      required
                      control={control}
                      name="voting_end"
                      disabled={readMode}
                      label={PoolInputLabel.voting_end_1}
                      isError={Boolean(errors?.voting_end)}
                      errorMessage={errors?.voting_end?.message}
                      tooltipHelp={`${PoolInputLabel.voting_end_1_tooltip}${maxVotingDays}${PoolInputLabel.voting_end_2_tooltip}`}
                    />
                  </Grid>
                </Grid>
              )}

              <Grid item container className={classes.formItem}>
                <Grid item style={{ flex: 1, marginRight: theme.spacing(1) }}>
                  <DateInputV2
                    required
                    control={control}
                    disabled={readMode}
                    name="join_pool_start"
                    label={PoolInputLabel.join_pool_start}
                    isError={Boolean(errors.join_pool_start)}
                    errorMessage={errors?.join_pool_start?.message}
                    tooltipHelp={PoolInputLabel.join_pool_start_tooltip}
                  />
                </Grid>
                <Grid item style={{ flex: 1, marginLeft: theme.spacing(1) }}>
                  <DateInputV2
                    required
                    control={control}
                    name="join_pool_end"
                    disabled={readMode}
                    label={PoolInputLabel.join_pool_end}
                    isError={Boolean(errors?.join_pool_end)}
                    errorMessage={errors?.join_pool_end?.message}
                    tooltipHelp={PoolInputLabel.join_pool_end_tooltip}
                  />
                </Grid>
              </Grid>
              <Grid item container className={classes.formItem}>
                <Grid
                  item
                  style={{ flex: 1 /* , marginRight: theme.spacing(1) */ }}
                >
                  <DateInputV2
                    required
                    control={control}
                    name="claim_at"
                    disabled={readMode}
                    label={PoolInputLabel.claim_at}
                    isError={Boolean(errors?.claim_at)}
                    errorMessage={errors?.claim_at?.message}
                    tooltipHelp={PoolInputLabel.claim_at_tooltip}
                  />
                </Grid>
              </Grid>
              <Grid item container className={classes.formItem}>
                <Grid
                  item
                  style={{ flex: 1, marginRight: theme.spacing(1) }}
                  // xs={6}
                >
                  <NumberInputV2
                    onChange={() => trigger('max_allocation_all_phases')}
                    onValueChange={(values: any) => {
                      setValue('max_allocation_all_phases', values.floatValue);
                    }}
                    required
                    control={control}
                    label={`${
                      PoolInputLabel.max_allocation_all_phases
                    } (${getValues('token_to')})`}
                    name="max_allocation_all_phases"
                    isError={Boolean(errors?.max_allocation_all_phases)}
                    errorMessage={errors?.max_allocation_all_phases?.message}
                    inputProps={{ readOnly: readMode }}
                    tooltipHelp={
                      PoolInputLabel.max_allocation_all_phases_tooltip
                    }
                  />
                </Grid>
                <Grid
                  item
                  style={{ flex: 1, marginRight: theme.spacing(1) }}
                  // xs={6}
                ></Grid>
              </Grid>
              <Grid item container className={classes.formItem}>
                <Grid item style={{ flex: 1, marginRight: theme.spacing(1) }}>
                  <CheckBoxInputV2
                    control={control}
                    disabled={readMode}
                    label={PoolInputLabel.early_phase_is_active}
                    name="early_phase_is_active"
                    defaultChecked={true}
                    onChange={(event) => {
                      setIsRequreidEarlyPhaseMaxTotalAlloc(
                        event.target.checked
                      );
                      setValue('early_phase_is_active', event.target.checked);
                      if (event.target.checked) {
                        setValue(
                          'exclusive_phase_is_active',
                          !event.target.checked
                        );
                        setIsRequreidExclusivePhaseMaxTotalAlloc(
                          !event.target.checked
                        );
                      }
                    }}
                    tooltipHelp={PoolInputLabel.early_phase_is_active_tooltip}
                  />
                </Grid>
                {getValues('early_phase_is_active') && (
                  <Grid item style={{ flex: 1, marginRight: theme.spacing(1) }}>
                    <NumberInputV2
                      onChange={() => trigger('early_join_duration')}
                      onValueChange={(values: any) => {
                        setValue('early_join_duration', values.floatValue);
                      }}
                      required
                      control={control}
                      label={PoolInputLabel.early_join_duration}
                      name="early_join_duration"
                      isError={Boolean(errors?.early_join_duration)}
                      errorMessage={errors?.early_join_duration?.message}
                      inputProps={{ readOnly: readMode }}
                    />
                  </Grid>
                )}
                <Grid item style={{ flex: 1, marginLeft: theme.spacing(1) }}>
                  {getValues('early_phase_is_active') && (
                    <NumberInputV2
                      onChange={() => trigger('early_phase_max_total_alloc')}
                      onValueChange={(values: any) => {
                        setValue(
                          'early_phase_max_total_alloc',
                          values.floatValue
                        );
                      }}
                      required={isRequreidEarlyPhaseMaxTotalAlloc}
                      control={control}
                      label={`${
                        PoolInputLabel.early_phase_max_total_alloc
                      } (${getValues('token_to')})`}
                      name="early_phase_max_total_alloc"
                      isError={Boolean(errors?.early_phase_max_total_alloc)}
                      errorMessage={
                        errors?.early_phase_max_total_alloc?.message
                      }
                      inputProps={{ readOnly: readMode }}
                    />
                  )}
                </Grid>
              </Grid>

              <Grid item container className={classes.formItem}>
                <Grid item style={{ flex: 1, marginRight: theme.spacing(1) }}>
                  <CheckBoxInputV2
                    control={control}
                    disabled={readMode}
                    label={PoolInputLabel.exclusive_phase_is_active}
                    name="exclusive_phase_is_active"
                    defaultChecked={true}
                    onChange={(event) => {
                      if (event.target.checked) {
                        setIsRequreidEarlyPhaseMaxTotalAlloc(
                          !event.target.checked
                        );
                        setValue(
                          'early_phase_is_active',
                          !event.target.checked
                        );
                      } else {
                        setIsRequreidFcfsStakePhaseMaxTotalAlloc(false);
                        setValue('fcfs_stake_phase_is_active', false);
                      }
                      setIsRequreidExclusivePhaseMaxTotalAlloc(
                        event.target.checked
                      );
                      setValue(
                        'exclusive_phase_is_active',
                        event.target.checked
                      );
                    }}
                    tooltipHelp={
                      PoolInputLabel.exclusive_phase_is_active_tooltip
                    }
                  />
                </Grid>

                {getValues('exclusive_phase_is_active') && (
                  <Grid item style={{ flex: 1, marginRight: theme.spacing(1) }}>
                    <NumberInputV2
                      onChange={() => trigger('exclusive_join_duration')}
                      onValueChange={(values: any) => {
                        setValue('exclusive_join_duration', values.floatValue);
                      }}
                      required
                      control={control}
                      label={PoolInputLabel.exclusive_join_duration}
                      name="exclusive_join_duration"
                      isError={Boolean(errors?.exclusive_join_duration)}
                      errorMessage={errors?.exclusive_join_duration?.message}
                      inputProps={{ readOnly: readMode }}
                    />
                  </Grid>
                )}
                <Grid item style={{ flex: 1, marginLeft: theme.spacing(1) }}>
                  {getValues('exclusive_phase_is_active') && (
                    <NumberInputV2
                      onChange={() =>
                        trigger('exclusive_phase_max_total_alloc')
                      }
                      onValueChange={(values: any) => {
                        setValue(
                          'exclusive_phase_max_total_alloc',
                          values.floatValue
                        );
                      }}
                      required={isRequreidExclusivePhaseMaxTotalAlloc}
                      control={control}
                      label={`${
                        PoolInputLabel.exclusive_phase_max_total_alloc
                      } (${getValues('token_to')})`}
                      name="exclusive_phase_max_total_alloc"
                      isError={Boolean(errors?.exclusive_phase_max_total_alloc)}
                      errorMessage={
                        errors?.exclusive_phase_max_total_alloc?.message
                      }
                      inputProps={{ readOnly: readMode }}
                    />
                  )}
                </Grid>
              </Grid>

              {isRequreidExclusivePhaseMaxTotalAlloc && (
                <Grid item container className={classes.formItem}>
                  <Grid item style={{ flex: 1, marginRight: theme.spacing(1) }}>
                    <CheckBoxInputV2
                      control={control}
                      disabled={readMode}
                      label={PoolInputLabel.fcfs_stake_phase_is_active}
                      name="fcfs_stake_phase_is_active"
                      defaultChecked={true}
                      onChange={(event) => {
                        setIsRequreidFcfsStakePhaseMaxTotalAlloc(
                          event.target.checked
                        );
                        setValue(
                          'fcfs_stake_phase_is_active',
                          event.target.checked
                        );
                      }}
                      tooltipHelp={
                        PoolInputLabel.fcfs_stake_phase_is_active_tooltip
                      }
                    />
                  </Grid>
                  {isRequreidFcfsStakePhaseMaxTotalAlloc && (
                    <>
                      <Grid
                        item
                        style={{ flex: 1, marginRight: theme.spacing(1) }}
                      >
                        <NumberInputV2
                          onChange={() => trigger('fcfs_stake_duration')}
                          onValueChange={(values: any) => {
                            setValue('fcfs_stake_duration', values.floatValue);
                          }}
                          required
                          control={control}
                          label={PoolInputLabel.fcfs_stake_duration}
                          name="fcfs_stake_duration"
                          isError={Boolean(errors?.fcfs_stake_duration)}
                          errorMessage={errors?.fcfs_stake_duration?.message}
                          inputProps={{ readOnly: readMode }}
                        />
                      </Grid>
                      <Grid
                        item
                        style={{ flex: 1, marginLeft: theme.spacing(1) }}
                      >
                        <NumberInputV2
                          onChange={() =>
                            trigger('fcfs_stake_phase_multiplication_rate')
                          }
                          onValueChange={(values: any) => {
                            setValue(
                              'fcfs_stake_phase_multiplication_rate',
                              values.floatValue
                            );
                          }}
                          required
                          control={control}
                          label={`${
                            PoolInputLabel.fcfs_stake_phase_multiplication_rate
                          } (${getValues('token_to')})`}
                          name="fcfs_stake_phase_multiplication_rate"
                          isError={Boolean(
                            errors?.fcfs_stake_phase_multiplication_rate
                          )}
                          errorMessage={
                            errors?.fcfs_stake_phase_multiplication_rate
                              ?.message
                          }
                          inputProps={{ readOnly: readMode }}
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
              )}

              <Grid item container className={classes.formItem}>
                <Grid item style={{ flex: 1, marginRight: theme.spacing(1) }}>
                  <NumberInputV2
                    onChange={() => trigger('token_ratio')}
                    onValueChange={(values: any) => {
                      setValue('token_ratio', values.floatValue);
                    }}
                    required
                    control={control}
                    label={PoolInputLabel.token_ratio}
                    name="token_ratio"
                    isError={Boolean(errors?.token_ratio)}
                    errorMessage={errors?.token_ratio?.message}
                    inputProps={{ readOnly: readMode }}
                    tooltipHelp={PoolInputLabel.token_ratio_tooltip}
                  />
                </Grid>
                <Grid item style={{ flex: 1, marginLeft: theme.spacing(1) }}>
                  <InputV2
                    required
                    control={control}
                    label={PoolInputLabel.token_to}
                    name="token_to"
                    isError={Boolean(errors?.token_to)}
                    errorMessage={errors?.token_to?.message}
                    inputProps={{ readOnly: readMode }}
                    select
                    tooltipHelp={PoolInputLabel.token_to_tooltip}
                  >
                    {supportedTokens.map((dialect) => (
                      <MenuItem key={dialect.value} value={dialect.value}>
                        {dialect.label}
                      </MenuItem>
                    ))}
                  </InputV2>
                </Grid>
              </Grid>
              <Grid item container className={classes.formItem}>
                <NumberInputV2
                  onChange={() => trigger('public_phase_max_individual_alloc')}
                  onValueChange={(values: any) => {
                    setValue(
                      'public_phase_max_individual_alloc',
                      values.floatValue
                    );
                  }}
                  required
                  control={control}
                  label={`${
                    PoolInputLabel.public_phase_max_individual_alloc
                  } (${getValues('token_to')})`}
                  name="public_phase_max_individual_alloc"
                  isError={Boolean(errors?.public_phase_max_individual_alloc)}
                  errorMessage={
                    errors?.public_phase_max_individual_alloc?.message
                  }
                  inputProps={{ readOnly: readMode }}
                  tooltipHelp={
                    PoolInputLabel.public_phase_max_individual_alloc_tooltip
                  }
                />
              </Grid>
              <Grid item container className={classes.formItem}>
                <Grid item style={{ flex: 1, marginRight: theme.spacing(1) }}>
                  <CheckBoxInput
                    control={control}
                    disabled={readMode}
                    label={`Acknowledgement of ${feeSetting}% SOL raised will be kept in platform.`}
                    name="is_checked_fee_information"
                    defaultChecked={false}
                  />
                  <FormHelperText
                    error={Boolean(errors?.is_checked_fee_information)}
                  >
                    {errors?.is_checked_fee_information?.message}
                  </FormHelperText>
                </Grid>
              </Grid>
              {toggleEditMode && (
                <CardActions
                  classes={{
                    root: classes.cardActions,
                  }}
                >
                  <Button
                    size="large"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    onClick={handleSubmit(onOnchainSubmit)}
                  >
                    {loading ? submitBtnLoadingText : 'Save'}
                  </Button>
                </CardActions>
              )}
            </form>
          </CardContent>
        </Card>
        {showTransferAdmin()}

        {createMode && (
          <Grid container justifyContent="center" alignItems="center">
            <Button
              size="large"
              style={{ width: 300 }}
              variant="contained"
              color="primary"
              disabled={loading}
              onClick={handleSubmit(onSubmit)}
            >
              {loading ? submitBtnLoadingText : submitBtnText}
            </Button>
          </Grid>
        )}
      </>
    </MuiPickersUtilsProvider>
  );
};

export default Pool;
