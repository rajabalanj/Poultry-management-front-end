import React from 'react';

interface SaveControlsProps {
  editing: boolean;
  loading: boolean;
  onSave: (e: React.FormEvent) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const SaveControls: React.FC<SaveControlsProps> = ({
  editing,
  loading,
  onSave,
  className,
  style,
}) => {
  return (
    <button
      type="submit"
      className={`btn btn-primary ${className || ''}`}
      disabled={loading}
      onClick={onSave}
      style={style}
    >
      {loading ? (
        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
      ) : null}
      {editing ? 'Update' : 'Add'} Report
    </button>
  );
};