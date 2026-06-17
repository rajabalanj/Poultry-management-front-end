import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { Modal, Button, Form, Table } from 'react-bootstrap';
import PageHeader from './Layout/PageHeader';
import Loading from './Common/Loading';
import { inventoryItemApi } from '../services/api';
import { InventoryStockLevel, DailyStockReportEntry } from '../types/inventoryStockLevel';
import { InventoryItemCategory } from '../types/InventoryItem';
import StyledSelect from './Common/StyledSelect';
import { toPng } from 'html-to-image';
import { exportTableToExcel } from '../utility/export-utils';
import CustomPagination from './Common/CustomPagination';
import { useTableKeyboardNavigation } from '../hooks/useTableKeyboardNavigation';
import KeyboardShortcutsIndicator from './Common/KeyboardShortcutsIndicator';
import { usePageShortcuts } from '../hooks/usePageShortcuts';
import { useModalScope } from '../hooks/useModalScope';

const InventoryStockLevelReport = () => {
  const [reportData, setReportData] = useState<InventoryStockLevel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('');
  const [isSharing, setIsSharing] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1);

  // State for Daily Stock History Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryStockLevel | null>(null);
  const [historyData, setHistoryData] = useState<DailyStockReportEntry[]>([]);
  const [historyStartDate, setHistoryStartDate] = useState<string>('');
  const [historyEndDate, setHistoryEndDate] = useState<string>('');
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useModalScope(showHistoryModal, 'modal');

  const fetchData = async (filterCategory?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await inventoryItemApi.getInventoryStockLevels(filterCategory);
      setReportData(data);
    } catch (error: any) {
      const errorMsg = error?.message || 'Failed to fetch data';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(category);
    setCurrentPage(1);
  }, [category]);

  useEffect(() => {
    // Initialize history dates to last 30 days
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);

    setHistoryEndDate(end.toISOString().split('T')[0]);
    setHistoryStartDate(start.toISOString().split('T')[0]);
  }, []);

  const totalPages = Math.ceil(reportData.length / ITEMS_PER_PAGE);
  const paginatedData = reportData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const { resetSelection, setSelectedIndex } = useTableKeyboardNavigation({
    rowCount: paginatedData.length,
    containerRef: tableContainerRef,
    onRowSelect: (index) => {
      setFocusedRowIndex(index);
    },
    onRowEnter: (index) => {
      const item = paginatedData[index];
      if (item) handleViewHistory(item);
    },
    onRowAction: (index, key) => {
      const item = paginatedData[index];
      if (item && (key.toLowerCase() === 'v' || key.toLowerCase() === 'h')) {
        handleViewHistory(item);
      }
    },
    enabled: !showHistoryModal && !isLoading && paginatedData.length > 0,
    actionKeys: ['v', 'V', 'h', 'H'],
  });

  useEffect(() => {
    resetSelection();
    setFocusedRowIndex(-1);
  }, [currentPage, category, resetSelection]);

  const fetchHistoryData = async (itemId: number, start: string, end: string) => {
    setIsHistoryLoading(true);
    try {
      const data = await inventoryItemApi.getDailyStockReport(itemId, start, end);
      setHistoryData(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load history");
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleViewHistory = (item: InventoryStockLevel) => {
    setSelectedItem(item);
    setShowHistoryModal(true);
    // Reset data and fetch new
    setHistoryData([]);
    if (historyStartDate && historyEndDate) {
      fetchHistoryData(item.id, historyStartDate, historyEndDate);
    }
  };

  const handleCategoryChange = (option: any) => {
    setCategory(option ? option.value : '');
  };

  const handleExport = async () => {
    const fileName = `inventory-stock-level-report-${category || 'all'}`;
    exportTableToExcel('inventory-stock-level-table', fileName, 'Stock Levels');
  };

  const handleShare = async () => {
    if (!tableRef.current) {
      toast.error("Table element not found.");
      return;
    }

    if (!navigator.share) {
      toast.error("Web Share API is not supported in your browser.");
      return;
    }

    const tableNode = tableRef.current;
    const hiddenParent = tableNode.closest('.d-none');
    if (hiddenParent) {
      hiddenParent.classList.remove('d-none');
    }
    setIsSharing(true);

    const originalTableStyle = {
      width: tableNode.style.width,
      minWidth: tableNode.style.minWidth,
      whiteSpace: tableNode.style.whiteSpace,
    };

    try {
      tableNode.style.width = 'auto';
      tableNode.style.minWidth = '1200px';
      tableNode.style.whiteSpace = 'nowrap';

      const dataUrl = await toPng(tableNode, {
        backgroundColor: '#ffffff',
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `inventory-stock-level-report-${category || 'all'}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Inventory Stock Level Report',
          text: `Inventory Stock Level Report for ${category || 'All Categories'}.`,
          files: [file],
        });
        toast.success("Report shared successfully!");
      } else {
        toast.error("Sharing files is not supported on this device.");
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Sharing failed', error);
        toast.error(`Failed to share report: ${error.message}`);
      }
    } finally {
      tableNode.style.width = originalTableStyle.width;
      tableNode.style.minWidth = originalTableStyle.minWidth;
      tableNode.style.whiteSpace = originalTableStyle.whiteSpace;
      if (hiddenParent) {
        hiddenParent.classList.add('d-none');
      }
      setIsSharing(false);
    }
  };

  usePageShortcuts({
    onSearchFocus: () => {
      const filterInput = document.querySelector('#categorySelect input') as HTMLElement;
      if (filterInput) filterInput.focus();
    },
    onExport: !isLoading && reportData.length > 0 ? handleExport : undefined,
    onShare: !isLoading && !isSharing && reportData.length > 0 ? handleShare : undefined
  });

  return (
    <>
      <PageHeader title="Stock Levels" />
      <div className="container">
        <div className="col-12 mb-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Filters</h5>
              <div className="row g-3 align-items-end">
                <div className="col-12 col-md-auto">
                  <label htmlFor="categorySelect" className="form-label">Category</label>
                  <StyledSelect
                    id="categorySelect"
                    value={{ value: category, label: category || "All" }}
                    onChange={handleCategoryChange}
                    options={[
                      { value: "", label: "All" },
                      ...Object.values(InventoryItemCategory).map((cat) => ({
                        value: cat,
                        label: cat
                      }))
                    ]}
                    placeholder="Select Category"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <KeyboardShortcutsIndicator />

        {isLoading && <Loading message="Loading report..." />}
        {error && <div className="alert alert-danger text-center">{error}</div>}
        {!isLoading && !error && reportData.length === 0 && (
          <div className="text-center text-muted my-4">
            <p>No stock level data found for the selected criteria.</p>
          </div>
        )}

        {reportData.length > 0 && (
          <div className="card shadow-sm bg-light mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Stock Levels</h5>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-secondary"
                    onClick={handleShare}
                    disabled={isSharing || reportData.length === 0}
                  >
                    {isSharing ? 'Generating...' : 'Share as Image'}
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={handleExport}
                    disabled={reportData.length === 0}
                  >
                    Export to Excel
                  </button>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="d-block d-md-none">
                {paginatedData.map((item) => (
                  <div key={item.id} className="card mb-2 mt-2 border-top-0 border-end-0 border-start-0 border-bottom" style={{ borderRadius: 0 }}>
                    <div className="card-body p-2">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">
                            {item.name}
                            {item.is_sellable ? (
                              <span className="badge bg-success ms-2">Sellable</span>
                            ) : (
                              <span className="badge bg-secondary ms-2">No</span>
                            )}
                          </h6>
                          <div className="text-sm">
                            <p className="mb-0 text-muted">{item.category}</p>
                            <p className="mb-0">Stock: <span className="fw-semibold">{item.current_stock} {item.unit}</span></p>
                            <p className="mb-0">Avg Cost: {item.average_cost_str || item.average_cost}</p>
                            <p className="mb-0 text-muted">Reorder Level: {item.reorder_level}</p>
                          </div>
                        </div>
                        <div>
                          <button
                            className="btn btn-sm btn-info text-white mt-1"
                            onClick={() => handleViewHistory(item)}
                          >
                            History
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="d-none d-md-block">
                <div ref={tableRef}>
                  <div className="table-responsive" ref={tableContainerRef} tabIndex={0} style={{ outline: 'none' }}>
                    <table id="inventory-stock-level-table" className="table table-bordered table-striped">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Category</th>
                          <th>Current Stock</th>
                          <th>Unit</th>
                          <th>Average Cost</th>
                          <th>Reorder Level</th>
                          <th>Sellable</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedData.map((item, index) => (
                          <tr
                            key={item.id}
                            data-row-index={index}
                            onClick={() => {
                              setFocusedRowIndex(index);
                              setSelectedIndex(index);
                            }}
                            className={focusedRowIndex === index ? 'table-primary' : ''}
                          >
                            <td>{item.name}</td>
                            <td>{item.category}</td>
                            <td>{item.current_stock}</td>
                            <td>{item.unit}</td>
                            <td>{item.average_cost_str || item.average_cost}</td>
                            <td>{item.reorder_level}</td>
                            <td>
                              {item.is_sellable ? (
                                <span className="badge bg-success">Yes</span>
                              ) : (
                                <span className="badge bg-secondary">No</span>
                              )}
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-info text-white"
                                onClick={() => handleViewHistory(item)}
                              >
                                View History
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          </div>
        )}

        {/* Daily Stock History Modal */}
        <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Daily Stock History: {selectedItem?.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="row g-3 mb-3 align-items-end">
              <div className="col-md-4">
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={historyStartDate}
                  onChange={(e) => setHistoryStartDate(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  value={historyEndDate}
                  onChange={(e) => setHistoryEndDate(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <Button
                  variant="primary"
                  className="w-100"
                  onClick={() => selectedItem && fetchHistoryData(selectedItem.id, historyStartDate, historyEndDate)}
                  disabled={isHistoryLoading || !historyStartDate || !historyEndDate}
                >
                  {isHistoryLoading ? 'Loading...' : 'Update Report'}
                </Button>
              </div>
            </div>

            {historyData.length > 0 ? (
              <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Stock Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.map((entry, index) => (
                      <tr key={index}>
                        <td>{entry.date}</td>
                        <td>{entry.stock} {selectedItem?.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              !isHistoryLoading && <p className="text-center text-muted mt-3">No history data found for the selected period.</p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
};

export default InventoryStockLevelReport;
