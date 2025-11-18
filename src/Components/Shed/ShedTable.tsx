// src/Components/Shed/ShedTable.tsx
import React from "react";
import { ShedResponse } from "../../types/shed";
import ShedCard from "./ShedCard";

interface ShedTableProps {
  sheds: ShedResponse[];
  loading: boolean;
  error: string | null;
  onDelete: (id: number) => void;
}

const ShedTable: React.FC<ShedTableProps> = ({ sheds, loading, error, onDelete }) => {
  if (loading) return <div className="text-center">Loading sheds...</div>;
  if (error) return <div className="text-center text-danger">{error}</div>;
  if (sheds.length === 0) return <div className="text-center">No sheds found</div>;

  return (
    <div className="container mt-4">
      <div className="row">
        {sheds.map((shed) => (
          <div className="col-md-4" key={shed.id}>
            <ShedCard shed={shed} onDelete={onDelete} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShedTable;
