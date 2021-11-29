import { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';

import Input from '../common/form/Input';
import * as Types from '../../types';
import { adminValidator } from '../../utils/validators';
import FormSection from '../common/form/FormSection';

type Props = {
  admin?: Types.Admin;
  loading: boolean;
  submitBtnText: string;
  submitBtnLoadingText: string;
  handleSubmitProp(data: Partial<FormValues>): void;
};

type FormValues = Partial<Types.Admin>;

const defaultValues: FormValues = {
  avatar: '',
  address: '',
  first_name: '',
  last_name: '',
  email: '',
};

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    logo: {
      width: theme.spacing(5),
      height: theme.spacing(5),
      marginLeft: theme.spacing(2),
      boxShadow: theme.shadows[3],
    },
    section: {
      overflow: 'hidden',
      borderRadius: 8,
      border: `1px solid ${theme.palette.divider}`,
      marginBottom: theme.spacing(2),
      boxShadow: theme.shadows[3],
    },
    sectionHeader: {
      padding: theme.spacing(2),
      backgroundColor: theme.palette.grey[300],
    },
    sectionBody: {
      padding: theme.spacing(2),
    },
    formItem: {
      marginBottom: theme.spacing(2),
    },
  })
);

const Admin = ({
  admin,
  submitBtnText,
  submitBtnLoadingText,
  loading = false,
  handleSubmitProp,
}: Props) => {
  const classes = useStyles();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    shouldFocusError: true,
    defaultValues,
    resolver: yupResolver(adminValidator),
  });
  const onSubmit: SubmitHandler<FormValues> = (data) => handleSubmitProp(data);

  useEffect(() => {
    if (admin) {
      setValue('avatar', admin.avatar || '');
      setValue('address', admin.address || '');
      setValue('first_name', admin.first_name || '');
      setValue('last_name', admin.last_name || '');
      setValue('email', admin.email || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="pool-form">
      <FormSection title="ADMINISTRATOR">
        <Grid item className={classes.formItem}>
          <Input
            control={control}
            label="Avatar"
            name="avatar"
            isError={Boolean(errors?.avatar)}
            errorMessage={errors?.avatar?.message}
          />
        </Grid>
        <Grid item className={classes.formItem}>
          <Input
            required
            control={control}
            label="Address"
            name="address"
            isError={Boolean(errors?.address)}
            errorMessage={errors?.address?.message}
          />
        </Grid>
        <Grid item className={classes.formItem}>
          <Input
            control={control}
            label="First Name"
            name="first_name"
            isError={Boolean(errors?.first_name)}
            errorMessage={errors?.first_name?.message}
          />
        </Grid>

        <Grid item className={classes.formItem}>
          <Input
            required
            control={control}
            label="Last Name"
            name="last_name"
            isError={Boolean(errors?.last_name)}
            errorMessage={errors?.last_name?.message}
          />
        </Grid>

        <Grid item className={classes.formItem}>
          <Input
            control={control}
            label="Email"
            name="email"
            isError={Boolean(errors?.email)}
            errorMessage={errors?.email?.message}
          />
        </Grid>
      </FormSection>

      <div className="submit">
        <Button
          variant="contained"
          fullWidth
          color="primary"
          style={{ height: '50px' }}
          disabled={loading}
          onClick={handleSubmit(onSubmit)}
        >
          {/* submitBtnText */}
          {loading ? submitBtnLoadingText : submitBtnText}
        </Button>
      </div>
    </form>
  );
};

export default Admin;
