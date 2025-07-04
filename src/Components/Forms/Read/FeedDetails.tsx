import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { feedApi } from "../../../services/api";
import { Feed } from "../../../types/Feed";
import { toast } from "react-toastify";
import PageHeader from "../../Layout/PageHeader";

const FeedDetails: React.FC = () => {
  const { feed_id } = useParams<{ feed_id: string }>();
  const navigate = useNavigate();
  const [feed, setFeed] = useState<Feed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        if (!feed_id) return;
        const data = await feedApi.getFeed(Number(feed_id));
        setFeed(data);
      } catch (err) {
        console.error("Error fetching feed:", err);
        setError("Failed to load feed");
        toast.error("Failed to load feed details");
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, [feed_id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!feed) return <div>Feed not found</div>;

  return (
    <div className="container-fluid">
      <PageHeader
        title={`Feed Details - ${feed.title}`}
        buttonLabel="Back"
        buttonLink="/feed"
      />

      <div className="p-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-6">
            <div className="mb-4">
              <label className="form-label">Feed Name</label>
              <input
                type="text"
                className="form-control"
                value={feed.title}
                disabled
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Quantity</label>
              <input
                type="number"
                className="form-control"
                value={feed.quantity}
                disabled
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Unit</label>
              <select className="form-control" value={feed.unit} disabled>
                <option value="kg">kg</option>
                <option value="ton">ton</option>
              </select>
            </div>

            {/* New Warning Threshold Fields */}
            <div className="mb-4">
              <label className="form-label">Warning Threshold (kg)</label>
              <input
                type="number"
                className="form-control"
                value={feed.warningKgThreshold !== undefined ? feed.warningKgThreshold : ''}
                disabled
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Warning Threshold (ton)</label>
              <input
                type="number"
                className="form-control"
                value={feed.warningTonThreshold !== undefined ? feed.warningTonThreshold : ''}
                disabled
              />
            </div>

          </div>
        </div>

        <div className="mt-4 d-flex justify-content-center gap-3">
          <button
    type="button"
    className="btn btn-primary"
    onClick={() => navigate(`/feed/${feed.id}/audit`)}
  >
    View Report
  </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedDetails;