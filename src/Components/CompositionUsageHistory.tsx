import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { compositionApi } from "../services/api";
import PageHeader from "./Layout/PageHeader";

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
    <div className="container-fluid">
      <PageHeader
        title={composition ? `Usage History for "${composition.name}"` : "Composition Usage History"}
        buttonLabel="Back to Feed Mill"
        buttonLink="/feed-mill-stock"
      />
      {loading && <div>Loading...</div>}
      {error && <div className="text-danger">{error}</div>}
      {!loading && !error && (
        <table className="table table-bordered mt-3">
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Times Used</th>
              <th>Total Weight Used (kg)</th>
              <th>Shed</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center">No usage history found.</td>
              </tr>
            ) : (
              history.map((item, idx) => (
                <tr key={item.id}>
                  <td>{idx + 1}</td>
                  <td>{new Date(item.used_at).toLocaleDateString()}</td>
                  <td>{item.times}</td>
                  <td>{compositionUnitWeight * item.times}</td>
                  <td>{item.shed_no}</td>
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
