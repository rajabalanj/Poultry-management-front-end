// FeedMillStock.tsx
import { useEffect, useState } from "react";
import { compositionApi, batchApi } from "../services/api"; // Import batchApi
import { FeedResponse } from "../types/Feed";
import { BatchResponse } from "../types/batch"; // Import BatchResponse
import CompositionForm from "./CompositionForm";
import { toast } from "react-toastify";

function FeedMillStock() {
  type ViewState = "view" | "edit" | "add" | "use-composition";
  const [viewState, setViewState] = useState<ViewState>("view");
  const [feeds, setFeeds] = useState<FeedResponse[]>([]);
  const [compositions, setCompositions] = useState<any[]>([]);
  const SELECTED_COMPOSITION_KEY = 'feedmill_selected_composition_id';
  const [selectedCompositionId, setSelectedCompositionId] = useState<number | null>(() => {
    const stored = localStorage.getItem(SELECTED_COMPOSITION_KEY);
    return stored ? Number(stored) : null;
  });
  const [editFeeds, setEditFeeds] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [newCompName, setNewCompName] = useState("");
  const [timesToUse, setTimesToUse] = useState(1);
  const [editCompName, setEditCompName] = useState(""); // State for editing composition name
  const [batches, setBatches] = useState<BatchResponse[]>([]); // State to store batches
  const [selectedShedNo, setSelectedShedNo] = useState<string>(''); // State for selected shed_no

  useEffect(() => {
    // Fetch feeds from API
    import("../services/api").then(({ feedApi }) => {
      feedApi.getFeeds().then((feedResponses: FeedResponse[]) => {
        setFeeds(feedResponses);
      });
    });
    compositionApi.getCompositions().then((comps) => {
      const mappedComps = comps.map((comp) => ({
        ...comp,
        feeds: comp.feeds.map((f: any) => ({
          ...f,
          feed_id: f.feed_id ?? f.feed_id,
        })),
      }));
      setCompositions(mappedComps);
    });

    // Fetch batches
    batchApi.getBatches().then((fetchedBatches: BatchResponse[]) => {
      setBatches(fetchedBatches);
      // Set a default selectedShedNo if available, e.g., the first one
      if (fetchedBatches.length > 0) {
        setSelectedShedNo(fetchedBatches[0].shed_no);
      }
    });

  }, []);

  useEffect(() => {
    if (selectedCompositionId !== null) {
      localStorage.setItem(SELECTED_COMPOSITION_KEY, String(selectedCompositionId));
    }
  }, [selectedCompositionId]);

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
    setEditCompName(selectedComposition.name);
    setViewState("edit");
  };

  const handleFeedWeightChange = (feed_id: number, weight: number) => {
    setEditFeeds(
      editFeeds.map((f: any) => (f.feed_id === feed_id ? { ...f, weight } : f))
    );
  };

  const handleFeedSearch = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearch(e.target.value);

  const handleAddFeed = (feed: { id?: number; title?: string }) => {
    if (!feed.id) return;
    if (!editFeeds.some((f: any) => f.feed_id === feed.id)) {
      setEditFeeds([...editFeeds, { feed_id: feed.id, weight: 0 }]);
    }
  };

  const handleRemoveFeed = (feed_id: number) => {
    setEditFeeds(editFeeds.filter((f: any) => f.feed_id !== feed_id));
  };

  const handleSave = async () => {
    if (!selectedComposition) return;
    await compositionApi.updateComposition(
      selectedComposition.id,
      {
        name: editCompName,
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
            className="btn btn-sm btn-success"
          >
            <i className="bi bi-pencil me-1"></i>Edit
          </button>
        )}

        {viewState !== "add" && (
          <button
            onClick={handleAddComposition}
            className="btn btn-sm btn-primary"
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
              const feed = feeds.find((fd) => fd.id === f.feed_id);
              if (!feed) return null;
              return (
                <li
                  key={f.feed_id}
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
              className="btn btn-primary btn-sm"
              onClick={() => setViewState("use-composition")}
            >
              Use Composition
            </button>
            <button
              className="btn btn-info btn-sm"
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
              className="btn btn-danger btn-sm"
              onClick={() => setTimesToUse((prev) => Math.max(1, prev - 1))}
            >
              -
            </button>
            <span>{timesToUse}</span>
            <button
              className="btn btn-success btn-sm"
              onClick={() => setTimesToUse((prev) => prev + 1)}
            >
              +
            </button>
          </div>
          {/* Shed Number Selection */}
          <div className="mb-3">
            <label htmlFor="shedNoSelect" className="form-label">Select Shed Number:</label>
            <select
              id="shedNoSelect"
              className="form-select form-select-sm"
              value={selectedShedNo}
              onChange={(e) => setSelectedShedNo(e.target.value)}
            >
              <option value="">Select a Shed</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.shed_no}>
                  {batch.shed_no}
                </option>
              ))}
            </select>
          </div>

          <div className="d-flex gap-2">
            <button
              className="btn btn-primary btn-sm"
              onClick={async () => {
                if (!selectedShedNo) {
                  toast.error("Please select a Shed Number");
                  return;
                }
                const usedAt = new Date().toISOString().split('T')[0];
                try {
                  await compositionApi.useComposition({
                    compositionId: selectedComposition.id,
                    times: timesToUse,
                    usedAt,
                    shedNo: selectedShedNo, // Pass the selected shed_no
                  });
                  toast.success(`Used composition ${selectedComposition.name} ${timesToUse} time(s) for Shed ${selectedShedNo}`);
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
            <button className="btn btn-secondary btn-sm" onClick={() => setViewState("view")}>Cancel</button>
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
          initialCompName={editCompName}
          onCompNameChange={(e) => setEditCompName(e.target.value)}
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