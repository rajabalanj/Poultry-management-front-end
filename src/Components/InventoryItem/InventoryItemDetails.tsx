// src/components/InventoryItem/InventoryItemDetails.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../Layout/PageHeader";
import { inventoryItemApi, inventoryItemVariantApi } from "../../services/api";
import { InventoryItemResponse } from "../../types/InventoryItem";
import { InventoryItemAudit } from "../../types/InventoryItemAudit";
import { InventoryItemVariant } from "../../types/inventoryItemVariant";
import Loading from '../Common/Loading';
import CustomDatePicker from '../Common/CustomDatePicker';
import AdjustInventoryModal from './AdjustInventoryModal'; // Import the modal

const InventoryItemDetails: React.FC = () => {
  const { item_id } = useParams<{ item_id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<InventoryItemResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [auditLog, setAuditLog] = useState<InventoryItemAudit[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false); // State for modal
  const [variants, setVariants] = useState<InventoryItemVariant[]>([]);

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        if (!item_id) {
            setError("Inventory Item ID is missing.");
            setLoading(false);
            return;
        }
        const numericItemId = Number(item_id);
        const itemData = await inventoryItemApi.getInventoryItem(numericItemId);
        setItem(itemData);

        const variantsData = await inventoryItemVariantApi.getInventoryItemVariants(numericItemId);
        setVariants(variantsData);

      } catch (err: any) {
        console.error("Error fetching inventory item details:", err);
        setError(err?.message || "Failed to load inventory item details.");
        toast.error(err?.message || "Failed to load inventory item details.");
      } finally {
        setLoading(false);
      }
    };

    fetchItemDetails();
  }, [item_id]);

  // Helper function to format date as YYYY-MM-DD without timezone conversion
const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const fetchAuditLog = async () => {
  if (!item_id) return;
  setLoadingAudit(true);
  setShowAudit(true);
  try {
    const startDateStr = startDate ? formatDate(startDate) : undefined;
    const endDateStr = endDate ? formatDate(endDate) : undefined;
    const data = await inventoryItemApi.getInventoryItemAudit(Number(item_id), startDateStr, endDateStr);
    setAuditLog(data);
    setCurrentPage(1);
  } catch (err) {
    toast.error('Failed to load audit log.');
  } finally {
    setLoadingAudit(false);
  }
};

