import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import { DailyBatch } from "../types/daily_batch";
import ListModal from './Common/ListModal';
import Loading from './Common/Loading';


const getPerformanceIndicator = (
  actual: number | undefined,
  standard: number | undefined,
  lowerIsBetter = false
) => {
  if (actual === undefined || standard === undefined || actual === null || standard === null) {
    return <div className="text-muted">-</div>;
  }

  const isGood = lowerIsBetter ? actual <= standard : actual >= standard;
  const icon = isGood
    ? <i className="bi bi-arrow-up-circle-fill text-success"></i>
    : <i className="bi bi-arrow-down-circle-fill text-danger"></i>;

  return icon;
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
      className="card mb-3 shadow-sm"
      onClick={handleCardClick}
      style={{ cursor: 'pointer', borderRadius: '8px', transition: 'transform 0.2s' }}
      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0px)'}
    >
      <div className="card-body">
        <div className="row align-items-center">
          <div className="col-12 col-md-3 me-md-3"> {/* Added me-md-3 for spacing */}
            <h6 className="mb-1">Batch: {batch.batch_no}</h6>
            <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Shed: {batch.shed_no} | Age: {batch.age} weeks</p>
          </div>
          <div className="col-12 col-md-3 me-md-3"> {/* Added me-md-3 for spacing */}
            <div className="d-flex gap-4 text-center mt-2 mt-md-0"> {/* Removed justify-content-start and justify-content-md-end */}
              <div>
                <p className="mb-1 text-muted small">Feed Intake</p>
                {getPerformanceIndicator(batch.feed_in_kg, batch.standard_feed_in_kg, true)}
              </div>
              <div>
                <p className="mb-1 text-muted small">Hen-Day %</p>
                {getPerformanceIndicator(batch.hd, batch.standard_hen_day_percentage)}
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
    <div className="p-3 bg-light rounded">
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
          <h5 className="mb-3 text-primary">Layer Batches</h5>
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
          <h5 className="mb-3 text-primary">Grower Batches</h5>
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
          <h5 className="mb-3 text-primary">Chick Batches</h5>
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