
import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import PageHeader from './Layout/PageHeader';
import Loading from './Common/Loading';
import { inventoryItemApi } from '../services/api';
import { InventoryStockLevel } from '../types/inventoryStockLevel';
import { toPng } from 'html-to-image';
import { exportTableToExcel } from '../utility/export-utils';
import CustomPagination from './Common/CustomPagination';

const LowStockReport = () => {
  const [reportData, setReportData] = useState<InventoryStockLevel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await inventoryItemApi.getLowStockItems();
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
    fetchData();
    setCurrentPage(1);
  }, []);

  const handleExport = async () => {
    exportTableToExcel('low-stock-report-table', 'low_stock_report', 'Low Stock');
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
      const file = new File([blob], `low-stock-report.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Low Stock Report',
          text: `Low Stock Report.`,
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

  const totalPages = Math.ceil(reportData.length / ITEMS_PER_PAGE);
  const paginatedData = reportData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <>
      <PageHeader title="Low Stock Report"/>
      <div className="container">
        {isLoading && <Loading message="Loading report..." />}
        {error && <div className="alert alert-danger text-center">{error}</div>}
        {!isLoading && !error && reportData.length === 0 && (
          <div className="text-center text-muted my-4">
            <p>No low stock items found.</p>
          </div>
        )}

        {reportData.length > 0 && (
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Low Stock Items</h5>
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
                  <h6 className="mb-1">{item.name}</h6>
                  <div className="text-sm">
                    <p className="mb-0 text-muted">Category: {item.category}</p>
                    <p className="mb-0">
                      <span className="text-danger fw-semibold">Stock: {item.current_stock} {item.unit}</span>
                      <span className="ms-2 text-muted">(Reorder: {item.reorder_level})</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="d-none d-md-block">
            <div ref={tableRef}>
              <div className='table-responsive'>
              <table id="low-stock-report-table" className="table table-bordered table-striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Current Stock</th>
                    <th>Unit</th>
                    <th>Reorder Level</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.category}</td>
                      <td>{item.current_stock}</td>
                      <td>{item.unit}</td>
                      <td>{item.reorder_level}</td>
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
      </div>
    </>
  );
};

export default LowStockReport;
