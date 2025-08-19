import React from 'react';
import { Feed, FeedResponse } from '../types/Feed'; 
import { FeedInComposition } from '../types/compositon';

interface CompositionFormProps {
  title: string;
  initialCompName?: string;
  onCompNameChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  search: string;
  handleFeedSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  filteredFeeds: FeedResponse[];
  editFeeds: FeedInComposition[];
  feeds: FeedResponse[];
  handleAddFeed: (feed: Feed) => void;
  handleRemoveFeed: (feed_id: number) => void;
  handleFeedWeightChange: (feed_id: number, weight: number) => void;
  onSave: () => void;
  saveButtonLabel: string;
  onCancel: () => void;
  onOpenCreateFeed?: () => void;
}

function CompositionForm({
  title,
  initialCompName,
  onCompNameChange,
  search,
  handleFeedSearch,
  filteredFeeds,
  editFeeds,
  feeds,
  handleAddFeed,
  handleRemoveFeed,
  handleFeedWeightChange,
  onSave,
  saveButtonLabel,
  onCancel,
  onOpenCreateFeed,
}: CompositionFormProps) {
  return (
    <div className="mt-3">
      <h4>{title}</h4>
      <div className="row">
        <div className="mb-3 col-12 col-md-6">
        {initialCompName !== undefined && onCompNameChange && (
            <input
              type="text"
              className="form-control form-control-sm mb-2"
              placeholder="Composition Name"
              value={initialCompName}
              onChange={onCompNameChange}
            />
          )}
          <ul className="list-group mb-3">
            {editFeeds.map((f) => {
              const feed = feeds.find((fd) => fd.id === f.feed_id);
              if (!feed) return null;
              return (
                <li
                  key={f.feed_id}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <span>{feed.title}</span>
                  <div className="d-flex align-items-center gap-2">
                    <input
                      type="number"
                      className="form-control form-control-sm w-auto"
                      value={f.weight}
                      min={0}
                      onChange={(e) =>
                        handleFeedWeightChange(f.feed_id, Number(e.target.value))
                      }
                      style={{ width: '70px' }}
                    />
                    <span className="text-muted">kg</span>
                    <button
                      onClick={() => handleRemoveFeed(f.feed_id)}
                      className="btn btn-sm btn-danger"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="mb-3 col-12 col-md-6">
          <div className="d-flex gap-2 align-items-center mb-2">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search Feeds..."
              value={search}
              onChange={handleFeedSearch}
            />
            {onOpenCreateFeed && (
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={onOpenCreateFeed}
                title="Create Feed"
              >
                <i className="bi bi-plus-lg"></i>
              </button>
            )}
          </div>
          <div
            className="list-group"
            style={{ maxHeight: '150px', overflowY: 'auto' }}
          >
            {filteredFeeds
              .filter((f) => !editFeeds.some((ef) => ef.feed_id === f.id))
              .map((feed) => (
                <button
                  key={feed.id}
                  onClick={() => handleAddFeed(feed)}
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                    editFeeds.some((ef) => ef.feed_id === feed.id) ? 'disabled' : ''
                  }`}
                  disabled={editFeeds.some((ef) => ef.feed_id === feed.id)}
                >
                  {feed.title}
                  <i className="bi bi-plus-circle-fill text-success"></i>
                </button>
              ))}
          </div>
        </div>
      </div>
      <div className="d-flex gap-2">
        <button onClick={onSave} className="btn btn-primary">
          <i className="bi bi-save me-1"></i>{saveButtonLabel}
        </button>
        <button onClick={onCancel} className="btn btn-secondary">
          <i className="bi bi-x-lg me-1"></i>Cancel
        </button>
      </div>
    </div>
  );
}

export default CompositionForm;