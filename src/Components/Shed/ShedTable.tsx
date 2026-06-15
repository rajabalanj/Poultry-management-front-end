// src/Components/Shed/ShedTable.tsx
import React from "react";
import { ShedResponse } from "../../types/shed";
import ShedCard from "./ShedCard";

interface ShedTableProps {
  sheds: ShedResponse[];
  loading: boolean;
  error: string | null;
  onDelete: (id: number) => void;
  focusedRowIndex?: number;
  setFocusedRowIndex?: (index: number) => void;
  setSelectedIndex?: (index: number) => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

const ShedTable: React.FC<ShedTableProps> = ({ sheds, loading, error, onDelete, focusedRowIndex, setFocusedRowIndex, setSelectedIndex, containerRef }) => {
  if (loading) return <div className="text-center">Loading sheds...</div>;
  if (error) return <div className="text-center text-danger">{error}</div>;
  if (sheds.length === 0) return <div className="text-center">No sheds found</div>;

  return (
    <div className="container mt-4" ref={containerRef} tabIndex={0} style={{ outline: 'none' }}>
      <div className="row">
        {sheds.map((shed, index) => (
          <div 
            className="col-md-4" 
            key={shed.id} 
            data-row-index={index}
            onClick={() => {
              if (setFocusedRowIndex) setFocusedRowIndex(index);
              if (setSelectedIndex) setSelectedIndex(index);
            }}
          >
            <ShedCard 
              shed={shed} 
              onDelete={onDelete} 
              isFocused={focusedRowIndex === index}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShedTable;
