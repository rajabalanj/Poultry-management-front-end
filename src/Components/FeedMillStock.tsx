import { useEffect, useState } from "react";
import { compositionApi } from "../services/api";
import { FeedResponse } from "../types/Feed";
import CompositionForm from "./CompositionForm";
import { toast } from "react-toastify";

function FeedMillStock() {
  type ViewState = "view" | "edit" | "add" | "use-composition";
  const [viewState, setViewState] = useState<ViewState>("view");
  const [feeds, setFeeds] = useState<FeedResponse[]>([]);
  const [compositions, setCompositions] = useState<any[]>([]);
  const [selectedCompositionId, setSelectedCompositionId] = useState<number | null>(null);
  const [editFeeds, setEditFeeds] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [newCompName, setNewCompName] = useState("");
  const [timesToUse, setTimesToUse] = useState(1);

  useEffect(() => {
    // Fetch feeds from API
    // Use FeedResponse type
    import("../services/api").then(({ feedApi }) => {
      feedApi.getFeeds().then((feedResponses: FeedResponse[]) => {
        setFeeds(feedResponses);
      });
    });
    compositionApi.getCompositions().then((comps) => {
      // Map feed_id to feedId for each feed in each composition
      const mappedComps = comps.map((comp) => ({
        ...comp,
        feeds: comp.feeds.map((f: any) => ({
          ...f,
          feedId: f.feed_id ?? f.feedId, // support both possible keys
        })),
      }));
      setCompositions(mappedComps);
    });
  }, []);

  const filteredFeeds = feeds.filter((f) =>
    f.title.toLowerCase().includes(search.toLowerCase())
  );

  const selectedComposition = compositions.find(
    (c) => c.id === selectedCompositionId
  );

  const handleCompositionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCompositionId(Number(e.target.value));
  };

  const handleEdit = () => {
    if (!selectedComposition) return;
    setEditFeeds(selectedComposition.feeds.map((f: any) => ({ ...f })));
    setViewState("edit");
  };

  const handleFeedWeightChange = (feedId: number, weight: number) => {
    setEditFeeds(
      editFeeds.map((f: any) => (f.feedId === feedId ? { ...f, weight } : f))
    );
  };

  const handleFeedSearch = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearch(e.target.value);

  // Accept both Feed and FeedResponse for compatibility
  const handleAddFeed = (feed: { id?: number; title?: string }) => {
    if (!feed.id) return;
    if (!editFeeds.some((f: any) => f.feedId === feed.id)) {
      setEditFeeds([...editFeeds, { feedId: feed.id, weight: 0 }]);
    }
  };

  const handleRemoveFeed = (feedId: number) => {
    setEditFeeds(editFeeds.filter((f: any) => f.feedId !== feedId));
  };

  const handleSave = async () => {
    if (!selectedComposition) return;
    await compositionApi.updateComposition(
      selectedComposition.id,
      {
        name: selectedComposition.name,
        feeds: editFeeds,
      }
    );
    const updated = await compositionApi.getCompositions();
    setCompositions(updated);
    setViewState("view");
  };

  const handleAddComposition = async () => {
    setViewState("add");
    setEditFeeds([]);
    setNewCompName("");
  };

  const handleConfirmAddComposition = async () => {
    if (!newCompName.trim()) {
      toast.error("Composition name cannot be empty");
      return;
    }
    await compositionApi.createComposition({
      name: newCompName,
      feeds: editFeeds,
    });
    const updated = await compositionApi.getCompositions();
    setCompositions(updated);
    setSelectedCompositionId(updated[updated.length - 1]?.id || null);
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
            {selectedComposition.feeds.map((f: any) => {
              const feed = feeds.find((fd) => fd.id === f.feedId);
              if (!feed) return null;
              return (
                <li
                  key={f.feedId}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <span>{feed.title}</span>
                  <span className="badge bg-secondary rounded-pill">
                    {f.weight} kg
                  </span>
                </li>
              );
            })}
            <li className="list-group-item d-flex justify-content-between align-items-center">
              <strong>Total Weight</strong>
              <span className="badge bg-primary rounded-pill">
                {selectedComposition.feeds.reduce((sum: number, f: any) => sum + f.weight, 0)} kg
              </span>
            </li>
          </ul>
          {/* Use Composition Controls */}
          <div className="mt-3 d-flex align-items-center gap-2">
            <button
              className="btn btn-info btn-sm"
              onClick={() => setViewState("use-composition")}
            >
              Use Composition
            </button>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => {
                if (selectedCompositionId) {
                  window.location.href = `/compositions/${selectedCompositionId}/usage-history`;
                }
              }}
            >
              View Usage History
            </button>
          </div>
        </div>
      )}

      {/* Use Composition Modal/Controls */}
      {viewState === "use-composition" && selectedComposition && (
        <div className="card p-3 mt-3">
          <h5>Use Composition</h5>
          <div className="d-flex align-items-center gap-2 mb-2">
            <span>Times:</span>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setTimesToUse((prev) => Math.max(1, prev - 1))}
            >
              -
            </button>
            <span>{timesToUse}</span>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setTimesToUse((prev) => prev + 1)}
            >
              +
            </button>
          </div>
          <div className="d-flex gap-2">
            <button
              className="btn btn-success btn-sm"
              onClick={async () => {
                const usedAt = new Date().toISOString().split('T')[0];
                try {
                  await compositionApi.useComposition({
                    compositionId: selectedComposition.id,
                    times: timesToUse,
                    usedAt,
                  });
                  toast.success(`Used composition ${selectedComposition.name} ${timesToUse} time(s)`);
                  // Optionally update local state/UI
                  const updated = await compositionApi.getCompositions();
                  setCompositions(updated);
                  setViewState("view");
                } catch (err) {
                  toast.error("Failed to use composition");
                }
              }}
            >
              Confirm
            </button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setViewState("view")}>Cancel</button>
          </div>
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
          initialCompName={selectedComposition?.name || ""}
          onCompNameChange={() => {}}
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
