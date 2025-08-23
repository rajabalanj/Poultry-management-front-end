import React from 'react';
import { EggRoomStockEntry } from '../types/eggRoomReport';

interface StockFormSectionProps {
  config: {
    id: string;
    title: string;
    icon: string;
    color: string;
    fields: Array<{
      key: keyof EggRoomStockEntry;
      label: string;
      readonly?: boolean; // Add disabled property
      controlledBy?: keyof EggRoomStockEntry; // Add controlledBy property
    }>;
  };
  values: EggRoomStockEntry;
  onChange: (field: keyof EggRoomStockEntry, value: number | string) => void;
  calculateClosing: (values: EggRoomStockEntry) => number; // Ensure this returns only number
  isMobile?: boolean;
}

export const StockFormSection: React.FC<StockFormSectionProps> = ({
  config,
  values,
  onChange,
  calculateClosing,
  isMobile,
}) => {
  const maxLabelWidth = 110; // px
  const { title, icon, color, fields } = config;

  if (isMobile) {
    return (
      <div className="mb-2">
        <div
          className={`fw-bold border-bottom pb-1 mb-2 d-flex align-items-center text-${color}`}
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          <i className={`bi ${icon} me-2`} />
          <span className="flex-grow-1">{title}</span>
        </div>
        <div className="mt-2">
          {fields.map(({ key, label, readonly, controlledBy }) => (
            <div className="mb-2" key={key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label className="form-label text-capitalize mb-0" style={{ minWidth: maxLabelWidth }}>
                  {label}
                </label>
                <input
                  type="number"
                  className={`form-control ${readonly ? 'is-readonly' : ''}`}
                  style={{ flex: 1 }}
                  // Use value from 'controlledBy' if specified, otherwise use its own value
                  value={controlledBy ? (values[controlledBy] as number || '') : (values[key] as number || '')}
                  onChange={(e) => onChange(key, e.target.value)}
                  min={0}
                  readOnly={readonly} // Apply readonly property
                />
              </div>
            </div>
          ))}
          <div className="mb-2">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label className="form-label mb-0" style={{ minWidth: maxLabelWidth }}>
                Closing
              </label>
              <input
                type="number"
                className="form-control is-readonly"
                value={calculateClosing(values)}
                readOnly
                style={{ flex: 1 }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className={`fw-bold border-bottom pb-1 mb-2 text-${color}`}>
        <i className={`bi ${icon} me-2`} />
        {title}
      </div>
      <div className="row g-2 align-items-end">
        {fields.map(({ key, label, readonly, controlledBy }) => (
          <div className="col" key={key}>
            <label className="form-label text-capitalize">{label}</label>
            <input
              type="number"
              className={`form-control ${readonly ? 'is-readonly' : ''}`}
              // Use value from 'controlledBy' if specified, otherwise use its own value
              value={controlledBy ? (values[controlledBy] as number || '') : (values[key] as number || '')}
              onChange={(e) => onChange(key, e.target.value)}
              min={0}
              readOnly={readonly} // Apply disabled property
            />
          </div>
        ))}
        <div className="col">
          <label className="form-label">Closing</label>
          <input
            type="number"
            className="form-control is-readonly"
            value={calculateClosing(values)}
            readOnly
          />
        </div>
      </div>
    </div>
  );
};