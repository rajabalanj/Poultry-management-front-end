
import Select, {
  StylesConfig,
  Props,
  ActionMeta,
  OnChangeValue,
} from 'react-select';

type OptionType = { value: number | string; label: string };

const customStyles: StylesConfig<OptionType, false> = {
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused
      ? 'var(--bs-primary)'
      : 'var(--bs-white)',
    color: state.isFocused ? 'var(--bs-white)' : 'var(--bs-body-color)',
    ':active': {
      ...provided[':active'],
      backgroundColor: 'rgba(13, 110, 253, 0.2)',
    },
  }),
  control: (provided) => ({
    ...provided,
    textAlign: 'center',
  }),
};

interface StyledSelectProps extends Omit<Props<OptionType, false>, 'onChange'> {
  onChange: (
    newValue: OnChangeValue<OptionType, false>,
    actionMeta: ActionMeta<OptionType>
  ) => void;
}

const StyledSelect: React.FC<StyledSelectProps> = (props) => {
  return <Select {...props} styles={customStyles} />;
};

export default StyledSelect;
