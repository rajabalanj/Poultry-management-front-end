import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { feedApi } from "../../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../Layout/PageHeader";
import { FeedResponse } from "../../../types/Feed"; // Adjust the import path as necessary

const EditFeed: React.FC = () => {
  const { feedId } = useParams<{ feedId: string }>();
  const navigate = useNavigate();
  const [feed, setFeed] = useState<FeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        if (!feedId) return;
        const data = await feedApi.getFeed(Number(feedId));
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
  }, [feedId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feed || !feedId) return;

    try {
      await feedApi.updateFeed(Number(feedId), {
      id: Number(feedId),
      title: feed.title,
      quantity: feed.quantity,
      unit: feed.unit,
      createdDate: feed.createdDate,});
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!feed) return <div>Feed not found</div>;

  return (
    <div className="container-fluid">
      <PageHeader
        title={`Update Feed ${feed.title}`}
        buttonLabel="Back"
        buttonLink={`/feed/${feedId}/details`}
      />

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
                  onChange={(e) => handleInputChange(e.target.value, "quantity")}
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
  );
};

export default EditFeed;