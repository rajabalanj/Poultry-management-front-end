import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { compositionApi } from "../services/api";
import PageHeader from "./Layout/PageHeader";
import { Modal, Button } from "react-bootstrap";
import { toast } from "react-toastify";

interface UsageHistoryItem {
  id: number;
  composition_id: number;
  times: number;
  used_at: string;
  shed_no: string;
}

interface Composition {
  id: number;
  name: string;
  feeds: { feed_id: number; weight: number }[];
}

const CompositionUsageHistory = () => {
  const { compositionId } = useParams<{ compositionId: string }>();
  const [history, setHistory] = useState<UsageHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composition, setComposition] = useState<Composition | null>(null);
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [usageToRevert, setUsageToRevert] = useState<number | null>(null);


  useEffect(() => {
    const fetchHistory = async () => {
      console.log("compositionId:", compositionId);
      try {
        if (!compositionId) return;
        setLoading(true);
        // Fetch history and composition details in parallel
        // Note: Assumes a `getComposition` method exists in your API service.
        const [historyData, compositionData] = await Promise.all([
          compositionApi.getCompositionUsageHistoryById(Number(compositionId)),
          compositionApi.getComposition(Number(compositionId)), // Assuming this exists
        ]);
        setHistory(historyData);
        // console.log("Fetched composition usage history:", historyData);
        setComposition(compositionData);
        console.log("Fetched composition usage history:", historyData);  // <-- Add this
      } catch (err) {
        setError("Failed to load usage history or composition details");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [compositionId]);

  const compositionUnitWeight = useMemo(() => {
    if (!composition) return 0;
    return composition.feeds.reduce((sum, feed) => sum + feed.weight, 0);
  }, [composition]);

  return (
    <>
    <PageHeader
        title={composition ? `Usage History for "${composition.name}"` : "Composition Usage History"}
        buttonLabel="Back to Feed Mill"
        buttonLink="/feed-mill-stock"
      />
    <div className="container-fluid">
      
      {loading && <div>Loading...</div>}
      {error && <div className="text-danger">{error}</div>}
      {!loading && !error && (
        <div className="table-responsive">
          <table className="table table-bordered mt-3">
            <thead>
              <tr>
                <th>Date</th>
                <th>Times Used</th>
                <th>Total Weight (kg)</th>
                <th>Shed</th>
                <th>Actions</th> {/* New column for the button */}
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center">No usage history found.</td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.used_at).toLocaleDateString()}</td>
                    <td>{item.times}</td>
                    <td>{compositionUnitWeight * item.times}</td>
                    <td>{item.shed_no}</td>
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
      )}
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
