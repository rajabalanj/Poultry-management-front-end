import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { feedApi } from "../../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../Layout/PageHeader";
import { FeedResponse } from "../../../types/Feed"; // Adjust the import path as necessary

const EditFeed: React.FC = () => {
  const { feed_id } = useParams<{ feed_id: string }>();
  const navigate = useNavigate();
  const [feed, setFeed] = useState<FeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // New state for warning thresholds
  const [warningKgThreshold, setWarningKgThreshold] = useState<number | ''>('');
  const [warningTonThreshold, setWarningTonThreshold] = useState<number | ''>('');

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        if (!feed_id) return;
        const data = await feedApi.getFeed(Number(feed_id));
        setFeed(data);
        // Initialize warning thresholds from fetched data
        setWarningKgThreshold(data.warningKgThreshold !== undefined ? data.warningKgThreshold : '');
        setWarningTonThreshold(data.warningTonThreshold !== undefined ? data.warningTonThreshold : '');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feed || !feed_id) return;

    try {
      await feedApi.updateFeed(Number(feed_id), {
        id: Number(feed_id),
        title: feed.title,
        quantity: feed.quantity,
        unit: feed.unit,
        createdDate: feed.createdDate,
        warningKgThreshold: typeof warningKgThreshold === 'number' ? warningKgThreshold : undefined,
        warningTonThreshold: typeof warningTonThreshold === 'number' ? warningTonThreshold : undefined,
      });
      toast.success("Feed updated successfully");
      navigate(-1);
    } catch (err) {
      console.error("Error updating feed:", err);
      setError("Failed to update feed");
      toast.error("Failed to update feed");
    }
  };

  const handleInputChange = (value: string, field: keyof FeedResponse) => {
    setFeed((prev: FeedResponse | null) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || (/^\d+(\.\d{0,2})?$/.test(value) && Number(value) >= 0)) {
        handleInputChange(value, "quantity");
    }
  };

  const handleWarningKgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || (/^\d+(\.\d{0,2})?$/.test(value) && Number(value) >= 0)) {
      setWarningKgThreshold(value === '' ? '' : Number(value));
      if (value !== '') {
        setWarningTonThreshold(Number(value) / 1000); // Convert kg to ton
      } else {
        setWarningTonThreshold('');
      }
    }
  };

  const handleWarningTonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || (/^\d+(\.\d{0,2})?$/.test(value) && Number(value) >= 0)) {
      setWarningTonThreshold(value === '' ? '' : Number(value));
      if (value !== '') {
        setWarningKgThreshold(Number(value) * 1000); // Convert ton to kg
      } else {
        setWarningKgThreshold('');
      }
    }
  };


  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!feed) return <div>Feed not found</div>;

  return (
    <>
    <PageHeader
        title={`Update Feed ${feed.title}`}
        buttonLabel="Back"
        buttonLink={`/feed/${feed_id}/details`}
      />
    <div className="container-fluid">
      <div className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-12 col-md-6">
              <div className="mb-4">
                <label className="form-label">Feed Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={feed.title}
                  onChange={(e) => handleInputChange(e.target.value, "title")}
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Quantity</label>
                <input
                  type="number"
                  className="form-control"
                  value={feed.quantity}
                  onChange={handleQuantityChange}
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Unit</label>
                <select
                  className="form-control"
                  value={feed.unit}
                  onChange={(e) => handleInputChange(e.target.value, "unit")}
                >
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
                  value={warningKgThreshold}
                  onChange={handleWarningKgChange}
                  placeholder="e.g., 2000"
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Warning Threshold (ton)</label>
                <input
                  type="number"
                  className="form-control"
                  value={warningTonThreshold}
                  onChange={handleWarningTonChange}
                  placeholder="e.g., 2"
                />
              </div>

            </div>
          </div>

          <div className="mt-4 d-flex justify-content-center">
            <button type="submit" className="btn btn-primary me-2">
              Save Changes
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default EditFeed;