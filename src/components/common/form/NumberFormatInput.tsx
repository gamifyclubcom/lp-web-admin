import { Control, Controller } from 'react-hook-form';
import TextField, { TextFieldProps } from '@material-ui/core/TextField';

import NumberFormat, { NumberFormatProps } from 'react-number-format';

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
};

const NumberInput: React.FC<Props & NumberFormatProps> = ({
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
  ...rest
}) => {
  return (
    <Controller
      render={({ field }) => {
        return (
          <NumberFormat
          {...{ ...field, ...rest }}
            thousandSeparator={true}
            customInput={TextField}
            label={label}
            variant={variant}
            fullWidth={fullWidth}
            control={control}
            autoComplete="off"
            error={isError}
            helperText={errorMessage}
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
        );
      }}
      control={control}
      name={name}
    />
  );
};

export default NumberInput;
