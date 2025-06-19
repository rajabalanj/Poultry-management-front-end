import React from 'react';
import { useConfig } from './ConfigContext';

const Configurations: React.FC = () => {
  const { lowKgThreshold, setLowKgThreshold, lowTonThreshold, setLowTonThreshold } = useConfig();

  return (
    <div>
      <h2>Configurations</h2>
      <div className="mb-3 d-flex gap-3 align-items-center">
        <label className="form-label mb-0">Low Stock Thresholds:</label>
        <div className="d-flex align-items-center gap-2">
          <span>kg:</span>
          <input
            type="number"
            className="form-control form-control-sm"
            style={{ width: 80 }}
            value={lowKgThreshold}
            min={0}
            onChange={e => setLowKgThreshold(Number(e.target.value))}
          />
        </div>
        <div className="d-flex align-items-center gap-2">
          <span>ton:</span>
          <input
            type="number"
            className="form-control form-control-sm"
            style={{ width: 80 }}
            value={lowTonThreshold}
            min={0}
            onChange={e => setLowTonThreshold(Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
};

export default Configurations;
