import React, { useState, useEffect, useRef } from "react";
import PageHeader from "./Layout/PageHeader";
import { configApi, batchApi, bovansApi, eggRoomReportApi, financialSettingsApi, chartOfAccountsApi } from "../services/api";
import { toast } from "react-toastify";
import CustomDatePicker from "./Common/CustomDatePicker";
import BatchConfig from "./BatchConfig";
import { BovansPerformance } from "../types/bovans"; // Import BovansPerformance type
import { format } from 'date-fns'; // For date formatting
import type { FinancialSettings as IFinancialSettings, UpdateFinancialSettings } from "../types/financialSettings";
import type { ChartOfAccountsResponse } from "../types/chartOfAccounts";


const KG_PER_TON = 1000;

const Configurations: React.FC = () => {
  const [kg, setKg] = useState<number | ''>(3000);
  const [ton, setTon] = useState<number | ''>(3);
  const [henDayDeviation, setHenDayDeviation] = useState<number | ''>(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [medicineKg, setMedicineKg] = useState<number | ''>(3000);
  const [medicineGram, setMedicineGram] = useState<number | ''>(3000);
  const [eggRoomStartDate, setEggRoomStartDate] = useState<string>(''); // YYYY-MM-DD
  const [initialTableOpening, setInitialTableOpening] = useState<number | ''>(0);
  const [initialJumboOpening, setInitialJumboOpening] = useState<number | ''>(0);
  const [initialGradeCOpening, setInitialGradeCOpening] = useState<number | ''>(0);
  const [eggRoomSaving, setEggRoomSaving] = useState(false); // To manage loading state for egg room setup

  const originalEggRoomStartDate = useRef<string>('');
  const originalTableOpening = useRef<number>(0);
  const originalJumboOpening = useRef<number>(0);
  const originalGradeCOpening = useRef<number>(0);

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

  // Financial Config state
  const [generalLedgerOpeningBalance, setGeneralLedgerOpeningBalance] = useState<number | ''>(0);
  const [financialConfigSaving, setFinancialConfigSaving] = useState(false);
  
  // Financial Settings state
  const [financialSettings, setFinancialSettings] = useState<IFinancialSettings | null>(null);
  const [standardPerformanceValue, setStandardPerformanceValue] = useState<string>('');
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccountsResponse[]>([]);
  const [financialSettingsFormData, setFinancialSettingsFormData] = useState<UpdateFinancialSettings>({
    default_cash_account_id: 0,
    default_sales_account_id: 0,
    default_inventory_account_id: 0,
    default_cogs_account_id: 0,
    default_operational_expense_account_id: 0,
    default_accounts_payable_account_id: 0,
    default_accounts_receivable_account_id: 0,
  });
  const [financialSettingsSaving, setFinancialSettingsSaving] = useState(false);

  // Function to fetch Bovans performance data with pagination

  // Load all configurations and Bovans data from backend on mount
  useEffect(() => {
    const fetchAllConfigsAndBovans = async () => {
      setLoading(true);
      setBatchLoading(true);
      setBovansLoading(true);
      try {
        const configs = await configApi.getAllConfigs();
        const kgConfig = configs.find((c) => c.name === "lowKgThreshold");
        const tonConfig = configs.find((c) => c.name === "lowTonThreshold");
        const henDayDeviationConfig = configs.find((c) => c.name === "henDayDeviation");
        const medicineKgConfig = configs.find((c) => c.name === "medicineLowKgThreshold");
        const medicineGramConfig = configs.find((c) => c.name === "medicineLowGramThreshold");
        const eggRoomStartDateConfig = configs.find((c) => c.name === "system_start_date");
        setKg(kgConfig ? Number(kgConfig.value) : 3000);
        setTon(tonConfig ? Number(tonConfig.value) : 3);
        setHenDayDeviation(henDayDeviationConfig ? Number(henDayDeviationConfig.value) : 0);
        setMedicineKg(medicineKgConfig ? Number(medicineKgConfig.value) : 3000);
        setMedicineGram(medicineGramConfig ? Number(medicineGramConfig.value) : 3000);
        setEggRoomStartDate(eggRoomStartDateConfig ? eggRoomStartDateConfig.value : '');
        originalEggRoomStartDate.current = eggRoomStartDateConfig ? eggRoomStartDateConfig.value : '';

        const financialConfig = await configApi.getFinancialConfig();
        if (financialConfig) {
            setGeneralLedgerOpeningBalance(financialConfig.general_ledger_opening_balance || 0);
        }
        
        // Fetch standard performance config
        const standardPerformanceConfig = await configApi.getStandardPerformance();
        if (standardPerformanceConfig) {
          setStandardPerformanceValue(standardPerformanceConfig.value);
        }
        // Fetch financial settings
        try {
          const [settingsData, accountsData] = await Promise.all([
            financialSettingsApi.getFinancialSettings(),
            chartOfAccountsApi.getChartOfAccounts()
          ]);
          
          setFinancialSettings(settingsData);
          setChartOfAccounts(accountsData);
          setFinancialSettingsFormData({
            default_cash_account_id: settingsData.default_cash_account_id,
            default_sales_account_id: settingsData.default_sales_account_id,
            default_inventory_account_id: settingsData.default_inventory_account_id,
            default_cogs_account_id: settingsData.default_cogs_account_id,
            default_operational_expense_account_id: settingsData.default_operational_expense_account_id,
            default_accounts_payable_account_id: settingsData.default_accounts_payable_account_id,
            default_accounts_receivable_account_id: settingsData.default_accounts_receivable_account_id,
          });
        } catch (error) {
          console.error("Failed to fetch financial settings:", error);
        }

        const batchData = await batchApi.getBatches(0, 1000);
        setBatches(Array.isArray(batchData) ? batchData : []);
        setBatchError(null);

        await fetchBovansPerformance(bovansCurrentPage);
      } catch (err: any) {
        toast.error(err.message || "Failed to load configurations.");
        setBatchError(err.message || "Failed to load batch configurations.");
        setBovansError(err.message || "Failed to load Bovans performance data.");
      } finally {
        setLoading(false);
        setBatchLoading(false);
        setBovansLoading(false);
      }
    };
    fetchAllConfigsAndBovans();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
  const fetchPreviousDayReport = async () => {
    if (!eggRoomStartDate) return;

    const startDate = new Date(eggRoomStartDate);
    if (isNaN(startDate.getTime())) return;

    const reportDate = format(new Date(eggRoomStartDate), 'yyyy-MM-dd');


    try {
      const report = await eggRoomReportApi.getReport(reportDate);
      // These are assumed keys from EggRoomSingleReportResponse
      setInitialTableOpening(report.table_opening || 0);
      setInitialJumboOpening(report.jumbo_opening || 0);
      setInitialGradeCOpening(report.grade_c_opening || 0);
      originalTableOpening.current = report.table_opening || 0;
      originalJumboOpening.current = report.jumbo_opening || 0;
      originalGradeCOpening.current = report.grade_c_opening || 0;
    } catch (error) {
      console.warn("No previous report found for Egg Room start date:", error);
      setInitialTableOpening(0);
      setInitialJumboOpening(0);
      setInitialGradeCOpening(0);
      originalTableOpening.current = 0;
      originalJumboOpening.current = 0;
      originalGradeCOpening.current = 0;
    }
  };

  fetchPreviousDayReport();
}, [eggRoomStartDate]);


  // Function to handle the Egg Room initial setup
  const handleEggRoomInitialSetup = async () => {
    setEggRoomSaving(true);
    try {
      if (!eggRoomStartDate) {
        toast.error("Please select an Egg Room Start Date.");
        return;
      }

      let dateChanged = false;
      if (eggRoomStartDate !== originalEggRoomStartDate.current) {
        await configApi.saveConfig('system_start_date', eggRoomStartDate);
        originalEggRoomStartDate.current = eggRoomStartDate;
        dateChanged = true;
      }
      
      const currentTableOpening = initialTableOpening === '' ? 0 : initialTableOpening;
      if (dateChanged || currentTableOpening !== originalTableOpening.current) {
        await configApi.saveConfig('table_opening', String(currentTableOpening));
        originalTableOpening.current = currentTableOpening;
      }
      const currentJumboOpening = initialJumboOpening === '' ? 0 : initialJumboOpening;
      if (dateChanged || currentJumboOpening !== originalJumboOpening.current) {
        await configApi.saveConfig('jumbo_opening', String(currentJumboOpening));
        originalJumboOpening.current = currentJumboOpening;
      }
      const currentGradeCOpening = initialGradeCOpening === '' ? 0 : initialGradeCOpening;
      if (dateChanged || currentGradeCOpening !== originalGradeCOpening.current) {
        await configApi.saveConfig('grade_c_opening', String(currentGradeCOpening));
        originalGradeCOpening.current = currentGradeCOpening;
      }
      toast.success(`Egg Room setup completed for ${eggRoomStartDate}.`);
    } catch (error: any) {
      toast.error(error.message || "Failed to set Egg Room initial configuration.");
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
    if (e.target.value === '') {
      setKg('');
      setTon('');
    } else {
      setKg(value);
      setTon(value / KG_PER_TON);
    }
  };

  // Sync kg when ton changes
  const handleTonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (e.target.value === '') {
      setTon('');
      setKg('');
    } else {
      setTon(value);
      setKg(value * KG_PER_TON);
    }
  };

  const handleMedicineKgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const newMedicineKg = value === '' ? '' : Number(value);
    setMedicineKg(newMedicineKg);
    setMedicineGram(newMedicineKg === '' ? '' : newMedicineKg * 1000);
  };

  const handleMedicineGramChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const newMedicineGram = value === '' ? '' : Number(value);
    setMedicineGram(newMedicineGram);
    setMedicineKg(newMedicineGram === '' ? '' : newMedicineGram / 1000);
  };

  // Save to backend
  const handleSave = async () => {
    setSaving(true);
    try {
      await configApi.saveConfig("lowKgThreshold", String(kg === '' ? 0 : kg));
      await configApi.saveConfig("lowTonThreshold", String(ton === '' ? 0 : ton));
      await configApi.saveConfig("henDayDeviation", String(henDayDeviation === '' ? 0 : henDayDeviation));
      await configApi.saveConfig("medicineLowKgThreshold", String(medicineKg === '' ? 0 : medicineKg));
      await configApi.saveConfig("medicineLowGramThreshold", String(medicineGram === '' ? 0 : medicineGram));
      toast.success("Configurations saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save configurations.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStandardPerformance = async () => {
    setSaving(true);
    try {
      if (standardPerformanceValue !== "bovans" && standardPerformanceValue !== "bv300") {
        toast.error("Invalid Standard Performance Value. Must be 'bovans' or 'bv300'.");
        return;
      }

      await configApi.updateStandardPerformance(standardPerformanceValue);

      toast.success("Standard performance configuration saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save standard performance configuration.");
    } finally {
      setSaving(false);
    }
  };

  const handleStandardPerformanceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStandardPerformanceValue(e.target.value);
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

  const handleSaveFinancialConfig = async () => {
    setFinancialConfigSaving(true);
    try {
        await configApi.updateFinancialConfig({ general_ledger_opening_balance: generalLedgerOpeningBalance === '' ? 0 : generalLedgerOpeningBalance });
        toast.success("Financial configuration saved successfully!");
    } catch (err: any) {
        toast.error(err.message || "Failed to save financial configuration.");
    } finally {
        setFinancialConfigSaving(false);
    }
  };
  
  // Financial Settings handlers
  const handleFinancialSettingsInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFinancialSettingsFormData(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
    }));
  };
  
  // Helper function to filter accounts by type
  const getAccountsByType = (accountType: string): ChartOfAccountsResponse[] => {
    return chartOfAccounts.filter(acc => acc.account_type === accountType);
  };
  
  // Expected account types for each field
  const expectedTypes = {
    'default_cash_account_id': 'Asset',
    'default_sales_account_id': 'Revenue',
    'default_inventory_account_id': 'Asset',
    'default_cogs_account_id': 'Expense',
    'default_operational_expense_account_id': 'Expense',
    'default_accounts_payable_account_id': 'Liability',
    'default_accounts_receivable_account_id': 'Asset'
  };
  
  const handleSaveFinancialSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFinancialSettingsSaving(true);
    try {
      const updatedSettings: IFinancialSettings = await financialSettingsApi.updateFinancialSettings(financialSettingsFormData);
      setFinancialSettings(updatedSettings);
      toast.success("Financial settings updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update financial settings");
    } finally {
      setFinancialSettingsSaving(false);
    }
  };


