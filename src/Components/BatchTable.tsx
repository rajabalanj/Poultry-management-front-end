import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import { DailyBatch } from "../types/daily_batch";
import ListModal from './Common/ListModal';
import Loading from './Common/Loading';


const getPerformanceIndicator = (
  actual?: number,
  standard?: number,
  actualMultiplier = 1,
  lowerIsBetter = false
) => {
  if (actual === undefined || standard === undefined || actual === null || standard === null) {
    return <span className="text-muted">-</span>;
  }

  const actualValue = actual * actualMultiplier;

  const isGood = lowerIsBetter ? actualValue <= standard : actualValue >= standard;

  if (isGood) {
    return <i className="bi bi-circle-fill text-success" title="Good performance"></i>;
  }
  return <i className="bi bi-circle-fill text-danger" title="Needs attention"></i>;
};

const BatchCard: React.FC<{
  batch: DailyBatch;
  onView: (batch_id: number, batchDate: string) => void;
}> = React.memo(({ batch, onView }) => {
  const handleCardClick = () => {
    onView(batch.batch_id, batch.batch_date);
  };

  return (
    <div 
      className="card mb-2 border-top-0 border-end-0 border-start-0 border-bottom" 
      onClick={handleCardClick}
      style={{ cursor: 'pointer', borderRadius: 0 }}
      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <div className="card-body p-2">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="mb-1" style={{ fontSize: '1rem' }}>Batch {batch.batch_no}</h6>
            <div style={{ fontSize: '0.85rem' }}>
              <span className="me-3">Shed: {batch.shed_no}</span>
              <span>Age: {batch.age}</span>
            </div>
          </div>
          <div className="d-flex align-items-center">
            <div className="text-center me-3">
              <strong style={{ fontSize: '0.8rem' }}>Feed</strong>
              <div>
                {batch.batch_type === 'Layer' 
                  ? getPerformanceIndicator(batch.feed_in_kg, batch.standard_feed_in_kg, 1, true)
                  : <span className="text-muted">-</span>
                }
              </div>
            </div>
            <div className="text-center">
              <strong style={{ fontSize: '0.8rem' }}>Egg</strong>
              <div>
                {batch.batch_type === 'Layer' 
                  ? getPerformanceIndicator(batch.hd, batch.standard_hen_day_percentage, 100)
                  : <span className="text-muted">-</span>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

interface BatchTableProps {
  // backend may return either DailyBatch entries or pending request objects
  batches: any[];
  loading: boolean;
  error: string | null;
}

const BatchTable: React.FC<BatchTableProps> = ({ batches, loading, error }) => {
  const navigate = useNavigate();


  const handleViewDetails = useCallback(
    (batch_id: number, batchDate: string) => {
      if (!batch_id || !batchDate) {
        console.error("Batch ID and Batch Date are required");
        return;
      }
      navigate(`/batch/${batch_id}/${batchDate}/details`);
    },
    [navigate]
  );

  const filteredBatches = useMemo(() => {
    // Batches that are active and should be displayed. We filter out 'pending' requests.
    const displayableBatches = batches.filter(
      (batch: any) => batch && !batch.message
    );

    const valid = displayableBatches
      .filter((batch: any) => batch.batch_id != null && !!batch.batch_type)
      .map((b: any) => {
        // For batches where daily data might not exist, fallback to requested_date for navigation
        if (!b.batch_date && b.requested_date) {
          return { ...b, batch_date: b.requested_date };
        }
        return b;
      })
      .filter((batch: any) => !!batch.batch_date) // Ensure a date is available for actions
      .map((b: any) => b as DailyBatch);

    return {
      Layer: valid.filter(b => b.batch_type === 'Layer'),
      Grower: valid.filter(b => b.batch_type === 'Grower'),
      Chick: valid.filter(b => b.batch_type === 'Chick'),
    };
  }, [batches]);

  // Pending request items are identified by a 'message' from the backend,
  // indicating they are out of scope for the selected date (e.g., start in the future).
  const requestItems = useMemo(() => {
    return batches.filter((item: any) => item && !!item.message);
  }, [batches]);

  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [modalItems, setModalItems] = useState<string[]>([]);
  const openRequestsModal = () => {
    const items = requestItems.map((req: any) => {
      const start = req.batch_start_date || req.requested_date || '-';
      const batchno = req.batch_no || '-';
      return `Batch: ${batchno} | Start: ${start}`;
    });
    setModalItems(items);
    setShowRequestsModal(true);
  };

  if (loading) return <Loading message="Loading data..." />;
  if (error) return <div className="text-center text-danger">{error}</div>;
  if ((!batches || batches.length === 0) && !loading) return <div className="text-center">No batches found</div>;

  return (
    <div className="px-2">
      {requestItems.length > 0 && (
        <div className="mb-3">
          <div className="alert border border-warning text-dark" role="alert">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
              <div className="mb-2 mb-md-0">
                <strong>Note:</strong> There are upcoming batches not shown in the list below.
              </div>
              <div>
                <button className="btn btn-link p-0 text-break-nowrap" onClick={openRequestsModal}>View upcoming batches</button>
              </div>
            </div>
          </div>
          <ListModal
            show={showRequestsModal}
            onHide={() => setShowRequestsModal(false)}
            title="Upcoming Batches"
            items={modalItems}
          />
        </div>
      )}
      {filteredBatches.Layer.length > 0 && (
        <div className="mb-4">
          <h5 className="fw-bold text-primary mb-3">Layer Batches</h5>
          {filteredBatches.Layer.map(batch => (
            <BatchCard
              key={`Layer-${batch.batch_id}-${batch.batch_date}`}
              batch={batch}
              onView={handleViewDetails}
            />
          ))}
        </div>
      )}
      {filteredBatches.Grower.length > 0 && (
        <div className="mb-4">
          <h5 className="fw-bold text-primary mb-3">Grower Batches</h5>
          {filteredBatches.Grower.map(batch => (
            <BatchCard
              key={`Grower-${batch.batch_id}-${batch.batch_date}`}
              batch={batch}
              onView={handleViewDetails}
            />
          ))}
        </div>
      )}
      {filteredBatches.Chick.length > 0 && (
        <div className="mb-4">
          <h5 className="fw-bold text-primary mb-3">Chick Batches</h5>
          {filteredBatches.Chick.map(batch => (
            <BatchCard
              key={`Chick-${batch.batch_id}-${batch.batch_date}`}
              batch={batch}
              onView={handleViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BatchTable;