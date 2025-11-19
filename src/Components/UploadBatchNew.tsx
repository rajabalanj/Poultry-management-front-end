import React, { useRef, useState, useEffect } from 'react';
import { dailyBatchApi, batchApi } from '../services/api';
import PageHeader from './Layout/PageHeader';
import { BatchResponse } from '../types/batch';

const UploadBatch: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [reportType, setReportType] = useState<'daily' | 'weekly'>('daily');
  const [batches, setBatches] = useState<BatchResponse[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [loadingBatches, setLoadingBatches] = useState(true);

  // Fetch batches on component mount
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const batchData = await batchApi.getBatches();
        setBatches(batchData);
      } catch (error) {
        console.error('Error fetching batches:', error);
        setMessage('❌ Failed to load batches');
      } finally {
        setLoadingBatches(false);
      }
    };

    fetchBatches();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file || null);
    setMessage(null);
  };

  const handleBatchSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBatchId(Number(e.target.value));
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('❌ Please select a file');
      return;
    }

    if (reportType === 'weekly' && !selectedBatchId) {
      setMessage('❌ Please select a batch for weekly report');
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      if (reportType === 'daily') {
        // Use existing daily batch upload API
        await dailyBatchApi.uploadExcel(formData);
        setMessage('✅ Daily report uploaded successfully!');
      } else if (reportType === 'weekly') {
        // Use weekly report upload API
        const response = await dailyBatchApi.uploadWeeklyReport(selectedBatchId!, formData);
        setMessage(`✅ ${response.message}`);
      }

      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setMessage('❌ Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Upload Reports"
      />
      <div className="container-fluid">
        <div className="card shadow-sm p-4 mt-3" style={{ maxWidth: 500, margin: '0 auto' }}>
          <div className="mb-4">
            <h5 className="card-title">Select Report Type</h5>
            <div className="btn-group w-100" role="group" aria-label="Report type">
              <input
                type="radio"
                className="btn-check"
                name="reportType"
                id="dailyRadio"
                autoComplete="off"
                checked={reportType === 'daily'}
                onChange={() => setReportType('daily')}
              />
              <label className="btn btn-outline-primary" htmlFor="dailyRadio">
                Daily Report
              </label>

              <input
                type="radio"
                className="btn-check"
                name="reportType"
                id="weeklyRadio"
                autoComplete="off"
                checked={reportType === 'weekly'}
                onChange={() => setReportType('weekly')}
              />
              <label className="btn btn-outline-primary" htmlFor="weeklyRadio">
                Weekly Report
              </label>
            </div>
          </div>

          {reportType === 'weekly' && (
            <div className="form-group mb-3">
              <label htmlFor="batchSelect" className="form-label">Select Batch</label>
              <select
                className="form-select"
                id="batchSelect"
                value={selectedBatchId || ''}
                onChange={handleBatchSelect}
                disabled={loadingBatches}
              >
                <option value="" disabled>Select a batch</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batch_no}
                  </option>
                ))}
              </select>
              {loadingBatches && (
                <div className="form-text">Loading batches...</div>
              )}
            </div>
          )}

          <div className="form-group mb-3">
            <label htmlFor="excelFile" className="form-label">Select Excel File</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              className="form-control"
              id="excelFile"
              ref={fileInputRef}
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </div>

          <button
            className="btn btn-primary w-100"
            onClick={handleUpload}
            disabled={!selectedFile || (reportType === 'weekly' && !selectedBatchId) || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>

          {message && (
            <div className={`alert mt-3 ${message.startsWith('✅') ? 'alert-success' : 'alert-danger'}`} role="alert">
              {message}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UploadBatch;
