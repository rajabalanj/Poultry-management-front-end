import { useEffect, useState } from 'react';
import { fetchFeeds, fetchCompositions, updateComposition, addComposition, renameComposition, Feed, Composition, FeedInComposition } from '../services/feedMillMock';


const BASIC_FEEDS = ['Maize', 'Corn', 'DORB', 'Rice'];

function FeedMillStock() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [selectedCompositionId, setSelectedCompositionId] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [editFeeds, setEditFeeds] = useState<FeedInComposition[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  const [renameMode, setRenameMode] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    fetchFeeds().then(setFeeds);
    fetchCompositions().then(setCompositions);
  }, []);

  const filteredFeeds = feeds.filter(f => !BASIC_FEEDS.includes(f.name));

  const selectedComposition = compositions.find(c => c.id === selectedCompositionId);

  const handleCompositionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCompositionId(Number(e.target.value));
    setEditing(false);
    setRenameMode(false);
  };

  const handleEdit = () => {
    if (!selectedComposition) return;
    setEditFeeds(selectedComposition.feeds.map(f => ({ ...f })));
    setEditing(true);
    setRenameMode(false);
  };

  const handleFeedWeightChange = (feedId: number, weight: number) => {
    setEditFeeds(editFeeds.map(f => f.feedId === feedId ? { ...f, weight } : f));
  };

  const handleFeedSearch = (e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value);

  const handleAddFeed = (feed: Feed) => {
    if (!editFeeds.some(f => f.feedId === feed.id)) {
      setEditFeeds([...editFeeds, { feedId: feed.id, weight: 0 }]);
    }
  };

  const handleRemoveFeed = (feedId: number) => {
    setEditFeeds(editFeeds.filter(f => f.feedId !== feedId));
  };

  const handleSave = async () => {
    if (!selectedComposition) return;
    await updateComposition(new Composition(selectedComposition.id, selectedComposition.name, editFeeds));
    fetchCompositions().then(setCompositions);
    setEditing(false);
  };

  const handleAddComposition = async () => {
    if (!newCompName.trim()) return;
    const newComp = new Composition(
      compositions.length ? Math.max(...compositions.map(c => c.id)) + 1 : 1,
      newCompName,
      []
    );
    await addComposition(newComp);
    fetchCompositions().then(setCompositions);
    setShowAdd(false);
    setNewCompName('');
    setSelectedCompositionId(newComp.id);
    setEditFeeds([]);
    setEditing(true);
  };

  const handleRename = async () => {
    if (!selectedComposition) return;
    await renameComposition(selectedComposition.id, renameValue);
    fetchCompositions().then(setCompositions);
    setRenameMode(false);
  };

  return (
    <div className="container py-3">
      <div className="mb-3 d-flex align-items-center gap-2">
        <select
          className="form-select form-select-sm w-auto"
          value={selectedCompositionId || ''}
          onChange={handleCompositionChange}
        >
          <option value='' disabled>Select Composition</option>
          {compositions.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {selectedComposition && !editing && !renameMode && (
          <button onClick={handleEdit} className="btn btn-sm btn-outline-primary">
            <i className="bi bi-pencil me-1"></i>Edit
          </button>
        )}
        {selectedComposition && !editing && !renameMode && (
          <button
            onClick={() => {
              setRenameMode(true);
              setRenameValue(selectedComposition.name);
            }}
            className="btn btn-sm btn-outline-secondary"
          >
            <i className="bi bi-pencil-square me-1"></i>Rename
          </button>
        )}
        {renameMode && (
          <div className="d-flex align-items-center gap-2">
            <input
              type="text"
              className="form-control form-control-sm w-auto"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
            />
            <button onClick={handleRename} className="btn btn-sm btn-primary">
              <i className="bi bi-check-lg"></i>
            </button>
            <button onClick={() => setRenameMode(false)} className="btn btn-sm btn-outline-secondary">
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        )}
        <button onClick={() => setShowAdd(true)} className="btn btn-sm btn-success">
          <i className="bi bi-plus-lg me-1"></i>Create
        </button>
      </div>

      {showAdd && (
        <div className="mb-3 d-flex gap-2">
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Composition Name"
            value={newCompName}
            onChange={e => setNewCompName(e.target.value)}
          />
          <button onClick={handleAddComposition} className="btn btn-sm btn-primary">
            <i className="bi bi-check-lg"></i>Create
          </button>
          <button onClick={() => setShowAdd(false)} className="btn btn-sm btn-outline-secondary">
            <i className="bi bi-x-lg"></i>Cancel
          </button>
        </div>
      )}

      {selectedComposition && !editing && !renameMode && (
        <div className="mt-3">
          <h4>Feeds in Composition</h4>
          <ul className="list-group">
            {selectedComposition.feeds.map(f => {
              const feed = feeds.find(fd => fd.id === f.feedId);
              if (!feed || BASIC_FEEDS.includes(feed.name)) return null;
              return (
                <li key={f.feedId} className="list-group-item d-flex justify-content-between align-items-center">
                  {feed.name}
                  <span className="badge bg-secondary rounded-pill">{f.weight} kg</span>
                </li>
              );
            })}
            <li className="list-group-item d-flex justify-content-between align-items-center">
              <strong>Total Weight</strong>
              <span className="badge bg-primary rounded-pill">
                {selectedComposition.totalWeight} kg
              </span>
            </li>
          </ul>
        </div>
      )}

      {editing && (
        <div className="mt-3">
          <h4>Edit Composition</h4>
          <div className="mb-3">
            <input
              type="text"
              className="form-control form-control-sm mb-2"
              placeholder="Search Feeds..."
              value={search}
              onChange={handleFeedSearch}
            />
            <div className="list-group" style={{ maxHeight: '150px', overflowY: 'auto' }}>
              {filteredFeeds
                .filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
                .map(feed => (
                  <button
                    key={feed.id}
                    onClick={() => handleAddFeed(feed)}
                    className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                      editFeeds.some(f => f.feedId === feed.id) ? 'disabled' : ''
                    }`}
                    disabled={editFeeds.some(f => f.feedId === feed.id)}
                  >
                    {feed.name}
                    <i className="bi bi-plus-circle-fill text-success"></i>
                  </button>
                ))}
            </div>
          </div>
          <ul className="list-group mb-3">
            {editFeeds.map(f => {
              const feed = feeds.find(fd => fd.id === f.feedId);
              if (!feed) return null;
              return (
                <li key={f.feedId} className="list-group-item d-flex justify-content-between align-items-center">
                  <span>{feed.name}</span>
                  <div className="d-flex align-items-center gap-2">
                    <input
                      type="number"
                      className="form-control form-control-sm w-auto"
                      value={f.weight}
                      min={0}
                      onChange={e => handleFeedWeightChange(f.feedId, Number(e.target.value))}
                      style={{ width: '70px' }}
                    />
                    <span className="text-muted">kg</span>
                    <button onClick={() => handleRemoveFeed(f.feedId)} className="btn btn-sm btn-outline-danger">
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="d-flex gap-2">
            <button onClick={handleSave} className="btn btn-primary">
              <i className="bi bi-save me-1"></i>Save Changes
            </button>
            <button onClick={() => setEditing(false)} className="btn btn-outline-secondary">
              <i className="bi bi-x-lg me-1"></i>Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeedMillStock;
