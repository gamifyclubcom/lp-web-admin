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
  tooltipHelp?: string;
}

const CheckBoxInputV2: React.FC<Props> = ({
  control,
  name,
  defaultChecked,
  color = 'primary',
  label,
  disabled,
  onChange,
  tooltipHelp,
  ...rest
}) => {
  return (
    <Controller
      render={({ field }) => {
        return (
          <>
            <FormControlLabel
              control={
                <Checkbox
                  disabled={disabled}
                  color={color}
                  checked={field.value}
                  onChange={onChange}
                />
              }
              // style={tooltipHelp ? { marginTop: -30 } : {}}
              label={
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
                </div>
              }
              {...{ ...field, ...rest }}
            />
            {tooltipHelp ? (
              <div
                style={{
                  fontSize: 12,
                  lineHeight: '12px',
                  color: '#405166',
                  letterSpacing: '0.15px',
                  marginLeft: 32,
                  marginTop: -8,
                }}
              >
                {tooltipHelp}
              </div>
            ) : null}
          </>
        );
      }}
      control={control}
      name={name}
    />
  );
};

export default CheckBoxInputV2;
