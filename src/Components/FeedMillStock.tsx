import { useEffect, useState } from "react";
import {
  fetchFeeds,
  fetchCompositions,
  updateComposition,
  addComposition,
  Feed,
  Composition,
  FeedInComposition,
} from "../services/feedMillMock";
import CompositionForm from "./CompositionForm";
const BASIC_FEEDS = ["Maize", "Corn", "DORB", "Rice"];

function FeedMillStock() {
  type ViewState = "view" | "edit" | "add";
  const [viewState, setViewState] = useState<ViewState>("view");
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [selectedCompositionId, setSelectedCompositionId] = useState<
    number | null
  >(null);
  const [editFeeds, setEditFeeds] = useState<FeedInComposition[]>([]);
  const [search, setSearch] = useState("");
  const [newCompName, setNewCompName] = useState("");

  useEffect(() => {
    fetchFeeds().then(setFeeds);
    fetchCompositions().then(setCompositions);
  }, []);

  const filteredFeeds = feeds.filter((f) =>
    !BASIC_FEEDS.includes(f.name) &&
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedComposition = compositions.find(
    (c) => c.id === selectedCompositionId
  );

  const handleCompositionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCompositionId(Number(e.target.value));
    // setEditing(false);
  };

  const handleEdit = () => {
    if (!selectedComposition) return;
    setEditFeeds(selectedComposition.feeds.map((f) => ({ ...f })));
    // setEditing(true);
    setViewState("edit");
  };

  const handleFeedWeightChange = (feedId: number, weight: number) => {
    setEditFeeds(
      editFeeds.map((f) => (f.feedId === feedId ? { ...f, weight } : f))
    );
  };

  const handleFeedSearch = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearch(e.target.value);

  const handleAddFeed = (feed: Feed) => {
    if (!editFeeds.some((f) => f.feedId === feed.id)) {
      setEditFeeds([...editFeeds, { feedId: feed.id, weight: 0 }]);
    }
  };

  const handleRemoveFeed = (feedId: number) => {
    setEditFeeds(editFeeds.filter((f) => f.feedId !== feedId));
  };

  const handleSave = async () => {
    if (!selectedComposition) return;
    await updateComposition(
      new Composition(
        selectedComposition.id,
        selectedComposition.name,
        editFeeds
      )
    );
    fetchCompositions().then(setCompositions);
    // setEditing(false);
    setViewState("view");
  };

  const handleAddComposition = async () => {
    //setShowAdd(true);
    setViewState("add");
    setEditFeeds([]);
    setNewCompName("");
    // setEditing(false);
  };

  const handleConfirmAddComposition = async () => {
    if (!newCompName.trim()) return;

    const newId = compositions.length
      ? Math.max(...compositions.map((c) => c.id)) + 1
      : 1;

    const newComp = new Composition(newId, newCompName, editFeeds);

    await addComposition(newComp);

    const updatedCompositions = await fetchCompositions();
    setCompositions(updatedCompositions);
    setSelectedCompositionId(newId);
    // setEditing(false);
    setNewCompName("");
    setEditFeeds([]);
    setViewState("view");
  };
  return (
    <div className="container py-3">
      <div className="mb-3 d-flex align-items-center gap-2">
        {viewState !== "add" && (
          <select
            className="form-select form-select-sm w-auto"
            value={selectedCompositionId || ""}
            onChange={handleCompositionChange}
          >
            <option value="" disabled>
              Select Composition
            </option>
            {compositions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        {selectedComposition && viewState !== "edit" && viewState !== "add" && (
          <button
            onClick={handleEdit}
            className="btn btn-sm btn-outline-primary"
          >
            <i className="bi bi-pencil me-1"></i>Edit
          </button>
        )}
        

        {viewState !== "add" && (
          <button
            onClick={handleAddComposition}
            className="btn btn-sm btn-success"
          >
            <i className="bi bi-plus-lg me-1"></i>Create
          </button>
        )}
      </div>
      {selectedComposition && viewState !== "edit" && viewState !== "add" && (
        <div className="mt-3">
          <h4>Feeds in Composition</h4>
          <ul className="list-group">
            {selectedComposition.feeds.map((f) => {
              const feed = feeds.find((fd) => fd.id === f.feedId);
              if (!feed || BASIC_FEEDS.includes(feed.name)) return null;
              return (
                <li
                  key={f.feedId}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  {feed.name}
                  <span className="badge bg-secondary rounded-pill">
                    {f.weight} kg
                  </span>
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

{viewState === "add" && (
          <CompositionForm
          title="Create Composition"
          initialCompName={newCompName}
          onCompNameChange={(e) => setNewCompName(e.target.value)}
          search={search}
          handleFeedSearch={handleFeedSearch}
          filteredFeeds={filteredFeeds}
          editFeeds={editFeeds}
          feeds={feeds}
          handleAddFeed={handleAddFeed}
          handleRemoveFeed={handleRemoveFeed}
          handleFeedWeightChange={handleFeedWeightChange}
          onSave={handleConfirmAddComposition}
          saveButtonLabel="Save Composition"
          onCancel={() => setViewState("view")}
        />
        )}

      {viewState === "edit" && (
        <CompositionForm
        title="Edit Composition"
        initialCompName={selectedComposition?.name || ""} // You might want to handle name editing differently
        onCompNameChange={() => {}} // Or a function to handle name changes if needed
        search={search}
        handleFeedSearch={handleFeedSearch}
        filteredFeeds={filteredFeeds}
        editFeeds={editFeeds}
        feeds={feeds}
        handleAddFeed={handleAddFeed}
        handleRemoveFeed={handleRemoveFeed}
        handleFeedWeightChange={handleFeedWeightChange}
        onSave={handleSave}
        saveButtonLabel="Save Changes"
        onCancel={() => setViewState("view")}
      />
      )}
    </div>
  );
}

export default FeedMillStock;
