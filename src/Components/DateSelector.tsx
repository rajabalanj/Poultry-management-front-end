import React, { useState, useEffect } from 'react';

interface DateSelectorProps {
  onChange: (date: string) => void;
  label: string;
  defaultValue?: string;
  storageKey?: string;
  maxDate?: string;
  minDate?: string;
  disabled?: boolean;
  className?: string;
  isBold?: boolean;
  layout?: 'horizontal' | 'vertical';
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  onChange,
  label,
  defaultValue,
  storageKey,
  maxDate,
  minDate,
  disabled = false,
  className = '',
  isBold = true,
  layout = 'horizontal',
}) => {
  const [date, setDate] = useState(() => {
    if (storageKey) {
      const storedDate = sessionStorage.getItem(storageKey);
      if (storedDate) {
        return storedDate;
      }
    }
    if (defaultValue) {
      return defaultValue.split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    // Update state if defaultValue changes (e.g., on URL change)
    if (defaultValue) {
      const newDefault = defaultValue.split('T')[0];
      if (newDefault !== date) {
        setDate(newDefault);
      }
    }
  }, [defaultValue, date]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDate(newDate);
    if (storageKey) {
      sessionStorage.setItem(storageKey, newDate);
    }
    onChange(newDate);
  };

  const containerClasses = layout === 'horizontal'
    ? 'd-flex align-items-center'
    : 'd-flex flex-column';

  const labelClasses = isBold ? 'fw-semibold' : '';

  const inputClasses = layout === 'horizontal'
    ? 'form-control w-auto d-inline-block ms-2'
    : 'form-control w-auto mt-2';

  return (
    <div className={`mb-2 mt-2 ${containerClasses} ${className}`}>
      <label className={labelClasses}>{label}:</label>
      <input
        type="date"
        className={inputClasses}
        value={date}
        onChange={handleChange}
        required
        disabled={disabled}
        max={maxDate}
        min={minDate}
      />
    </div>
  );
};