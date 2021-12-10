import { Control, Controller } from 'react-hook-form';

import TextField, { TextFieldProps } from '@material-ui/core/TextField';
/* import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import { BsInfoCircle } from 'react-icons/bs'; */
import InputLabel from '@material-ui/core/InputLabel';

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
  tooltipHelp?: string;
};

/* const IconWithTooltip = (description: string) => (
  <Tooltip title={description}>
    <IconButton style={{ padding: 0 }}>
      <BsInfoCircle style={{ width: 16, height: 16 }} />
    </IconButton>
  </Tooltip>
); */

const InputV2: React.FC<Props & TextFieldProps> = ({
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
  tooltipHelp,
  ...rest
}) => {
  return (
    <Controller
      render={({ field }) => {
        return (
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
                {rest.required ? ' *' : ''}
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

            <TextField
              type={type}
              /* label={
                <div style={{ display: 'flex', columnGap: 4 }}>
                  <span>
                    {label}
                    {rest.required ? ' *' : ''}
                  </span>
                  {tooltipHelp ? IconWithTooltip(tooltipHelp) : ''}
                </div>
              }
              InputLabelProps={{ style: { pointerEvents: 'auto' }, htmlFor: name, required: false }} */
              fullWidth={fullWidth}
              variant={variant}
              autoComplete="off"
              error={isError}
              helperText={errorMessage}
              id={name}
              InputProps={{
                endAdornment: endIcon,
                startAdornment: startIcon,
              }}
              {...{ ...field, ...rest }}
            />
          </>
        );
      }}
      control={control}
      name={name}
    />
  );
};

export default InputV2;
