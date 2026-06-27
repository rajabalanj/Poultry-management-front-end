import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { compositionApi, batchApi, getTenantId, tenantFeatureApi } from "../services/api";
import PageHeader from "./Layout/PageHeader";
import { Modal, Button, Card, Row, Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { CompositionResponse, CompositionUsage } from "../types/compositon";
import { BatchResponse } from "../types/batch";
import { toPng } from 'html-to-image';
import { exportTableToExcel } from '../utility/export-utils';
import Loading from './Common/Loading';
import CustomDatePicker from './Common/CustomDatePicker';
import { toYYYYMMDD } from '../utility/date-utils';
import { useSubscription } from "./context/SubscriptionContext";
import SubscriptionWarning from "./Common/SubscriptionWarning";
import CustomPagination from "./Common/CustomPagination";

const CompositionUsageHistory = () => {
  const { compositionId } = useParams<{ compositionId: string }>();
  const [history, setHistory] = useState<CompositionUsage[]>([]);
  const [batches, setBatches] = useState<BatchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composition, setComposition] = useState<CompositionResponse | null>(null);
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [usageToRevert, setUsageToRevert] = useState<number | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const ITEMS_PER_PAGE = 10;
  const { isSubscriptionPaid } = useSubscription();
  const [isBatchRestricted, setIsBatchRestricted] = useState(false);


  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;
        const limit = ITEMS_PER_PAGE;

        const startDateStr = startDate ? toYYYYMMDD(startDate) : undefined;
        const endDateStr = endDate ? toYYYYMMDD(endDate) : undefined;

        const response = compositionId
          ? await compositionApi.getCompositionUsageHistoryById(Number(compositionId), offset, limit, startDateStr, endDateStr)
          : await compositionApi.getCompositionUsageHistory(offset, limit, startDateStr, endDateStr);
        
        setHistory(response.data);
        setTotalItems(response.total);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load usage history";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [compositionId, currentPage, startDate, endDate]);

  useEffect(() => {
    const fetchStaticData = async () => {
      let restricted = false;
      try {
        const tenantId = getTenantId();
        if (tenantId) {
          const features = await tenantFeatureApi.getTenantFeaturesByTenantId(tenantId);
          restricted = features.some(f => f.feature_name === 'BATCH_MANAGEMENT' && f.is_restricted);
          setIsBatchRestricted(restricted);
        }
      } catch (e) {}

      const batchPromise = restricted ? Promise.resolve([]) : batchApi.getBatches();
      const compositionPromise = compositionId ? compositionApi.getComposition(Number(compositionId)) : Promise.resolve(null);
      
      const [batchesResult, compositionResult] = await Promise.allSettled([batchPromise, compositionPromise]);
      
      if (batchesResult.status === 'fulfilled') {
        setBatches(batchesResult.value);
      } else {
        console.error('Failed to fetch batches data:', batchesResult.reason);
      }

      if (compositionResult.status === 'fulfilled') {
        setComposition(compositionResult.value);
      } else {
        console.error('Failed to fetch composition data:', compositionResult.reason);
        toast.error('Failed to load composition data.');
      }
    };
    fetchStaticData();
  }, [compositionId]);

  // Helper function to get batch number by batch ID
  const getBatchNumber = (batchId: number | undefined) => {
    if (!batchId) return 'No Batch';
    const batch = batches.find(b => b.id === batchId);
    return batch ? batch.batch_no : 'Unknown Batch';
  };

  const getCompositionWeight = (item: CompositionUsage) => {
    if (item.items) {
      return item.items.reduce((sum: number, compItem: { weight: string | number }) => sum + Number(compItem.weight || 0), 0);
    }
    return 0;
  };

  const handleExport = () => {
    exportTableToExcel('composition-usage-history-table', 'composition_usage_history', 'Composition Usage History');
  };

  const handleShareAsImage = async () => {
    if (!tableRef.current) {
      toast.error("Table element not found.");
      return;
    }

    if (!navigator.share) {
      toast.error("Web Share API is not supported in your browser.");
      return;
    }

    const tableNode = tableRef.current;
    setIsSharing(true);

    try {
      const dataUrl = await toPng(tableNode, {
        backgroundColor: '#ffffff',
        style: { padding: '10px' }
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `composition-usage-history.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Composition Usage History',
          text: `Composition Usage History`,
          files: [file],
        });
        toast.success("Report shared successfully!");
      } else {
        toast.error("Sharing files is not supported on this device.");
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Sharing failed', error);
        toast.error(`Failed to share report: ${error.message}`);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <>
    <PageHeader
        title={composition ? `Usage History for "${composition.name}"` : "Composition Usage History"}
        buttonLabel="Back to Feed Mill"
        buttonLink="/feed-mill-stock"
        buttonIcon="bi-arrow-left"
      />
    <div className="container">
      <SubscriptionWarning />
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Date Filters</Card.Title>
          <Row>
            <Col md={6}>
              <div className="mb-3">
                <label htmlFor="startDate" className="form-label">Start Date</label>
                <CustomDatePicker
                  id="startDate"
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  placeholderText="Select start date"
                  isClearable
                  maxDate={endDate ?? undefined}
                />
              </div>
            </Col>
            <Col md={6}>
              <div className="mb-3">
                <label htmlFor="endDate" className="form-label">End Date</label>
                <CustomDatePicker
                  id="endDate"
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  placeholderText="Select end date"
                  isClearable
                  minDate={startDate ?? undefined}
                />
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {loading && <Loading message="Loading data..." />}
      {error && <div className="text-danger">{error}</div>}
      {!loading && !error && (
        <>
        <div className="mb-3 d-flex justify-content-end gap-2">
            <Button variant="success" onClick={handleExport} disabled={history.length === 0 || loading}>
              Export to Excel
            </Button>
            <Button variant="secondary" onClick={handleShareAsImage} disabled={isSharing || history.length === 0 || loading}>
              {isSharing ? 'Generating...' : 'Share as Image'}
            </Button>
          </div>
        <div className="table-responsive" ref={tableRef}>
          <table className="table table-bordered mt-3" id="composition-usage-history-table">
            <thead>
              <tr>
                <th>Date</th>
                {!compositionId && <th>Composition</th>}
                <th>Times Used</th>
                <th>Total Weight (kg)</th>
                <th>Variance Weight (kg)</th>
                {!isBatchRestricted && <th>Batch</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={compositionId ? (isBatchRestricted ? 5 : 6) : (isBatchRestricted ? 6 : 7)} className="text-center">No usage history found.</td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.used_at).toLocaleDateString()}</td>
                    {!compositionId && <td>{item.composition_name}</td>}
                    <td>{Number(item.times)}</td>
                    <td>{(getCompositionWeight(item) * Number(item.times)).toFixed(2)}</td>
                    <td>{item.feed_variance_weight ? (Number(item.feed_variance_weight) > 0 ? '+' : '') + Number(item.feed_variance_weight).toFixed(2) : '0.00'}</td>
                    {!isBatchRestricted && <td>{getBatchNumber(item.batch_id)}</td>}
                    <td>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => {
                          setUsageToRevert(item.id);
                          setShowRevertModal(true);
                        }}
                        disabled={isSubscriptionPaid === false}
                      >
                        Revert
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>
        <CustomPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          className="justify-content-center"
        />
        </>)}
      <Modal show={showRevertModal} onHide={() => setShowRevertModal(false)}>
  <Modal.Header closeButton>
    <Modal.Title>Confirm Revert</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    Are you sure you want to revert this composition usage? This action will restore the used feed quantities.
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowRevertModal(false)}>
      Cancel
    </Button>
    <Button
      variant="danger"
      onClick={async () => {
        if (!usageToRevert) return;
        try {
          await compositionApi.revertCompositionUsage(usageToRevert);
          setHistory(prev => prev.filter(h => h.id !== usageToRevert));
          toast.success("Reverted successfully");
        } catch (err: any) {
          toast.error(err.message || "Failed to revert");
        } finally {
          setUsageToRevert(null);
          setShowRevertModal(false);
        }
      }}
      disabled={ isSubscriptionPaid === false}
    >
      Revert
    </Button>
  </Modal.Footer>
</Modal>
    </div>
    </>
  );
};

export default CompositionUsageHistory;