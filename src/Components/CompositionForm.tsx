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
  handleRemoveFeed: (feedId: number) => void;
  handleFeedWeightChange: (feedId: number, weight: number) => void;
  onSave: () => void;
  saveButtonLabel: string;
  onCancel: () => void;
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
              const feed = feeds.find((fd) => fd.id === f.feedId);
              if (!feed) return null;
              return (
                <li
                  key={f.feedId}
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
                        handleFeedWeightChange(f.feedId, Number(e.target.value))
                      }
                      style={{ width: '70px' }}
                    />
                    <span className="text-muted">kg</span>
                    <button
                      onClick={() => handleRemoveFeed(f.feedId)}
                      className="btn btn-sm btn-outline-danger"
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
          <input
            type="text"
            className="form-control form-control-sm mb-2"
            placeholder="Search Feeds..."
            value={search}
            onChange={handleFeedSearch}
          />
          <div
            className="list-group"
            style={{ maxHeight: '150px', overflowY: 'auto' }}
          >
            {filteredFeeds
              .filter((f) => !editFeeds.some((ef) => ef.feedId === f.id))
              .map((feed) => (
                <button
                  key={feed.id}
                  onClick={() => handleAddFeed(feed)}
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                    editFeeds.some((ef) => ef.feedId === feed.id) ? 'disabled' : ''
                  }`}
                  disabled={editFeeds.some((ef) => ef.feedId === feed.id)}
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
        <button onClick={onCancel} className="btn btn-outline-secondary">
          <i className="bi bi-x-lg me-1"></i>Cancel
        </button>
      </div>
    </div>
  );
}

export default CompositionForm;