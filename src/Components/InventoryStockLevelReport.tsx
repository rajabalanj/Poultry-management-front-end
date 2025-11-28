
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import PageHeader from './Layout/PageHeader';
import Loading from './Common/Loading';
import { inventoryItemApi } from '../services/api';
import { InventoryStockLevel } from '../types/inventoryStockLevel';
import { InventoryItemCategory } from '../types/InventoryItem';

const InventoryStockLevelReport = () => {
  const [reportData, setReportData] = useState<InventoryStockLevel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('');

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

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
  };

  return (
    <>
      <PageHeader title="Inventory Stock Levels" buttonLabel="Back" buttonVariant="secondary" />
      <div className="container">
        <div className="col-12 mb-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Filters</h5>
              <div className="row g-3 align-items-end">
                <div className="col-12 col-md-auto">
                  <label htmlFor="categorySelect" className="form-label">Category</label>
                  <select
                    id="categorySelect"
                    className="form-select"
                    value={category}
                    onChange={handleCategoryChange}
                  >
                    <option value="">All</option>
                    {Object.values(InventoryItemCategory).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
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
          <div className="card shadow-sm bg-light rounded mb-4">
            <div className="card-body">
              <div className="table-responsive">
              <table className="table table-bordered table-striped">
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
                      <td>{item.average_cost}</td>
                      <td>{item.reorder_level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default InventoryStockLevelReport;
