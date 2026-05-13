import { useEffect, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import PageHeader from "../Layout/PageHeader";
import { businessPartnerApi } from "../../services/api";
import { BusinessPartner } from "../../types/BusinessPartner";
import { toast } from 'react-toastify';
import BusinessPartnerTable from "./BusinessPartnerTable";
import StyledSelect from "../Common/StyledSelect";
import { useSubscription } from "../context/SubscriptionContext";
import SubscriptionWarning from "../Common/SubscriptionWarning";

const getFilterLabel = (value: 'all' | 'vendors' | 'customers'): string => {
  switch (value) {
    case 'all': return 'All Partners';
    case 'vendors': return 'Vendors Only';
    case 'customers': return 'Customers Only';
    default: return '';
  }
};

const BusinessPartnerIndexPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partners, setPartners] = useState<BusinessPartner[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'vendors' | 'customers'>('all');
  const { isSubscriptionPaid } = useSubscription();

  useEffect(() => {
    const fetchPartners = async () => {
      setLoading(true);
      setError(null);
      try {
        let isVendor: boolean | undefined;
        let isCustomer: boolean | undefined;
        
        if (filterType === 'vendors') {
          isVendor = true;
        } else if (filterType === 'customers') {
          isCustomer = true;
        }
        
        const response = await businessPartnerApi.getBusinessPartners(0, 100, undefined, isVendor, isCustomer);
        setPartners(response);
      } catch (error: any) {
        setError(error?.message || 'Failed to fetch peoples');
        toast.error(error?.message || 'Failed to fetch peoples');
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, [filterType]);

  return (
    <>
      <PageHeader
        title="People"
        buttonVariant="primary"
        buttonLabel="Add People"
        buttonLink="/business-partners/create"
        buttonIcon="bi-plus-lg"
        buttonDisabled={isSubscriptionPaid === false}
      />
      
      <div className="container">
      <SubscriptionWarning />
      <div className="mb-3">
        <div className="card shadow-sm">
          <div className="card-header d-md-none p-3">
            <StyledSelect
              value={{ value: filterType, label: getFilterLabel(filterType) }}
              onChange={(option) => setFilterType(option?.value as 'all' | 'vendors' | 'customers' || 'all')}
              options={[
                { value: 'all', label: 'All Partners' },
                { value: 'vendors', label: 'Vendors Only' },
                { value: 'customers', label: 'Customers Only' }
              ]}
              placeholder="Select Filter"
            />
          </div>
          <div className="card-header d-none d-md-block p-0">
            <div className="btn-group w-100" role="group">
          <button 
            className={`btn ${filterType === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFilterType('all')}
          >
            All Partners
          </button>
          <button 
            className={`btn ${filterType === 'vendors' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFilterType('vendors')}
          >
            Vendors Only
          </button>
          <button 
            className={`btn ${filterType === 'customers' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFilterType('customers')}
          >
            Customers Only
          </button>
            </div>
          </div>
        </div>
      </div>

      <BusinessPartnerTable
        partners={partners}
        loading={loading}
        error={error}
      />
      </div>
    </>
  );
};

export default BusinessPartnerIndexPage;