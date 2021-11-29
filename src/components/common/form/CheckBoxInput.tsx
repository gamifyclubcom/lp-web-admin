import Checkbox, { CheckboxProps } from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { SwitchBaseProps } from '@material-ui/core/internal/SwitchBase';
import { Control, Controller } from 'react-hook-form';

interface Props {
  control: Control | any;
  name: string;
  label?: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  color?: CheckboxProps['color'];
  onChange?: SwitchBaseProps['onChange'];
}

const CheckBoxInput: React.FC<Props> = ({
  control,
  name,
  defaultChecked,
  color = 'primary',
  label,
  disabled,
  onChange,
  ...rest
}) => {
  return (
    <Controller
      render={({ field }) => {
        return (
          <FormControlLabel
            control={
              <Checkbox
                disabled={disabled}
                color={color}
                checked={field.value}
                onChange={onChange}
              />
            }
            label={label}
            {...{ ...field, ...rest }}
          />
        );
      }}
      control={control}
      name={name}
    />
  );
};

export default CheckBoxInput;