return (
  <>
  <PageHeader title="Configurations"></PageHeader>
    <div className="container">

      <div className="p-3 border shadow-sm mb-4 mt-2"> {/* Added mb-4 for spacing */}
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
                value={kg || ''}
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
                value={ton || ''}
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
                value={medicineKg || ''}
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
                value={medicineGram || ''}
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
            value={henDayDeviation || ''}
            onChange={(e) => setHenDayDeviation(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={loading}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-3 text-end">
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? "Saving..." : "Save Configurations"}
          </button>
        </div>
      </div>

      {/* Standard Performance Configuration */}
      <div className="p-3 border shadow-sm mb-4 mt-2">
        <label className="form-label fw-semibold">
          Standard Performance Configuration:
        </label>
        <div className="mb-3">
          <select
            className="form-select form-select-sm"
            value={standardPerformanceValue}
            onChange={handleStandardPerformanceChange}
            disabled={loading}
          >
            <option value="bovans">Bovans</option>
            <option value="bv300">BV300</option>
          </select>
        </div>
        <div className="mt-3 text-end">
          <button className="btn btn-primary" onClick={handleSaveStandardPerformance} disabled={saving || loading}>
            {saving ? "Saving..." : "Save Standard Performance"}
          </button>
        </div>
      </div>



      {/* Accordion for Batch and Bovans Performance */}
      <div className="accordion" id="configurationsAccordion">
        {/* Financial Settings Accordion Item */}
        <div className="accordion-item mb-3">
            <h2 className="accordion-header text-light bg-primary" id="financial-settings-heading">
                <button
                    className="accordion-button collapsed fw-semibold text-light bg-primary accordion-button-white-arrow"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#financial-settings-collapse"
                    aria-expanded="false"
                    aria-controls="financial-settings-collapse"
                >
                    Financial Settings
                </button>
            </h2>
            <div
                id="financial-settings-collapse"
                className="accordion-collapse collapse"
                aria-labelledby="financial-settings-heading"
                data-bs-parent="#configurationsAccordion"
            >
                <div className="accordion-body">
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="mb-0">General Ledger Configuration</h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label htmlFor="generalLedgerOpeningBalance" className="form-label">General Ledger Opening Balance</label>
                                <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    id="generalLedgerOpeningBalance"
                                    value={generalLedgerOpeningBalance || ''}
                                    onChange={(e) => setGeneralLedgerOpeningBalance(e.target.value === '' ? '' : Number(e.target.value))}
                                    disabled={loading}
                                />
                            </div>
                            <div className="text-end">
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSaveFinancialConfig}
                                    disabled={financialConfigSaving || loading}
                                >
                                    {financialConfigSaving ? "Saving..." : "Save Configuration"}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">Default Account Settings</h5>
                        </div>
                        <div className="card-body">
                            {financialSettings ? (
                                <form onSubmit={handleSaveFinancialSettings}>
                                    <div className="mb-3">
                                        <label htmlFor="default_cash_account_id" className="form-label">Default Cash Account</label>
                                        <select
                                            className="form-select form-select-sm"
                                            id="default_cash_account_id"
                                            name="default_cash_account_id"
                                            value={financialSettingsFormData.default_cash_account_id}
                                            onChange={handleFinancialSettingsInputChange}
                                            required
                                        >
                                            <option value="">Select an account</option>
                                            {getAccountsByType(expectedTypes.default_cash_account_id).map(account => (
                                                <option key={account.id} value={account.id}>
                                                    {account.account_name} ({account.account_code})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="default_sales_account_id" className="form-label">Default Sales Account</label>
                                        <select
                                            className="form-select form-select-sm"
                                            id="default_sales_account_id"
                                            name="default_sales_account_id"
                                            value={financialSettingsFormData.default_sales_account_id}
                                            onChange={handleFinancialSettingsInputChange}
                                            required
                                        >
                                            <option value="">Select an account</option>
                                            {getAccountsByType(expectedTypes.default_sales_account_id).map(account => (
                                                <option key={account.id} value={account.id}>
                                                    {account.account_name} ({account.account_code})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="default_inventory_account_id" className="form-label">Default Inventory Account</label>
                                        <select
                                            className="form-select form-select-sm"
                                            id="default_inventory_account_id"
                                            name="default_inventory_account_id"
                                            value={financialSettingsFormData.default_inventory_account_id}
                                            onChange={handleFinancialSettingsInputChange}
                                            required
                                        >
                                            <option value="">Select an account</option>
                                            {getAccountsByType(expectedTypes.default_inventory_account_id).map(account => (
                                                <option key={account.id} value={account.id}>
                                                    {account.account_name} ({account.account_code})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="default_cogs_account_id" className="form-label">Default COGS Account</label>
                                        <select
                                            className="form-select form-select-sm"
                                            id="default_cogs_account_id"
                                            name="default_cogs_account_id"
                                            value={financialSettingsFormData.default_cogs_account_id}
                                            onChange={handleFinancialSettingsInputChange}
                                            required
                                        >
                                            <option value="">Select an account</option>
                                            {getAccountsByType(expectedTypes.default_cogs_account_id).map(account => (
                                                <option key={account.id} value={account.id}>
                                                    {account.account_name} ({account.account_code})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="default_operational_expense_account_id" className="form-label">Default Operational Expense Account</label>
                                        <select
                                            className="form-select form-select-sm"
                                            id="default_operational_expense_account_id"
                                            name="default_operational_expense_account_id"
                                            value={financialSettingsFormData.default_operational_expense_account_id}
                                            onChange={handleFinancialSettingsInputChange}
                                            required
                                        >
                                            <option value="">Select an account</option>
                                            {getAccountsByType(expectedTypes.default_operational_expense_account_id).map(account => (
                                                <option key={account.id} value={account.id}>
                                                    {account.account_name} ({account.account_code})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="default_accounts_payable_account_id" className="form-label">Default Accounts Payable Account</label>
                                        <select
                                            className="form-select form-select-sm"
                                            id="default_accounts_payable_account_id"
                                            name="default_accounts_payable_account_id"
                                            value={financialSettingsFormData.default_accounts_payable_account_id}
                                            onChange={handleFinancialSettingsInputChange}
                                            required
                                        >
                                            <option value="">Select an account</option>
                                            {getAccountsByType(expectedTypes.default_accounts_payable_account_id).map(account => (
                                                <option key={account.id} value={account.id}>
                                                    {account.account_name} ({account.account_code})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="default_accounts_receivable_account_id" className="form-label">Default Accounts Receivable Account</label>
                                        <select
                                            className="form-select form-select-sm"
                                            id="default_accounts_receivable_account_id"
                                            name="default_accounts_receivable_account_id"
                                            value={financialSettingsFormData.default_accounts_receivable_account_id}
                                            onChange={handleFinancialSettingsInputChange}
                                            required
                                        >
                                            <option value="">Select an account</option>
                                            {getAccountsByType(expectedTypes.default_accounts_receivable_account_id).map(account => (
                                                <option key={account.id} value={account.id}>
                                                    {account.account_name} ({account.account_code})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mt-3 text-end">
                                        <button
                                            className="btn btn-primary"
                                            type="submit"
                                            disabled={financialSettingsSaving}
                                        >
                                            {financialSettingsSaving ? "Saving..." : "Update Settings"}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="d-flex justify-content-center p-4">
                                    <div className="spinner-border" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Egg Room Initial Setup Accordion Item */}
        <div className="accordion-item mb-3">
          <h2 className="accordion-header text-light bg-primary" id="egg-room-setup-heading">
            <button
              className="accordion-button collapsed fw-semibold text-light bg-primary accordion-button-white-arrow"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#egg-room-setup-collapse"
              aria-expanded="false"
              aria-controls="egg-room-setup-collapse"
            >
              Egg Room Initial Setup
            </button>
          </h2>
          <div
            id="egg-room-setup-collapse"
            className="accordion-collapse collapse"
            aria-labelledby="egg-room-setup-heading"
            data-bs-parent="#configurationsAccordion"
          >
            <div className="accordion-body">
              <div className="form-group row mb-3">
                <label htmlFor="eggRoomStartDate" className="col-sm-4 col-form-label">
                  Egg Room Start Date
                </label>
                <div className="col-sm-8">
                  <CustomDatePicker
                    className="form-control"
                    id="eggRoomStartDate"
                    selected={eggRoomStartDate ? new Date(eggRoomStartDate) : null}
                    onChange={(date: Date | null) => date && setEggRoomStartDate(date.toISOString().slice(0, 10))}
                    disabled={eggRoomSaving}
                    showMonthDropdown
                    showYearDropdown
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
                    value={initialTableOpening || ''}
                    onChange={(e) => setInitialTableOpening(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
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
                    value={initialJumboOpening || ''}
                    onChange={(e) => setInitialJumboOpening(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
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
                    value={initialGradeCOpening || ''}
                    onChange={(e) => setInitialGradeCOpening(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                    disabled={eggRoomSaving}
                  />
                </div>
              </div>
              <div className="form-group row">
                <div className="col-sm-12 text-end">
                  <button
                    className="btn btn-primary"
                    onClick={handleEggRoomInitialSetup}
                    disabled={eggRoomSaving}
                  >
                    {eggRoomSaving ? "Saving..." : "Set Initial Egg Room Data"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Batch Configuration Accordion Item */}
        <div className="accordion-item">
          <h2 className="accordion-header text-light bg-primary" id="batch-config-heading">
            <button
              className="accordion-button collapsed fw-semibold text-light bg-primary accordion-button-white-arrow"
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
          <h2 className="accordion-header text-light bg-primary" id="bovans-performance-heading">
            <button
              className="accordion-button collapsed fw-semibold text-light bg-primary accordion-button-white-arrow"
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
    </>
  );
};




export default Configurations;