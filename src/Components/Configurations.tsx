import React, { useState, useEffect } from 'react';
import PageHeader from './Layout/PageHeader';
import { configApi, batchApi } from '../services/api';
import { toast } from 'react-toastify';
import BatchConfig from './BatchConfig';

const KG_PER_TON = 1000;

const Configurations: React.FC = () => {
  const [kg, setKg] = useState(3000);
  const [ton, setTon] = useState(3);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Batch config state
  const [batches, setBatches] = useState<import('../types/batch').BatchResponse[]>([]);
  const [batchLoading, setBatchLoading] = useState(true); // Still useful for BatchConfig component
  const [batchError, setBatchError] = useState<string | null>(null); // Still useful for BatchConfig component

  // Load all configurations from backend on mount
  useEffect(() => {
    const fetchAllConfigs = async () => {
      setLoading(true);
      setBatchLoading(true); // Set batch loading
      try {
        const configs = await configApi.getAllConfigs();
        const kgConfig = configs.find(c => c.name === 'lowKgThreshold');
        const tonConfig = configs.find(c => c.name === 'lowTonThreshold');
        setKg(kgConfig ? Number(kgConfig.value) : 3000);
        setTon(tonConfig ? Number(tonConfig.value) : 3);

        // Load batch configs
        const batchData = await batchApi.getBatches(0, 1000); // Assuming getBatches can take limit/skip
        setBatches(Array.isArray(batchData) ? batchData : []);
        setBatchError(null); // Clear any previous batch error

      } catch (err: any) {
        toast.error(err.message || 'Failed to load configurations.');
        setBatchError(err.message || 'Failed to load batch configurations.'); // Set specific error for batch
      } finally {
        setLoading(false);
        setBatchLoading(false); // End batch loading
      }
    };
    fetchAllConfigs();
  }, []);

  // Sync ton when kg changes
  const handleKgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (!isNaN(value)) {
      setKg(value);
      setTon(value / KG_PER_TON);
    }
  };

  // Sync kg when ton changes
  const handleTonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (!isNaN(value)) {
      setTon(value);
      setKg(value * KG_PER_TON);
    }
  };

  // Save to backend
  const handleSave = async () => {
    setSaving(true);
    try {
      await configApi.updateConfig('lowKgThreshold', String(kg));
      await configApi.updateConfig('lowTonThreshold', String(ton));
      toast.success('Configurations saved successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save configurations.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Configurations"></PageHeader>
      <div className="px-4">
        <div className="mb-3 d-flex flex-column flex-md-row gap-3 align-items-start align-items-md-center">
          <label className="form-label mb-0 flex-shrink-0">Global Low Feed Thresholds:</label>
          <div className="d-flex align-items-center gap-2">
            <span>kg:</span>
            <input
              type="number"
              className="form-control form-control-sm"
              style={{ width: 100 }}
              value={kg}
              min={0}
              onChange={handleKgChange}
              disabled={loading}
            />
          </div>
          <div className="d-flex align-items-center gap-2">
            <span>ton:</span>
            <input
              type="number"
              className="form-control form-control-sm"
              style={{ width: 100 }}
              value={ton}
              min={0}
              step={0.001}
              onChange={handleTonChange}
              disabled={loading}
            />
          </div>
          <button className="btn btn-primary ms-0 ms-md-3 mt-2 mt-md-0" onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save Global Thresholds'}
          </button>
        </div>
        <hr />
        <h5 className="mb-3">Batch Configuration</h5>
        <BatchConfig batches={batches} loading={batchLoading} error={batchError} />
      </div>
    </div>
  );
};

export default Configurations;