import { Control, Controller } from 'react-hook-form';
import TextField, { TextFieldProps } from '@material-ui/core/TextField';

import NumberFormat, { NumberFormatProps } from 'react-number-format';
/* import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import { BsInfoCircle } from 'react-icons/bs'; */
import InputLabel from '@material-ui/core/InputLabel';

type Props = {
  control: Control | any;
  name: string;
  label?: string;
  fullWidth?: boolean;
  isError: boolean;
  errorMessage?: string;
  variant?: TextFieldProps['variant'];
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  onValueChange: (number: any) => void;
  tooltipHelp?: string;
};

/* const IconWithTooltip = (description: string) => (
  <Tooltip title={description}>
    <IconButton style={{ padding: 0 }}>
      <BsInfoCircle style={{ width: 16, height: 16 }} />
    </IconButton>
  </Tooltip>
); */

const NumberInputV2: React.FC<Props & NumberFormatProps> = ({
  control,
  name,
  label,
  fullWidth = true,
  variant = 'outlined',
  isError,
  errorMessage,
  startIcon,
  endIcon,
  onValueChange,
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
            <NumberFormat
              {...{ ...field, ...rest }}
              thousandSeparator={true}
              customInput={TextField}
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
              variant={variant}
              fullWidth={fullWidth}
              control={control}
              autoComplete="off"
              error={isError}
              helperText={errorMessage}
              id={name}
              InputProps={{
                endAdornment: endIcon,
                startAdornment: startIcon,
              }}
              onValueChange={(values) => {
                field.onChange();
                onValueChange(values);
              }}
              // onFocus={(e) => e.target.select()}
              // className="flex-1 w-32 px-2 py-1 text-3xl font-medium text-right bg-transparent border border-gray-500 rounded-md text-interteal focus:outline-none"
            />
          </>
        );
      }}
      control={control}
      name={name}
    />
  );
};

export default NumberInputV2;
