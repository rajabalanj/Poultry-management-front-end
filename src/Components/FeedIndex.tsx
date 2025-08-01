import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import PageHeader from "./Layout/PageHeader";
import { Modal, Button } from "react-bootstrap";
import { feedApi, configApi } from "../services/api"; // Ensure configApi is imported
import { FeedResponse } from '../types/Feed';
import { toast } from 'react-toastify';

const FeedCard: React.FC<{
  feed: FeedResponse;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  lowKgThreshold: number; // Prop for global threshold
  lowTonThreshold: number; // Prop for global threshold
}> = React.memo(({ feed, onView, onEdit, onDelete, lowKgThreshold, lowTonThreshold }) => {
  // Use feed-specific thresholds if available, otherwise fall back to global ones
   const effectiveLowKgThreshold = feed.warningKgThreshold ?? lowKgThreshold;
  const effectiveLowTonThreshold = feed.warningTonThreshold ?? lowTonThreshold;

  const isLow = (feed.unit === 'kg' && effectiveLowKgThreshold !== undefined && Number(feed.quantity) < effectiveLowKgThreshold) ||
                (feed.unit === 'ton' && effectiveLowTonThreshold !== undefined && Number(feed.quantity) < effectiveLowTonThreshold);

  return (
    <div className={`card mb-2 mt-2 border shadow-sm ${isLow ? 'border-warning' : ''}`} style={isLow ? { background: '#fff0f0' } : {}}>
      <div className="card-body p-2">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="mb-1">Title: {feed.title}</h6>
            <div className="text-sm">
              <span className={`me-2 ${isLow ? 'text-warning fw-bold' : ''}`}>Quantity: {feed.quantity}{' '}
              <span>{feed.unit}</span></span>
              {/* Display per-feed warning thresholds if they exist */}
              {feed.warningKgThreshold !== undefined && (
                <p className="mb-0 text-sm">Per-feed Warning (kg): {feed.warningKgThreshold}</p>
              )}
              {/* Optionally, display the effective global thresholds if no per-feed is set, for debugging */}
              {feed.warningKgThreshold === undefined && lowKgThreshold !== undefined && (
                <p className="mb-0 text-sm">(Global fallback Warning (kg): {lowKgThreshold})</p>
              )}
            </div>
          </div>
          <div className="d-flex flex-column flex-md-row gap-2">
            <button
              className="btn btn-info btn-sm d-flex align-items-center justify-content-center"
              onClick={() => onView(feed.id)}
              title="View Details"
              aria-label={`View Details for Feed ${feed.title}`}
            >
              <i className="bi bi-eye me-1"></i>
              <span className="text-sm">Feed Details</span>
            </button>
            <button
              className="btn btn-success btn-sm d-flex align-items-center justify-content-center"
              onClick={() => onEdit(feed.id)}
              title="Edit Feed"
              aria-label={`Edit Feed ${feed.title}`}
            >
              <i className="bi bi-pencil-square me-1"></i>
              <span className="text-sm">Edit Feed</span>
            </button>
            <button
              className="btn btn-danger btn-sm d-flex align-items-center justify-content-center"
              onClick={() => onDelete(feed.id)}
              title="Delete Feed"
              aria-label={`Delete Feed ${feed.title}`}
            >
              <i className="bi bi-trash me-1"></i>
              <span className="text-sm">Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

interface FeedTableProps {
  feeds: FeedResponse[];
  loading: boolean;
  error: string | null;
  onDelete: (id: number) => void;
  lowKgThreshold: number; // Prop from FeedListPage
  lowTonThreshold: number; // Prop from FeedListPage
}

const FeedTable: React.FC<FeedTableProps> = ({ feeds, loading, error, onDelete, lowKgThreshold, lowTonThreshold }) => {
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
      navigate(`/feed/${id}/edit`);
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
        onDelete={onDelete}
        lowKgThreshold={lowKgThreshold} // Pass global threshold to FeedCard
        lowTonThreshold={lowTonThreshold} // Pass global threshold to FeedCard
      />
    ));
  }, [feeds, handleViewDetails, handleEdit, onDelete, lowKgThreshold, lowTonThreshold]);

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-center text-danger">{error}</div>;
  if (feeds.length === 0) return <div className="text-center">No feeds found</div>;

  return <div className="px-2">{feedCards}</div>;
};

const FeedListPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feeds, setFeeds] = useState<FeedResponse[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [feedToDelete, setFeedToDelete] = useState<number | null>(null);
  // States for global thresholds, initialized with defaults
  const [lowKgThreshold, setLowKgThreshold] = useState(3000);
  const [lowTonThreshold, setLowTonThreshold] = useState(3);

  // Effect to fetch global configuration for thresholds
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configs = await configApi.getAllConfigs();
        const kgConfig = configs.find(c => c.name === 'lowKgThreshold');
        const tonConfig = configs.find(c => c.name === 'lowTonThreshold');
        // Update states with fetched values or keep defaults
        setLowKgThreshold(kgConfig ? Number(kgConfig.value) : 3000);
        setLowTonThreshold(tonConfig ? Number(tonConfig.value) : 3);
      } catch (err: any) {
        toast.error(err.message || 'Failed to load configuration');
      }
    };
    fetchConfig();
  }, []); // Run once on component mount

  // Effect to fetch feed list
  useEffect(() => {
    const fetchFeedList = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await feedApi.getFeeds();
        const feeds = response.map((feed) => ({
          id: feed.id,
          title: feed.title,
          quantity: feed.quantity,
          unit: feed.unit,
          createdDate: feed.createdDate,
          warningKgThreshold: feed.warningKgThreshold,
          warningTonThreshold: feed.warningTonThreshold,
        }));
        setFeeds(feeds);
      } catch (error: any) {
        setError(error?.message || 'Failed to fetch feed list');
        toast.error(error?.message || 'Failed to fetch feed list');
      } finally {
        setLoading(false);
      }
    };
    fetchFeedList();
  }, []); // Run once on component mount

  const handleDelete = useCallback((id: number) => {
    setFeedToDelete(id);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = async () => {
    if (feedToDelete !== null) {
      try {
        await feedApi.deleteFeed(feedToDelete);
        setFeeds((prevFeeds) => prevFeeds.filter((feed) => feed.id !== feedToDelete));
        toast.success("Feed deleted successfully!");
      } catch (error: any) {
        setError(error?.message || 'Failed to delete feed');
        toast.error(error?.message || 'Failed to delete feed');
      } finally {
        setFeedToDelete(null);
        setShowDeleteModal(false);
      }
    }
  };

  const cancelDelete = () => {
    setFeedToDelete(null);
    setShowDeleteModal(false);
  };

  return (
    <>
    <PageHeader title="Feed List" buttonVariant="primary" buttonLabel="Create Feed" buttonLink="/create-feed" />
    <div>
      <FeedTable
        feeds={feeds}
        loading={loading}
        error={error}
        onDelete={handleDelete}
        lowKgThreshold={lowKgThreshold} // Pass global threshold to FeedTable
        lowTonThreshold={lowTonThreshold} // Pass global threshold to FeedTable
      />
      <Modal show={showDeleteModal} onHide={cancelDelete}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this feed?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelDelete}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
    </>
  );
};

export default FeedListPage;