import React from 'react';

interface SaveControlsProps {
  editing: boolean;
  loading: boolean;
  onSave: (e: React.FormEvent) => void;
  className?: string;
}

export const SaveControls: React.FC<SaveControlsProps> = ({
  editing,
  loading,
  onSave,
  className = '',
}) => {
  return (
    <div className={`mt-3 d-flex gap-2 ${className}`}>
      <button
        type="submit"
        className="btn btn-primary"
        disabled={loading}
        onClick={onSave}
      >
        {loading ? (
          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
        ) : null}
        {editing ? 'Update' : 'Add'} Report
      </button>
    </div>
  );
};