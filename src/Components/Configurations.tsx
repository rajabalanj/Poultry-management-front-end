import React, { useState, useEffect } from "react";
import PageHeader from "./Layout/PageHeader";
import { configApi, batchApi } from "../services/api";
import { bovansApi } from "../services/api"; // Import the new Bovans API
import { toast } from "react-toastify";
import BatchConfig from "./BatchConfig";
import { BovansPerformance } from "../types/bovans"; // Import BovansPerformance type
import { format } from 'date-fns'; // For date formatting
import { eggRoomReportApi } from '../services/api';

const KG_PER_TON = 1000;

const Configurations: React.FC = () => {
  const [kg, setKg] = useState(3000);
  const [ton, setTon] = useState(3);
  const [henDayDeviation, setHenDayDeviation] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [medicineKg, setMedicineKg] = useState(3000);
const [medicineGram, setMedicineGram] = useState(3000);
const [eggRoomStartDate, setEggRoomStartDate] = useState<string>(''); // YYYY-MM-DD
  const [initialTableOpening, setInitialTableOpening] = useState<number>(0);
  const [initialJumboOpening, setInitialJumboOpening] = useState<number>(0);
  const [initialGradeCOpening, setInitialGradeCOpening] = useState<number>(0);
  const [eggRoomSaving, setEggRoomSaving] = useState(false); // To manage loading state for egg room setup

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
        const medicineKgConfig = configs.find((c) => c.name === "medicineLowKgThreshold");
    const medicineGramConfig = configs.find((c) => c.name === "medicineLowGramThreshold");
    const eggRoomStartDateConfig = configs.find((c) => c.name === "system_start_date");
        setKg(kgConfig ? Number(kgConfig.value) : 3000);
        setTon(tonConfig ? Number(tonConfig.value) : 3);
        setHenDayDeviation(
          henDayDeviationConfig ? Number(henDayDeviationConfig.value) : 0
        );
        setMedicineKg(medicineKgConfig ? Number(medicineKgConfig.value) : 3000);
    setMedicineGram(medicineGramConfig ? Number(medicineGramConfig.value) : 3000);
        setEggRoomStartDate(eggRoomStartDateConfig ? eggRoomStartDateConfig.value : '');

        // Load batch configs
        const batchData = await batchApi.getBatches(0, 1000);
        setBatches(Array.isArray(batchData) ? batchData : []);
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

  // Function to handle the Egg Room initial setup
  const handleEggRoomInitialSetup = async () => {
    setEggRoomSaving(true);
    try {
      if (!eggRoomStartDate) {
        toast.error("Please select an Egg Room Start Date.");
        return;
      }

      const startDate = new Date(eggRoomStartDate);
      if (isNaN(startDate.getTime())) {
          toast.error("Invalid Egg Room Start Date format.");
          return;
      }
      
      // Calculate the "day before" date for the dummy report
      const dayBeforeStartDate = new Date(startDate);
      dayBeforeStartDate.setDate(startDate.getDate() - 1);
      const dummyReportDate = format(dayBeforeStartDate, 'yyyy-MM-dd');

      // 1. Create the "dummy" report for the day before the actual start date
      const initialReportData = {
        report_date: dummyReportDate,
        table_received: initialTableOpening,
        table_transfer: 0,
        table_damage: 0,
        table_out: 0,
        grade_c_shed_received: 0, // Assuming shed is 0 for initial setup
        grade_c_room_received: initialGradeCOpening, // Map to room_received for initial physical count
        grade_c_transfer: 0,
        grade_c_labour: 0,
        grade_c_waste: 0,
        jumbo_received: initialJumboOpening,
        jumbo_transfer: 0,
        jumbo_waste: 0,
        jumbo_in: 0,
      };

      await eggRoomReportApi.createReport(initialReportData);
      toast.success(`Initial report created for ${dummyReportDate}.`);

      // 2. Update the system_start_date in AppConfig
      await configApi.updateConfig('system_start_date', eggRoomStartDate);
      toast.success(`System start date set to ${eggRoomStartDate}.`);

    } catch (error) {
      toast.error("Failed to set Egg Room initial configuration.");
      console.error("Egg Room Setup Error:", error);
    } finally {
      setEggRoomSaving(false);
    }
  };

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

  const handleMedicineKgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = Number(e.target.value);
  if (!isNaN(value)) {
    setMedicineKg(value);
    setMedicineGram(value*1000);
  }
};

const handleMedicineGramChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = Number(e.target.value);
  if (!isNaN(value)) {
    setMedicineGram(value);
    setMedicineKg(value/1000);
  }
};

  // Save to backend
  const handleSave = async () => {
    setSaving(true);
    try {
      await configApi.updateConfig("lowKgThreshold", String(kg));
      await configApi.updateConfig("lowTonThreshold", String(ton));
      await configApi.updateConfig("henDayDeviation", String(henDayDeviation));
      await configApi.updateConfig("medicineLowKgThreshold", String(medicineKg));
    await configApi.updateConfig("medicineLowGramThreshold", String(medicineGram));
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
      <div className="p-3 border rounded shadow-sm mb-4"> {/* Added mb-4 for spacing */}
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

        {/* Medicine Low Thresholds */}
        <div className="mb-4">
          <label className="form-label fw-semibold">
            Medicine Low Thresholds:
          </label>
          <div className="row g-3">
            <div className="col-6 col-md-auto d-flex align-items-center">
              <span className="me-2">kg:</span>
              <input
                type="number"
                className="form-control form-control-sm"
                style={{ maxWidth: 100 }}
                value={medicineKg}
                min={0}
                onChange={handleMedicineKgChange}
                disabled={loading}
              />
            </div>
            <div className="col-6 col-md-auto d-flex align-items-center">
              <span className="me-2">gram:</span>
              <input
                type="number"
                className="form-control form-control-sm"
                style={{ maxWidth: 100 }}
                value={medicineGram}
                min={0}
                onChange={handleMedicineGramChange}
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

      {/* Egg Room Initial Setup */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">Egg Room Initial Setup</h5>
        </div>
        <div className="card-body">
          <div className="form-group row mb-3">
            <label htmlFor="eggRoomStartDate" className="col-sm-4 col-form-label">
              Egg Room Start Date
            </label>
            <div className="col-sm-8">
              <input
                type="date"
                className="form-control"
                id="eggRoomStartDate"
                value={eggRoomStartDate}
                onChange={(e) => setEggRoomStartDate(e.target.value)}
                disabled={eggRoomSaving}
              />
            </div>
          </div>
          <div className="form-group row mb-3">
            <label htmlFor="initialTableOpening" className="col-sm-4 col-form-label">
              Initial Table Egg Count
            </label>
            <div className="col-sm-8">
              <input
                type="number"
                className="form-control"
                id="initialTableOpening"
                value={initialTableOpening}
                onChange={(e) => setInitialTableOpening(parseInt(e.target.value) || 0)}
                disabled={eggRoomSaving}
              />
            </div>
          </div>
          <div className="form-group row mb-3">
            <label htmlFor="initialJumboOpening" className="col-sm-4 col-form-label">
              Initial Jumbo Egg Count
            </label>
            <div className="col-sm-8">
              <input
                type="number"
                className="form-control"
                id="initialJumboOpening"
                value={initialJumboOpening}
                onChange={(e) => setInitialJumboOpening(parseInt(e.target.value) || 0)}
                disabled={eggRoomSaving}
              />
            </div>
          </div>
          <div className="form-group row mb-3">
            <label htmlFor="initialGradeCOpening" className="col-sm-4 col-form-label">
              Initial Grade C Egg Count
            </label>
            <div className="col-sm-8">
              <input
                type="number"
                className="form-control"
                id="initialGradeCOpening"
                value={initialGradeCOpening}
                onChange={(e) => setInitialGradeCOpening(parseInt(e.target.value) || 0)}
                disabled={eggRoomSaving}
              />
            </div>
          </div>
          <div className="form-group row">
            <div className="col-sm-12 text-end">
              <button
                className="btn btn-success"
                onClick={handleEggRoomInitialSetup}
                disabled={eggRoomSaving}
              >
                {eggRoomSaving ? "Saving..." : "Set Initial Egg Room Data"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <hr />

      {/* Accordion for Batch and Bovans Performance */}
      <div className="accordion" id="configurationsAccordion">
        {/* Batch Configuration Accordion Item */}
        <div className="accordion-item">
          <h2 className="accordion-header" id="batch-config-heading">
            <button
              className="accordion-button collapsed fw-semibold"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#batch-config-collapse"
              aria-expanded="false"
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

        {/* Bovans White Layer Performance Accordion Item */}
        <div className="accordion-item mt-3 border-top">
          <h2 className="accordion-header" id="bovans-performance-heading">
            <button
              className="accordion-button collapsed fw-semibold"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#bovans-performance-collapse"
              aria-expanded="false"
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