const handleAdjustmentSuccess = (updatedItem: InventoryItemResponse) => {
  setItem(updatedItem);
  toast.success('Inventory adjusted successfully!');
  fetchAuditLog(); // Refresh audit log after adjustment
};

  const totalPages = Math.ceil(auditLog.length / rowsPerPage);
  const paginatedAuditLog = auditLog.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  if (loading) return <div className="text-center mt-5">Loading item details...</div>;
  if (error) return <div className="text-center text-danger mt-5">{error}</div>;
  if (!item) return <div className="text-center mt-5">Inventory item not found or data is missing.</div>;

  return (
    <>
      <PageHeader title="Inventory Item Details" buttonVariant="secondary" buttonLabel="Back to List" buttonLink="/inventory-items" buttonIcon="bi-arrow-left"/>
      <div className="container mt-4">
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Item Information: {item.name}</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <strong>Item Name:</strong> {item.name}
              </div>
              <div className="col-md-6 mb-3">
                <strong>Unit:</strong> {item.unit}
              </div>
              <div className="col-md-6 mb-3">
                <strong>Category:</strong> {item.category}
              </div>
              <div className="col-md-6 mb-3">
                <strong>Current Stock:</strong> {item.current_stock}
              </div>
              <div className="col-md-6 mb-3">
                <strong>Average Cost:</strong> {item.average_cost}
              </div>
              {item.default_wastage_percentage != null && (
                <div className="col-md-6 mb-3">
                  <strong>Default Wastage %:</strong> {item.default_wastage_percentage}
                </div>
              )}
              <div className="col-md-6 mb-3">
                <strong>Created At:</strong> {new Date(item.created_at).toLocaleString()}
              </div>
              {item.updated_at && (
                <div className="col-md-6 mb-3">
                  <strong>Last Updated:</strong> {new Date(item.updated_at).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {variants.length > 0 && (
            <div className="card shadow-sm mt-4">
                <div className="card-header bg-secondary text-white">
                    <h5 className="mb-0">Variants</h5>
                </div>
                <div className="card-body">
                    <ul className="list-group">
                        {variants.map(variant => (
                            <li key={variant.id} className="list-group-item">
                                {variant.name}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        )}

        <div className="mt-4 d-flex justify-content-center gap-3">
        <button
            type="button"
            className="btn btn-warning"
            onClick={() => setIsAdjustModalOpen(true)}
          >
            <i className="bi bi-gear me-1"></i>
            Adjust Inventory
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate(`/inventory-items/${item_id}/edit`)}
          >
            <i className="bi bi-pencil-square me-1"></i>
            Edit
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this inventory item?')) {
                // Add delete functionality here
                inventoryItemApi.deleteInventoryItem(Number(item_id))
                  .then(() => {
                    toast.success('Inventory item deleted successfully');
                    navigate('/inventory-items');
                  })
                  .catch(err => {
                    toast.error('Failed to delete inventory item: ' + err.message);
                  });
              }
            }}
          >
            <i className="bi bi-trash me-1"></i>
            Delete
          </button>
          <button
            type="button"
            className="btn btn-info"
            onClick={fetchAuditLog}
          >
            Show Audit Trail
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            Back
          </button>
        </div>

        {showAudit && (
          <div className="mt-4">
            <div className="card shadow-sm">
              <div className="card-header bg-info text-white">
                <h5 className="mb-0">Inventory Audit Trail</h5>
              </div>
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-5">
                    <label className="form-label">Start Date (Optional)</label>
                    <CustomDatePicker
                      selected={startDate}
                      onChange={(date: Date | null) => setStartDate(date)}
                      dateFormat="dd-MM-yyyy"
                      className="form-control"
                      placeholderText="Select start date"
                      isClearable
                      dropdownMode="select"
                      showYearDropdown
                      showMonthDropdown
                    />
                  </div>
                  <div className="col-md-5 mb-3 mb-md-0">
                    <label className="form-label">End Date (Optional)</label>
                    <CustomDatePicker
                      selected={endDate}
                      onChange={(date: Date | null) => setEndDate(date)}
                      dateFormat="dd-MM-yyyy"
                      className="form-control"
                      placeholderText="Select end date"
                      isClearable
                      dropdownMode="select"
                      showYearDropdown
                      showMonthDropdown
                    />
                  </div>
                  <div className="col-md-2 d-flex align-items-end">
                    <button
                      type="button"
                      className="btn btn-primary w-100"
                      onClick={fetchAuditLog}
                    >
                      Get Report
                    </button>
                  </div>
                </div>
                {loadingAudit ? (
                  <Loading message="Loading audit trail..." />
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table table-striped table-bordered table-hover">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Change Type</th>
                            <th>Change Amount</th>
                            <th>Old Quantity</th>
                            <th>New Quantity</th>
                            <th>Changed By</th>
                            <th>Note</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedAuditLog.map((log) => (
                            <tr key={log.id}>
                              <td>{new Date(log.timestamp).toLocaleString()}</td>
                              <td>{log.change_type}</td>
                              <td>{log.change_amount}</td>
                              <td>{log.old_quantity}</td>
                              <td>{log.new_quantity}</td>
                              <td>{log.changed_by}</td>
                              <td>{log.note}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {totalPages > 1 && (
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <button
                          className="btn btn-secondary"
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </button>
                        <span>
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {isAdjustModalOpen && item && (
        <AdjustInventoryModal
          item={item}
          onClose={() => setIsAdjustModalOpen(false)}
          onSuccess={handleAdjustmentSuccess}
        />
      )}
    </>
  );
};

export default InventoryItemDetails;
