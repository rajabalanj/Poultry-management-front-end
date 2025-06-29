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
  const [batchLoading, setBatchLoading] = useState(true);
  const [batchError, setBatchError] = useState<string | null>(null);

  // Load config from backend on mount
  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const configs = await configApi.getAllConfigs();
        const kgConfig = configs.find(c => c.name === 'lowKgThreshold');
        const tonConfig = configs.find(c => c.name === 'lowTonThreshold');
        const kgVal = kgConfig ? Number(kgConfig.value) : 3000;
        const tonVal = tonConfig ? Number(tonConfig.value) : 3;
        setKg(kgVal);
        setTon(tonVal);
      } catch (err: any) {
        toast.error(err.message || 'Failed to load configuration');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
    // eslint-disable-next-line
  }, []);

  // Fetch batches for config
  useEffect(() => {
    const fetchBatches = async () => {
      setBatchLoading(true);
      try {
        const data = await batchApi.getBatches(0, 1000);
        setBatches(Array.isArray(data) ? data : []);
        setBatchError(null);
      } catch (err: any) {
        setBatchError(err.message || 'Failed to load batches');
      } finally {
        setBatchLoading(false);
      }
    };
    fetchBatches();
  }, []);

  // Sync ton when kg changes
  const handleKgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKg = Number(e.target.value);
    setKg(newKg);
    const newTon = +(newKg / KG_PER_TON).toFixed(3);
    if (ton !== newTon) setTon(newTon);
  };

  // Sync kg when ton changes
  const handleTonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTon = Number(e.target.value);
    setTon(newTon);
    const newKg = Math.round(newTon * KG_PER_TON);
    if (kg !== newKg) setKg(newKg);
  };

  // Save to backend and context
  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        configApi.updateConfig('lowKgThreshold', String(kg)),
        configApi.updateConfig('lowTonThreshold', String(ton)),
      ]);
      toast.success('Configuration saved!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Configurations"></PageHeader>
      <div className="px-4">
        <div className="mb-3 d-flex gap-3 align-items-center">
          <label className="form-label mb-0">Low Feed Thresholds:</label>
          <div className="d-flex align-items-center gap-2">
            <span>kg:</span>
            <input
              type="number"
              className="form-control form-control-sm"
              style={{ width: 80 }}
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
              style={{ width: 80 }}
              value={ton}
              min={0}
              step={0.001}
              onChange={handleTonChange}
              disabled={loading}
            />
          </div>
          <button className="btn btn-primary ms-3" onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save'}
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
