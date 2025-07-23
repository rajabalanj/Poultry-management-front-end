import React from 'react';

interface SaveControlsProps {
  editing: boolean;
  loading: boolean;
  onSave: (e: React.FormEvent) => void;
  onDelete: () => void;
  className?: string;
}

export const SaveControls: React.FC<SaveControlsProps> = ({
  editing,
  loading,
  onSave,
  onDelete,
  className = '',
}) => {
  return (
    <div className={`mt-3 d-flex gap-2 ${className}`}>
      <button
        type="submit"
        className="btn btn-success"
        disabled={loading}
        onClick={onSave}
      >
        {loading ? (
          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
        ) : null}
        {editing ? 'Update' : 'Add'} Report
      </button>
      {editing && (
        <button
          type="button"
          className="btn btn-danger"
          onClick={onDelete}
          disabled={loading}
        >
          Delete
        </button>
      )}
    </div>
  );
};