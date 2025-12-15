import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { compositionApi, batchApi } from "../services/api";
import PageHeader from "./Layout/PageHeader";
import { Modal, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import { CompositionResponse } from "../types/compositon";
import { BatchResponse } from "../types/batch";
import { toPng } from 'html-to-image';
import { exportTableToExcel } from '../utility/export-utils';
import Loading from './Common/Loading';

interface UsageHistoryItem {
  id: number;
  composition_id: number;
  times: number;
  used_at: string;
  batch_id?: number;
  composition_name?: string;
  items?: { inventory_item_id: number; inventory_item_name?: string; weight: number; unit?: string }[];
}

const CompositionUsageHistory = () => {
  const { compositionId } = useParams<{ compositionId: string }>();
  const [history, setHistory] = useState<UsageHistoryItem[]>([]);
  const [batches, setBatches] = useState<BatchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composition, setComposition] = useState<CompositionResponse | null>(null);
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [usageToRevert, setUsageToRevert] = useState<number | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);


  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        if (compositionId) {
          const [usageData, compositionData] = await Promise.all([
            compositionApi.getCompositionUsageHistoryById(Number(compositionId)),
            compositionApi.getComposition(Number(compositionId)),
          ]);
          setHistory(usageData);
          setComposition(compositionData);
        } else {
          const usageData = await compositionApi.getCompositionUsageHistory();
          setHistory(usageData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load usage history");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [compositionId]);

  useEffect(() => { // This useEffect should probably not be here if batches are many.
    const fetchBatches = async () => {
      try {
        const availableBatches = await batchApi.getBatches();
        setBatches(availableBatches);
      } catch (error) {
        console.error('Failed to fetch batches:', error);
      }
    };
    fetchBatches();
  }, []);

  // Helper function to get batch number by batch ID
  const getBatchNumber = (batchId: number | undefined) => {
    if (!batchId) return 'No Batch';
    const batch = batches.find(b => b.id === batchId);
    return batch ? batch.batch_no : 'Unknown Batch';
  };

  const getCompositionWeight = (item: UsageHistoryItem) => {
    if (item.items) {
      return item.items.reduce((sum, compItem) => sum + compItem.weight, 0);
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


  return (
    <>
    <PageHeader
        title={composition ? `Usage History for "${composition.name}"` : "Composition Usage History"}
        buttonLabel="Back to Feed Mill"
        buttonLink="/feed-mill-stock"
        buttonIcon="bi-arrow-left"
      />
    <div className="container">
      
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
                <th>Batch</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={compositionId ? 5 : 6} className="text-center">No usage history found.</td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.used_at).toLocaleDateString()}</td>
                    {!compositionId && <td>{item.composition_name}</td>}
                    <td>{item.times}</td>
                    <td>{getCompositionWeight(item) * item.times}</td>
                    <td>{getBatchNumber(item.batch_id)}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => {
                          setUsageToRevert(item.id);
                          setShowRevertModal(true);
                        }}

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