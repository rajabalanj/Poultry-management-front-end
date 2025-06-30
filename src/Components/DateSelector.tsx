import React from 'react';

interface DateSelectorProps {
  value: string;
  onChange: (date: string) => void;
  maxDate?: string;
  disabled?: boolean;
  className?: string;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  value,
  onChange,
  maxDate,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`mb-2 ${className}`}>
      <label>Date:</label>
      <input
        type="date"
        className="form-control w-auto d-inline-block ms-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        disabled={disabled}
        max={maxDate}
      />
    </div>
  );
};