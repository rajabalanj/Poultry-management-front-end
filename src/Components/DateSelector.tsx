import React from 'react';

interface DateSelectorProps {
  value: string;
  onChange: (date: string) => void;
  label: string;
  maxDate?: string;
  minDate?: string; // Add this prop
  disabled?: boolean;
  className?: string;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  value,
  onChange,
  label,
  maxDate,
  minDate, // Destructure minDate
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`mb-2 mt-2 d-flex align-items-center ${className}`}>
      <label>{label}:</label>
      <input
        type="date"
        className="form-control w-auto d-inline-block ms-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        disabled={disabled}
        max={maxDate}
        min={minDate} // Apply minDate here
      />
    </div>
  );
};