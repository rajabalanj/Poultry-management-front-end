
import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import PageHeader from './Layout/PageHeader';
import Loading from './Common/Loading';
import { inventoryItemApi } from '../services/api';
import { InventoryStockLevel } from '../types/inventoryStockLevel';
import { InventoryItemCategory } from '../types/InventoryItem';
import StyledSelect from './Common/StyledSelect';
import { toPng } from 'html-to-image';
import { exportTableToExcel } from '../utility/export-utils';

const InventoryStockLevelReport = () => {
  const [reportData, setReportData] = useState<InventoryStockLevel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('');
  const [isSharing, setIsSharing] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

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
  }, [category]);

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
      setIsSharing(false);
    }
  };

  return (
    <>
      <PageHeader title="Inventory Stock Levels"/>
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
                <h5 className="mb-0">Inventory Stock Levels</h5>
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
            <div ref={tableRef}>
              <div className="table-responsive">
              <table id="inventory-stock-level-table" className="table table-bordered table-striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Current Stock</th>
                    <th>Unit</th>
                    <th>Average Cost</th>
                    <th>Reorder Level</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.category}</td>
                      <td>{item.current_stock}</td>
                      <td>{item.unit}</td>
                      <td>{item.average_cost_str || item.average_cost}</td>
                      <td>{item.reorder_level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default InventoryStockLevelReport;
