import React, { useMemo } from "react";
import { BatchResponse } from "../types/batch";
import Loading from './Common/Loading';
import BatchCard from "./Batch/BatchCard";

interface BatchConfigProps {
  batches: BatchResponse[];
  loading: boolean;
  error: string | null;
}

const BatchConfig: React.FC<BatchConfigProps> = ({ batches, loading, error }) => {
  const visibleBatches = useMemo(() => batches.filter(batch => batch.id != null && !!batch.batch_type), [batches]);
  
  const batchSections = useMemo(() => {
    const byType = {
      Layer: visibleBatches.filter(b => b.batch_type === 'Layer'),
      Grower: visibleBatches.filter(b => b.batch_type === 'Grower'),
      Chick: visibleBatches.filter(b => b.batch_type === 'Chick'),
    };
    return byType;
  }, [visibleBatches]);

  if (loading) return <Loading message="Loading data..." />;
  if (error) return <div className="text-center text-danger">{error}</div>;
  if (visibleBatches.length === 0) return <div className="text-center">No batches found</div>;

  return (
    <div className="p-3 bg-light rounded">
      {batchSections.Layer.length > 0 && (
        <div className="mb-4">
          <h5 className="mb-3">Layer Batches</h5>
          {batchSections.Layer.map(batch => (
            <BatchCard
              key={`Layer-${batch.id}`}
              batch={batch}
            />
          ))}
        </div>
      )}
      {batchSections.Grower.length > 0 && (
        <div className="mb-4">
          <h5 className="mb-3 text-primary">Grower Batches</h5>
          {batchSections.Grower.map(batch => (
            <BatchCard
              key={`Grower-${batch.id}`}
              batch={batch}
            />
          ))}
        </div>
      )}
      {batchSections.Chick.length > 0 && (
        <div className="mb-4">
          <h5 className="mb-3 text-primary">Chick Batches</h5>
          {batchSections.Chick.map(batch => (
            <BatchCard
              key={`Chick-${batch.id}`}
              batch={batch}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BatchConfig;