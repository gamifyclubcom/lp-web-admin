import React from 'react';
import { Control, Controller } from 'react-hook-form';

import { DateTimePicker } from '@material-ui/pickers';
import { TextFieldProps } from '@material-ui/core/TextField';

interface Props {
  label: string;
  name: string;
  control: Control | any;
  isError: boolean;
  variant?: TextFieldProps['variant'];
  errorMessage?: string;
  fullWidth?: boolean;
  size?: TextFieldProps['size'];
  required?: boolean;
  disabled?: boolean;
  disablePast?: boolean;
}

const DateInput: React.FC<Props> = ({
  label,
  name,
  disabled,
  control,
  isError,
  errorMessage,
  variant = 'outlined',
  fullWidth = true,
  size = 'medium',
  required = false,
  disablePast = true,
  ...rest
}) => {
  return (
    <Controller
      render={({ field: { onChange, value } }) => (
        <DateTimePicker
          readOnly={disabled}
          required={required}
          size={size}
          margin="normal"
          label={label}
          fullWidth={fullWidth}
          inputVariant={variant}
          onChange={onChange}
          value={value}
          autoComplete="off"
          style={{ marginTop: 0 }}
          error={isError}
          disablePast={disablePast}
          helperText={isError ? errorMessage : null}
          format="MMMM DD yyyy, hh:mm A (UTCZ)"
          {...rest}
        />
      )}
      control={control}
      name={name}
    />
  );
};

export default DateInput;
