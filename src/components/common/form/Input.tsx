import { Control, Controller } from 'react-hook-form';

import TextField, { TextFieldProps } from '@material-ui/core/TextField';

type Props = {
  control: Control | any;
  name: string;
  label?: string;
  type?: 'text' | 'password' | 'number';
  fullWidth?: boolean;
  variant?: TextFieldProps['variant'];
  isError: boolean;
  errorMessage?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
};

const Input: React.FC<Props & TextFieldProps> = ({
  control,
  name,
  label,
  fullWidth = true,
  type = 'text',
  variant = 'outlined',
  isError,
  errorMessage,
  startIcon,
  endIcon,
  ...rest
}) => {
  return (
    <Controller
      render={({ field }) => {
        return (
          <TextField
            type={type}
            label={label}
            fullWidth={fullWidth}
            variant={variant}
            autoComplete="off"
            error={isError}
            helperText={errorMessage}
            InputProps={{
              endAdornment: endIcon,
              startAdornment: startIcon,
            }}
            {...{ ...field, ...rest }}
          />
        );
      }}
      control={control}
      name={name}
    />
  );
};

export default Input;
