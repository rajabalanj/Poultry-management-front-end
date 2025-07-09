import React, { useState, useEffect } from "react";
import PageHeader from "./Layout/PageHeader";
import { configApi, batchApi } from "../services/api";
import { bovansApi } from "../services/api"; // Import the new Bovans API
import { toast } from "react-toastify";
import BatchConfig from "./BatchConfig";
import { BovansPerformance } from "../types/bovans"; // Import BovansPerformance type

const KG_PER_TON = 1000;

const Configurations: React.FC = () => {
  const [kg, setKg] = useState(3000);
  const [ton, setTon] = useState(3);
  const [henDayDeviation, setHenDayDeviation] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Batch config state
  const [batches, setBatches] = useState<
    import("../types/batch").BatchResponse[]
  >([]);
  const [batchLoading, setBatchLoading] = useState(true);
  const [batchError, setBatchError] = useState<string | null>(null);

  // Bovans Performance state
  const [bovansPerformanceData, setBovansPerformanceData] = useState<BovansPerformance[]>([]);
  const [bovansLoading, setBovansLoading] = useState(true);
  const [bovansError, setBovansError] = useState<string | null>(null);
  const [bovansCurrentPage, setBovansCurrentPage] = useState(1);
  const [bovansTotalItems, setBovansTotalItems] = useState(0); // You might need a separate endpoint for total count
  const bovansItemsPerPage = 10;

  // Load all configurations and Bovans data from backend on mount
  useEffect(() => {
    const fetchAllConfigsAndBovans = async () => {
      setLoading(true);
      setBatchLoading(true);
      setBovansLoading(true); // Start Bovans loading

      try {
        // Fetch global configurations
        const configs = await configApi.getAllConfigs();
        const kgConfig = configs.find((c) => c.name === "lowKgThreshold");
        const tonConfig = configs.find((c) => c.name === "lowTonThreshold");
        const henDayDeviationConfig = configs.find(
          (c) => c.name === "henDayDeviation"
        );
        setKg(kgConfig ? Number(kgConfig.value) : 3000);
        setTon(tonConfig ? Number(tonConfig.value) : 3);
        setHenDayDeviation(
          henDayDeviationConfig ? Number(henDayDeviationConfig.value) : 0
        );

        // Load batch configs
        const batchData = await batchApi.getBatches(0, 1000);
        const activeBatches = batchData.filter(batch => batch.is_active == true);
        setBatches(Array.isArray(activeBatches) ? activeBatches : []);
        setBatchError(null);

        // Load Bovans performance data
        await fetchBovansPerformance(bovansCurrentPage);

      } catch (err: any) {
        toast.error(err.message || "Failed to load configurations.");
        setBatchError(err.message || "Failed to load batch configurations.");
        setBovansError(err.message || "Failed to load Bovans performance data."); // Set specific error for Bovans
      } finally {
        setLoading(false);
        setBatchLoading(false);
        setBovansLoading(false); // End Bovans loading
      }
    };
    fetchAllConfigsAndBovans();
  }, []);

  // Function to fetch Bovans performance data with pagination
  const fetchBovansPerformance = async (page: number) => {
    setBovansLoading(true);
    try {
      const skip = (page - 1) * bovansItemsPerPage;
      // Now, 'data' will be the PaginatedBovansPerformanceResponse object
      const response = await bovansApi.getAllBovansPerformance(skip, bovansItemsPerPage);

      setBovansPerformanceData(response.data); // Access the actual data array
      setBovansTotalItems(response.total_count); // Set the total count from the response
      setBovansError(null);
    } catch (err: any) {
      setBovansError(err.message || "Failed to load Bovans performance data.");
      setBovansPerformanceData([]); // Clear data on error
      setBovansTotalItems(0); // Reset total items on error
    } finally {
      setBovansLoading(false);
    }
  };

  // Sync ton when kg changes
  const handleKgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (!isNaN(value)) {
      setKg(value);
      setTon(value / KG_PER_TON);
    }
  };

  // Sync kg when ton changes
  const handleTonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (!isNaN(value)) {
      setTon(value);
      setKg(value * KG_PER_TON);
    }
  };

  // Save to backend
  const handleSave = async () => {
    setSaving(true);
    try {
      await configApi.updateConfig("lowKgThreshold", String(kg));
      await configApi.updateConfig("lowTonThreshold", String(ton));
      await configApi.updateConfig("henDayDeviation", String(henDayDeviation));
      toast.success("Configurations saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save configurations.");
    } finally {
      setSaving(false);
    }
  };

  // Pagination handlers for Bovans Performance
  const handleBovansPageChange = (pageNumber: number) => {
    setBovansCurrentPage(pageNumber);
    fetchBovansPerformance(pageNumber);
  };

  // Calculate total pages for Bovans performance
  // Note: This relies on `bovansTotalItems` being the true total count from the backend.
  // If your API doesn't provide a total count, you'll need to fetch it separately or adjust.
  const bovansTotalPages = Math.ceil(bovansTotalItems / bovansItemsPerPage);


  return (
    <div className="container-fluid">
      <PageHeader title="Configurations"></PageHeader>
      <div className="p-3 border rounded shadow-sm">
        {/* Global Low Feed Thresholds */}
        <div className="mb-4">
          <label className="form-label fw-semibold">
            Global Low Feed Thresholds:
          </label>
          <div className="row g-3">
            <div className="col-6 col-md-auto d-flex align-items-center">
              <span className="me-2">kg:</span>
              <input
                type="number"
                className="form-control form-control-sm"
                style={{ maxWidth: 100 }}
                value={kg}
                min={0}
                onChange={handleKgChange}
                disabled={loading}
              />
            </div>
            <div className="col-6 col-md-auto d-flex align-items-center">
              <span className="me-2">ton:</span>
              <input
                type="number"
                className="form-control form-control-sm"
                style={{ maxWidth: 100 }}
                value={ton}
                min={0}
                step={0.001}
                onChange={handleTonChange}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Max Allowed Hen Day % Drop */}
        <div className="mb-4">
          <label className="form-label fw-semibold">
            Max Allowed HD % Drop:
          </label>
          <div className="d-flex align-items-center">
            <input
              type="number"
              className="form-control form-control-sm"
              style={{ maxWidth: 100 }}
              value={henDayDeviation}
              onChange={(e) => setHenDayDeviation(Number(e.target.value))}
              disabled={loading}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-3">
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? "Saving..." : "Save Configurations"}
          </button>
        </div>
      </div>
      <hr />
      <div className="accordion" id="configurationsAccordion">
        {/* Batch Configuration Accordion Item */}
        <div className="accordion-item">
          <h2 className="accordion-header" id="batch-config-heading">
            <button
              className="accordion-button collapsed fw-semibold" // Add 'collapsed' by default
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#batch-config-collapse"
              aria-expanded="false" // Set to false by default
              aria-controls="batch-config-collapse"
            >
              Batch Configuration
            </button>
          </h2>
          <div
            id="batch-config-collapse"
            className="accordion-collapse collapse"
            aria-labelledby="batch-config-heading"
            data-bs-parent="#configurationsAccordion"
          >
            <div className="accordion-body">
              <BatchConfig
                batches={batches}
                loading={batchLoading}
                error={batchError}
              />
            </div>
          </div>
        </div>
        {/* <hr /> */}
        {/* Bovans White Layer Performance Accordion Item */}
        <div className="accordion-item mt-3 border-top"> {/* Added mt-3 for spacing */}
          <h2 className="accordion-header" id="bovans-performance-heading">
            <button
              className="accordion-button collapsed fw-semibold" // Add 'collapsed' by default
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#bovans-performance-collapse"
              aria-expanded="false" // Set to false by default
              aria-controls="bovans-performance-collapse"
            >
              Bovans White Layer Performance Data
            </button>
          </h2>
          <div
            id="bovans-performance-collapse"
            className="accordion-collapse collapse"
            aria-labelledby="bovans-performance-heading"
            data-bs-parent="#configurationsAccordion"
          >
            <div className="accordion-body">
              {bovansLoading ? (
                <p>Loading Bovans performance data...</p>
              ) : bovansError ? (
                <div className="alert alert-danger" role="alert">
                  Error: {bovansError}
                </div>
              ) : bovansPerformanceData.length === 0 ? (
                <p>No Bovans performance data available.</p>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="table table-striped table-hover">
                      <thead>
                        <tr>
                          <th>Age (Weeks)</th>
                          <th>Livability (%)</th>
                          <th>Lay (%)</th>
                          <th>Eggs/Bird (Cum)</th>
                          <th>Feed Intake/Day (g)</th>
                          <th>Feed Intake (Cum kg)</th>
                          <th>Body Weight (g)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bovansPerformanceData.map((data) => (
                          <tr key={data.age_weeks}>
                            <td>{data.age_weeks}</td>
                            <td>{data.livability_percent}</td>
                            <td>{data.lay_percent}</td>
                            <td>{data.eggs_per_bird_cum}</td>
                            <td>{data.feed_intake_per_day_g}</td>
                            <td>{data.feed_intake_cum_kg}</td>
                            <td>{data.body_weight_g}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  <nav aria-label="Bovans Performance Pagination">
                    <ul className="pagination justify-content-center">
                      <li className={`page-item ${bovansCurrentPage === 1 ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handleBovansPageChange(bovansCurrentPage - 1)}
                          disabled={bovansCurrentPage === 1}
                        >
                          Previous
                        </button>
                      </li>
                      {Array.from({ length: bovansTotalPages }, (_, i) => i + 1).map((page) => (
                        <li key={page} className={`page-item ${bovansCurrentPage === page ? 'active' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => handleBovansPageChange(page)}
                          >
                            {page}
                          </button>
                        </li>
                      ))}
                      <li className={`page-item ${bovansCurrentPage === bovansTotalPages ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handleBovansPageChange(bovansCurrentPage + 1)}
                          disabled={bovansCurrentPage === bovansTotalPages}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configurations;