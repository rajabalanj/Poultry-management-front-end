import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { inventoryItemApi, batchApi } from "../services/api";
import PageHeader from "./Layout/PageHeader";
import { Modal, Button, Pagination, Card, Row, Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { InventoryItemResponse } from "../types/InventoryItem";
import { InventoryItemUsageResponse } from "../types/InventoryItemUsage";
import { BatchResponse } from "../types/batch";
import { toPng } from 'html-to-image';
import { exportTableToExcel } from '../utility/export-utils';
import Loading from './Common/Loading';
import CustomDatePicker from './Common/CustomDatePicker';
import { toYYYYMMDD } from '../utility/date-utils';

const InventoryUsageHistory = () => {
  const { item_id } = useParams<{ item_id: string }>();
  const [history, setHistory] = useState<InventoryItemUsageResponse[]>([]);
  const [batches, setBatches] = useState<BatchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inventoryItem, setInventoryItem] = useState<InventoryItemResponse | null>(null);
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [usageToRevert, setUsageToRevert] = useState<number | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;
        const limit = ITEMS_PER_PAGE;

        const startDateStr = startDate ? toYYYYMMDD(startDate) : undefined;
        const endDateStr = endDate ? toYYYYMMDD(endDate) : undefined;

        const response = item_id
          ? await inventoryItemApi.getInventoryItemUsageHistoryById(Number(item_id), offset, limit, startDateStr, endDateStr)
          : await inventoryItemApi.getInventoryItemUsageHistory(offset, limit, startDateStr, endDateStr);
        
        setHistory(response.data);
        setTotalItems(response.total);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load usage history";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [item_id, currentPage, startDate, endDate]);

  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        const batchPromise = batchApi.getBatches();
        const itemPromise = item_id ? inventoryItemApi.getInventoryItem(Number(item_id)) : Promise.resolve(null);
        const [availableBatches, itemData] = await Promise.all([batchPromise, itemPromise]);
        setBatches(availableBatches);
        setInventoryItem(itemData);
      } catch (error) {
        console.error('Failed to fetch static data:', error);
      }
    };
    fetchStaticData();
  }, [item_id]);

  const getBatchNumber = (batchId: number | undefined) => {
    if (!batchId) return 'N/A';
    const batch = batches.find(b => b.id === batchId);
    return batch ? batch.batch_no : 'Unknown';
  };

  const handleExport = () => {
    exportTableToExcel('inventory-usage-history-table', 'inventory_usage_history', 'Inventory Usage History');
  };

  const handleShareAsImage = async () => {
    if (!tableRef.current) return;
    if (!navigator.share) {
      toast.error("Web Share API not supported");
      return;
    }
    setIsSharing(true);
    try {
      const dataUrl = await toPng(tableRef.current, { backgroundColor: '#ffffff', style: { padding: '10px' } });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `inventory-usage-history.png`, { type: 'image/png' });
      await navigator.share({ title: 'Inventory Usage History', files: [file] });
    } catch (error) {
      console.error('Sharing failed', error);
    } finally {
      setIsSharing(false);
    }
  };

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <>
      <PageHeader
        title={inventoryItem ? `Usage History: ${inventoryItem.name}` : "Inventory Usage History"}
        buttonLabel="Back"
        buttonLink="/feed-mill-stock"
        buttonIcon="bi-arrow-left"
      />
      <div className="container">
        <Card className="mb-4 shadow-sm border-0">
          <Card.Body>
            <Row>
              <Col md={6}>
                <label className="form-label fw-bold">Start Date</label>
                <CustomDatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  placeholderText="Filter from date"
                  isClearable
                />
              </Col>
              <Col md={6}>
                <label className="form-label fw-bold">End Date</label>
                <CustomDatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  placeholderText="Filter to date"
                  isClearable
                  minDate={startDate ?? undefined}
                />
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {loading && <Loading message="Loading history..." />}
        
        {!loading && !error && (
          <>
            <div className="mb-3 d-flex justify-content-end gap-2">
              <Button variant="outline-success" onClick={handleExport} disabled={history.length === 0}>
                <i className="bi bi-file-earmark-excel me-1"></i> Excel
              </Button>
              <Button variant="outline-secondary" onClick={handleShareAsImage} disabled={isSharing || history.length === 0}>
                <i className="bi bi-share me-1"></i> {isSharing ? 'Generating...' : 'Share'}
              </Button>
            </div>

            <div className="card shadow-sm border-0">
              <div className="table-responsive" ref={tableRef}>
                <table className="table table-hover align-middle mb-0" id="inventory-usage-history-table">
                  <thead className="bg-light">
                    <tr>
                      <th>Date & Time</th>
                      {!item_id && <th>Item Name</th>}
                      <th>Quantity</th>
                      <th>Batch</th>
                      <th>Performed By</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan={item_id ? 5 : 6} className="text-center py-4 text-muted">No usage records found for this period.</td>
                      </tr>
                    ) : (
                      history.map((item) => (
                        <tr key={item.id}>
                          <td>{new Date(item.used_at).toLocaleString()}</td>
                          {!item_id && <td className="fw-bold">{item.inventory_item_name || `ID: ${item.inventory_item_id}`}</td>}
                          <td>
                            <span className="badge bg-info-subtle text-info px-2 py-1">
                              {item.used_quantity} {item.unit}
                            </span>
                          </td>
                          <td>{getBatchNumber(item.batch_id)}</td>
                          <td><small className="text-muted">{item.changed_by}</small></td>
                          <td className="text-center">
                            <Button
                              variant="link"
                              className="text-danger p-0"
                              onClick={() => {
                                setUsageToRevert(item.id);
                                setShowRevertModal(true);
                              }}
                            >
                              Revert
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <Pagination className="justify-content-center mt-4">
                <Pagination.Prev onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} />
                {[...Array(totalPages)].map((_, i) => (
                  <Pagination.Item key={i+1} active={i+1 === currentPage} onClick={() => setCurrentPage(i+1)}>
                    {i+1}
                  </Pagination.Item>
                ))}
                <Pagination.Next onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} />
              </Pagination>
            )}
          </>
        )}
      </div>

      <Modal show={showRevertModal} onHide={() => setShowRevertModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Revert</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to revert this inventory usage? The stock will be restored to the inventory.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRevertModal(false)}>Cancel</Button>
          <Button
            variant="danger"
            onClick={async () => {
              if (!usageToRevert) return;
              try {
                await inventoryItemApi.revertInventoryItemUsage(usageToRevert);
                setHistory(prev => prev.filter(h => h.id !== usageToRevert));
                toast.success("Usage reverted successfully");
              } catch (err: any) {
                toast.error(err.message || "Failed to revert");
              } finally {
                setShowRevertModal(false);
              }
            }}
          >Revert Stock</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default InventoryUsageHistory;