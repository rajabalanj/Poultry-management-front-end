import React, { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
// import { Batch } from "../services/api"; //  Make sure this Batch interface is correct.
import "../styles/global.css";
// import { Button } from '@/components/ui/button'; // Assuming you have shadcn/ui.  If not, use Bootstrap.

// Mock interface.  Replace with your actual Batch interface.
interface Feed {
  id: number;
  title: string;
  quantity: number;
  unit: string;
  lastUsedAt: string | null;
}

const FeedCard: React.FC<{
  feed: Feed;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onAddFeed: (batchId: number) => void; // New prop for Add Feed
}> = React.memo(({ feed, onView, onEdit, onAddFeed }) => (
  <div className="card mb-2 border shadow-sm">
    <div className="card-body p-2">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h6 className="mb-1 text-sm">Title {feed.title}</h6>
          <div className="text-muted text-xs">
            <span className="me-2">Quantity: {feed.quantity}</span>
            <span>{feed.unit}</span>
          </div>
        </div>
        <div className="d-flex flex-column flex-md-row gap-2">
          <button
            className="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center"
            onClick={() => onView(feed.id)}
            title="View Details"
            aria-label={`View Details for Batch ${feed.title}`}
          >
            <i className="bi bi-eye me-1"></i>
            <span className="text-muted text-xs">Feed Report</span>
          </button>
          <button
            className="btn btn-outline-success btn-sm d-flex align-items-center justify-content-center"
            onClick={() => onEdit(feed.id)}
            title="Edit Feed"
            aria-label={`Edit Batch ${feed.title}`}
          >
            <i className="bi bi-pencil-square me-1"></i>
            <span className="text-muted text-xs">Daily Report</span>
          </button>
        </div>
      </div>
    </div>
  </div>
));

interface FeedTableProps {
  feeds: Feed[];
  loading: boolean;
  error: string | null;
}

const FeedTable: React.FC<FeedTableProps> = ({ feeds, loading, error }) => {
  const navigate = useNavigate();

  const handleViewDetails = useCallback(
    (id: number) => {
      if (!id) {
        console.error("Feed ID is required");
        return;
      }
      navigate(`/feed/${id}/details`);
    },
    [navigate]
  );

  const handleEdit = useCallback(
    (id: number) => {
      if (!id) {
        console.error("Feed ID is required");
        return;
      }
      navigate(`/feed/${id}/edit`); //  Keep original edit
    },
    [navigate]
  );

  const handleAddFeed = useCallback(
    (batchId: number) => {
      if (!batchId) {
        console.error("Feed ID is required to add feed");
        return;
      }
      navigate(`/add-feed?feedId=${batchId}`); // Navigate to CreateFeedForm with batchId
    },
    [navigate]
  );

  const feedCards = useMemo(() => {
    return feeds.map((feed) => (
      <FeedCard
        key={feed.id}
        feed={feed}
        onView={handleViewDetails}
        onEdit={handleEdit}
        onAddFeed={handleAddFeed} // Pass the new handler
      />
    ));
  }, [feeds, handleViewDetails, handleEdit, handleAddFeed]);

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-center text-danger">{error}</div>;
  if (feeds.length === 0) return <div className="text-center">No feeds found</div>;

  return <div className="px-2">{feedCards}</div>;
};

const FeedListPage = () => {
    const dummyFeeds: Feed[] = [
        { id: 1, title: "Maize", quantity: 100, unit: "kg", lastUsedAt: null },
        { id: 2, title: "Soybean Meal", quantity: 50, unit: "kg", lastUsedAt: "2024-07-28T10:00:00Z" },
        { id: 3, title: "Rice Bran", quantity: 75, unit: "kg", lastUsedAt: null },
    ];

    const [loading, setLoading] = React.useState(false); // You'd fetch this data, so start with loading true
    const [error, setError] = React.useState<string | null>(null);
    const [feeds, setFeeds] = React.useState<Feed[]>([]);

     React.useEffect(() => {
        // Simulate fetching data
        setLoading(true);
        setTimeout(() => {
            try{
                setFeeds(dummyFeeds); // Replace with your actual data fetching logic
            } catch(e: any) {
                setError(e.message);
            }

            setLoading(false); // Set loading to false when data is received
        }, 500);
    }, []);

    return (
        <div>
            <h1>Feed List</h1>
            <FeedTable feeds={feeds} loading={loading} error={error} />
        </div>
    );
};

export default FeedListPage;
