import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import PageHeader from "./Layout/PageHeader";
import { Modal, Button } from "react-bootstrap"; // Importing Bootstrap Modal for confirmation popup
import { feedApi } from "../services/api";
import { FeedResponse } from '../types/Feed'; // Adjust the import path as necessary
import { toast } from 'react-toastify';

const FeedCard: React.FC<{
  feed: FeedResponse;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}> = React.memo(({ feed, onView, onEdit, onDelete }) => {
  const isLow = (feed.unit === 'kg' && Number(feed.quantity) < 3000) || (feed.unit === 'ton' && Number(feed.quantity) < 3);
  return (
    <div className={`card mb-2 border shadow-sm ${isLow ? 'border-danger' : ''}`} style={isLow ? { background: '#fff0f0' } : {}}>
      <div className="card-body p-2">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="mb-1 text-sm">Title {feed.title}</h6>
            <div className="text-muted text-xs">
              <span className={`me-2 ${isLow ? 'text-danger fw-bold' : ''}`}>Quantity: {feed.quantity}</span>
              <span>{feed.unit}</span>
            </div>
          </div>
          <div className="d-flex flex-column flex-md-row gap-2">
            <button
              className="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center"
              onClick={() => onView(feed.id)}
              title="View Details"
              aria-label={`View Details for Feed ${feed.title}`}
            >
              <i className="bi bi-eye me-1"></i>
              <span className="text-muted text-xs">Feed Details</span>
            </button>
            <button
              className="btn btn-outline-success btn-sm d-flex align-items-center justify-content-center"
              onClick={() => onEdit(feed.id)}
              title="Edit Feed"
              aria-label={`Edit Feed ${feed.title}`}
            >
              <i className="bi bi-pencil-square me-1"></i>
              <span className="text-muted text-xs">Edit Feed</span>
            </button>
            <button
              className="btn btn-outline-danger btn-sm d-flex align-items-center justify-content-center"
              onClick={() => onDelete(feed.id)}
              title="Delete Feed"
              aria-label={`Delete Feed ${feed.title}`}
            >
              <i className="bi bi-trash me-1"></i>
              <span className="text-muted text-xs">Delete</span>
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
  onDelete: (id: number) => void; // New prop for Delete Feed
}

const FeedTable: React.FC<FeedTableProps> = ({ feeds, loading, error, onDelete }) => {
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
        onDelete={onDelete} // Pass the new handler
      />
    ));
  }, [feeds, handleViewDetails, handleEdit, onDelete]);

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

  useEffect(() => {
    const fetchFeedList = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await feedApi.getFeeds();
        const feeds = response.map((feed) => ({
          id: feed.id,
          title: feed.title, // Map name to title
          quantity: feed.quantity,
          unit: feed.unit,
          createdDate: feed.createdDate, // Set lastUsedAt to null
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
  }, []);


  const handleDelete = useCallback(async (id: number) => {
    try {
      await feedApi.deleteFeed(id);
      setFeeds(prevFeed => prevFeed.filter(feed => feed.id !== id));
    } catch (error: any) {
      setError(error?.message || 'Failed to delete feed');
      toast.error(error?.message || 'Failed to delete feed');
    }
  }, []);


  const confirmDelete = () => {
    if (feedToDelete !== null) {
      setFeeds((prevFeeds) => prevFeeds.filter((feed) => feed.id !== feedToDelete));
      setFeedToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const cancelDelete = () => {
    setFeedToDelete(null);
    setShowDeleteModal(false);
  };

  return (
    <div>
      <PageHeader title="Feed List" buttonLabel="Create Feed" buttonLink="/create-feed" />
      <FeedTable feeds={feeds} loading={loading} error={error} onDelete={handleDelete} />

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
  );
};

export default FeedListPage;
