import React from 'react';
import DatePicker from 'react-datepicker';
import { Placement } from '@floating-ui/react';
import 'react-datepicker/dist/react-datepicker.css';
import './CustomDatePicker.css';

interface CustomDatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  dateFormat?: string;
  showMonthDropdown?: boolean;
  showYearDropdown?: boolean;
  dropdownMode?: "select" | "scroll";
  minDate?: Date;
  maxDate?: Date;
  placeholderText?: string;
  className?: string;
  required?: boolean;
  id?: string;
  disabled?: boolean;
  isClearable?: boolean;
  popperPlacement?: Placement;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  selected,
  onChange,
  dateFormat = "dd-MM-yyyy",
  showMonthDropdown = true,
  showYearDropdown = true,
  dropdownMode = "select",
  minDate,
  maxDate = new Date(),
  placeholderText = 'Select a date',
  className = '',
  required,
  id,
  disabled,
  isClearable,
  popperPlacement = "bottom-start",
}) => {
  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      dateFormat={dateFormat}
      showMonthDropdown={showMonthDropdown}
      showYearDropdown={showYearDropdown}
      dropdownMode={dropdownMode}
      minDate={minDate}
      maxDate={maxDate}
      placeholderText={placeholderText}
      className={`form-control ${className}`}
      calendarClassName="custom-datepicker-calendar"
      required={required}
      id={id}
      disabled={disabled}
      isClearable={isClearable}
      popperPlacement={popperPlacement}
    />
  );
};

export default CustomDatePicker;
