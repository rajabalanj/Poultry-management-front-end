
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import PageHeader from './Layout/PageHeader';
import Loading from './Common/Loading';
import { inventoryItemApi } from '../services/api';
import { InventoryStockLevel } from '../types/inventoryStockLevel';

const LowStockReport = () => {
  const [reportData, setReportData] = useState<InventoryStockLevel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  }, []);

  return (
    <>
      <PageHeader title="Low Stock Report" buttonLabel="Back" buttonVariant="secondary" />
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
              <div className='table-responsive'>
              <table className="table table-bordered table-striped">
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
                  {reportData.map((item) => (
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
        )}
      </div>
    </>
  );
};

export default LowStockReport;
