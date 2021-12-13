import React from 'react';
import { Control, Controller } from 'react-hook-form';

import { DateTimePicker } from '@material-ui/pickers';
import { TextFieldProps } from '@material-ui/core/TextField';
/* import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import { BsInfoCircle } from 'react-icons/bs'; */
import InputLabel from '@material-ui/core/InputLabel';

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
  tooltipHelp?: string;
}

/* const IconWithTooltip = (description: string) => (
  <Tooltip title={description}>
    <IconButton style={{ padding: 0 }}>
      <BsInfoCircle style={{ width: 16, height: 16 }} />
    </IconButton>
  </Tooltip>
); */

const DateInputV2: React.FC<Props> = ({
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
  tooltipHelp,
  ...rest
}) => {
  return (
    <Controller
      render={({ field: { onChange, value } }) => (
        <>
          <InputLabel /* shrink */ htmlFor={name}>
            <div
              style={{
                fontSize: 14,
                lineHeight: '14px',
                color: '#000',
                fontWeight: 400,
                marginBottom: 3,
              }}
            >
              {label}
              {required ? ' *' : ''}
            </div>
            {tooltipHelp ? (
              <div
                style={{
                  fontSize: 12,
                  lineHeight: '12px',
                  color: '#405166',
                  marginBottom: 5,
                  letterSpacing: '0.15px',
                }}
              >
                {tooltipHelp}
              </div>
            ) : null}
          </InputLabel>
          <DateTimePicker
            readOnly={disabled}
            required={required}
            size={size}
            margin="normal"
            /* label={
            <div style={{ display: 'flex', columnGap: 4 }}>
              <span>
                {label}
                {required ? ' *' : ''}
              </span>
              {tooltipHelp ? IconWithTooltip(tooltipHelp) : ''}
            </div>
          }
          InputLabelProps={{ style: { pointerEvents: 'auto' }, htmlFor: name, required: false }} */
            id={name}
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
        </>
      )}
      control={control}
      name={name}
    />
  );
};

export default DateInputV2;
