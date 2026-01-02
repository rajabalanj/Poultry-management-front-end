import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Circle, Birdhouse } from "lucide-react";
import { DailyBatch } from "../types/daily_batch";
import ListModal from './Common/ListModal';
import Loading from './Common/Loading';
import { configApi } from "../services/api";

const getPerformanceIndicator = (
  actual: number | undefined,
  standard: number | undefined,
  lowerIsBetter = false,
  deviation = 0
) => {
  if (actual === undefined || standard === undefined || actual === null || standard === null) {
    return <div className="text-muted">-</div>;
  }

  let isGood;
  if (lowerIsBetter) {
    isGood = actual <= standard;
  } else {
    // This is for Hen-Day %
    const adjustedStandard = standard * (1 - deviation / 100);
    isGood = actual >= adjustedStandard;
  }

  const icon = isGood
    ? <Circle className="bg-success text-white rounded-circle" size={20} />
    : <Circle className="bg-danger text-white rounded-circle" size={20} />;

  return icon;
};

const BatchCard: React.FC<{
  batch: DailyBatch;
  onView: (batch_id: number, batchDate: string) => void;
  henDayDeviation: number;
}> = React.memo(({ batch, onView, henDayDeviation }) => {
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
      <div className="card-body px-2">
        <div className="row align-items-center">
          <div className="col-12 col-md-6 d-flex align-items-center">
            <div className="me-3 d-flex align-items-center justify-content-center bg-primary-subtle p-2">
            <Birdhouse className="text-primary" size={24} />
          </div>
            <div>
              <h5 className="mb-1">{batch.batch_no}</h5>
              <p className="text-muted mb-0">Age: {batch.age} weeks</p>
            </div>
          </div>
          <div className="col-12 col-md-6 d-flex justify-content gap-4 mt-3 mt-md-0">
            <div className="text-center">
              <p className="mb-1 text-muted">Feed Intake</p>
              {getPerformanceIndicator(batch.feed_in_kg, batch.standard_feed_in_kg, true)}
            </div>
            <div className="text-center">
              <p className="mb-1 text-muted">Hen-Day %</p>
              {getPerformanceIndicator(batch.hd * 100, batch.standard_hen_day_percentage, false, henDayDeviation)}
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
  const [henDayDeviation, setHenDayDeviation] = useState(0);

  useEffect(() => {
    const fetchHenDayDeviation = async () => {
      try {
        const config = await configApi.getAllConfigs('henDayDeviation');
        if (config && config.length > 0) {
          setHenDayDeviation(parseFloat(config[0].value) || 0);
        }
      } catch (error) {
        console.error("Failed to fetch hen day deviation config", error);
      }
    };
    fetchHenDayDeviation();
  }, []);

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
    <div>
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
          <h5 className="mb-3">Layer Batches</h5>
          {filteredBatches.Layer.map(batch => (
            <BatchCard
              key={`Layer-${batch.batch_id}-${batch.batch_date}`}
              batch={batch}
              onView={handleViewDetails}
              henDayDeviation={henDayDeviation}
            />
          ))}
        </div>
      )}
      {filteredBatches.Grower.length > 0 && (
        <div className="mb-4">
          <h5 className="mb-3">Grower Batches</h5>
          {filteredBatches.Grower.map(batch => (
            <BatchCard
              key={`Grower-${batch.batch_id}-${batch.batch_date}`}
              batch={batch}
              onView={handleViewDetails}
              henDayDeviation={henDayDeviation}
            />
          ))}
        </div>
      )}
      {filteredBatches.Chick.length > 0 && (
        <div className="mb-4">
          <h5 className="mb-3">Chick Batches</h5>
          {filteredBatches.Chick.map(batch => (
            <BatchCard
              key={`Chick-${batch.batch_id}-${batch.batch_date}`}
              batch={batch}
              onView={handleViewDetails}
              henDayDeviation={henDayDeviation}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BatchTable;
