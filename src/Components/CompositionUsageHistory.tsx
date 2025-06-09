import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { compositionApi } from "../services/api";

interface UsageHistoryItem {
  id: number;
  composition_id: number;
  times: number;
  used_at: string;
  // Add more fields as returned by your backend if needed
}

const CompositionUsageHistory = () => {
  const { compositionId } = useParams<{ compositionId: string }>();
  const navigate = useNavigate();
  const [history, setHistory] = useState<UsageHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await compositionApi.getCompositionUsageHistoryById(Number(compositionId));
        setHistory(data);
      } catch (err) {
        setError("Failed to load usage history");
      } finally {
        setLoading(false);
      }
    };
    if (compositionId) fetchHistory();
  }, [compositionId]);

  return (
    <div className="container py-3">
      <div className="mb-3 d-flex align-items-center gap-2">
        <button className="btn btn-secondary btn-sm" onClick={() => navigate("/feed-mill-stock")}>
          Back
        </button>
        <h4 className="mb-0 ms-3">Composition Usage History</h4>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div className="text-danger">{error}</div>}
      {!loading && !error && (
        <table className="table table-bordered mt-3">
          <thead>
            <tr>
              <th>#</th>
              <th>Times Used</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center">No usage history found.</td>
              </tr>
            ) : (
              history.map((item, idx) => (
                <tr key={item.id}>
                  <td>{idx + 1}</td>
                  <td>{item.times}</td>
                  <td>{item.used_at}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CompositionUsageHistory;
