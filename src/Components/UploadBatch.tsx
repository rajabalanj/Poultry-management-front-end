import React, { useRef, useState } from 'react';
import { dailyBatchApi } from '../services/api';
import PageHeader from './Layout/PageHeader';
const UploadBatch: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file || null);
    setMessage(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      await dailyBatchApi.uploadExcel(formData);
      setMessage('✅ Upload successful!');
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
        title="Upload Batch"
      />
    <div className="container-fluid">
      

      <div className="card shadow-sm p-4 mt-3" style={{ maxWidth: 500, margin: '0 auto' }}>
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
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
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
