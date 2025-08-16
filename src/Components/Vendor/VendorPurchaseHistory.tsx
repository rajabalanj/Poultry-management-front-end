import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from '../Layout/PageHeader';
import { vendorApi } from '../../services/api';
import { PurchaseOrderResponse } from '../../types/PurchaseOrder';
import { VendorResponse } from '../../types/Vendor';

const VendorPurchaseHistory: React.FC = () => {
  const { vendor_id } = useParams<{ vendor_id: string }>();
  const navigate = useNavigate();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderResponse[]>([]);
  const [vendor, setVendor] = useState<VendorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!vendor_id) {
          setError("Vendor ID is missing.");
          setLoading(false);
          return;
        }
        const [vendorData, purchaseOrdersData] = await Promise.all([
          vendorApi.getVendor(Number(vendor_id)),
          vendorApi.getVendorPurchaseHistory(Number(vendor_id))
        ]);
        setVendor(vendorData);
        setPurchaseOrders(purchaseOrdersData);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err?.message || "Failed to load purchase history.");
        toast.error(err?.message || "Failed to load purchase history.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [vendor_id]);

  if (loading) return <div className="text-center mt-5">Loading purchase history...</div>;
  if (error) return <div className="text-center text-danger mt-5">{error}</div>;
  if (!vendor) return <div className="text-center mt-5">Vendor not found or data is missing.</div>;

  return (
    <>
      <PageHeader
        title={`Purchase History: ${vendor.name}`}
        buttonVariant="secondary"
        buttonLabel="Back to Vendor Details"
        buttonLink={`/vendors/${vendor_id}/details`}
      />
      <div className="container mt-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <h5 className="card-title">Purchase</h5>
            {purchaseOrders.length > 0 ? (
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Purchase ID</th>
                    <th>Date</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((Purchase) => (
                    <tr key={Purchase.id}>
                      <td>{Purchase.id}</td>
                      <td>
                        {Purchase.order_date
                          ? new Date(Purchase.order_date).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td>
                        {Purchase.total_amount !== undefined &&
                        Purchase.total_amount !== null
                          ? `Rs. ${Number(Purchase.total_amount).toFixed(2)}`
                          : "N/A"}
                      </td>
                      <td>{Purchase.status || "N/A"}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-info"
                          onClick={() =>
                            navigate(`/purchase-orders/${Purchase.id}/details`)
                          }
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No Purchase found for this vendor.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default VendorPurchaseHistory;