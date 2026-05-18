import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from '../Layout/PageHeader';
import { inventoryItemApi } from '../../services/api';
import { InventoryItemResponse } from '../../types/InventoryItem';
import { useSubscription } from '../context/SubscriptionContext';
import SubscriptionWarning from '../Common/SubscriptionWarning';
import { Pagination } from 'react-bootstrap';

const ManageSellableItems: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchSellable, setSearchSellable] = useState('');
  const [searchNonSellable, setSearchNonSellable] = useState('');
  
  // Track current state of sellable items
  const [sellableIds, setSellableIds] = useState<Set<number>>(new Set());
  // Track original state to know what changed
  const [originalSellableIds, setOriginalSellableIds] = useState<Set<number>>(new Set());
  
  const { isSubscriptionPaid } = useSubscription();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await inventoryItemApi.getInventoryItems(0, 1000);
        setItems(data);
        const initialSellable = new Set(data.filter(i => i.is_sellable).map(i => i.id));
        setSellableIds(initialSellable);
        setOriginalSellableIds(initialSellable);
      } catch (error: any) {
        toast.error(error.message || 'Failed to load inventory items');
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
  }, []);

  const handleToggleSellable = (id: number) => {
    setSellableIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = async () => {
    const itemsToUpdate: Promise<any>[] = [];

    items.forEach(item => {
      const isCurrentlySellable = sellableIds.has(item.id);
      const wasOriginallySellable = originalSellableIds.has(item.id);

      // Only update if it actually changed!
      if (isCurrentlySellable !== wasOriginallySellable) {
        itemsToUpdate.push(
          inventoryItemApi.updateInventoryItem(item.id, { is_sellable: isCurrentlySellable })
        );
      }
    });

    if (itemsToUpdate.length === 0) {
      toast.info('No changes to save.');
      return;
    }

    setIsSaving(true);
    try {
      // Run all updates concurrently!
      await Promise.all(itemsToUpdate);
      toast.success('Successfully updated sellable items!');
      
      // Update original state to match new saved state
      setOriginalSellableIds(new Set(sellableIds));
    } catch (error: any) {
      toast.error(error.message || 'Failed to update some items');
    } finally {
      setIsSaving(false);
    }
  };

  const sellableItems = useMemo(() => 
    items.filter(i => sellableIds.has(i.id) && i.name.toLowerCase().includes(searchSellable.toLowerCase())), 
  [items, sellableIds, searchSellable]);

  const nonSellableItems = useMemo(() => 
    items.filter(i => !sellableIds.has(i.id) && i.name.toLowerCase().includes(searchNonSellable.toLowerCase())), 
  [items, sellableIds, searchNonSellable]);

  // Pagination logic
  const ITEMS_PER_PAGE = 15;
  const [sellablePage, setSellablePage] = useState(1);
  const [nonSellablePage, setNonSellablePage] = useState(1);

  // Reset to page 1 whenever the search queries change
  useEffect(() => setSellablePage(1), [searchSellable]);
  useEffect(() => setNonSellablePage(1), [searchNonSellable]);

  const paginatedSellableItems = useMemo(() => 
    sellableItems.slice((sellablePage - 1) * ITEMS_PER_PAGE, sellablePage * ITEMS_PER_PAGE), [sellableItems, sellablePage]);
  const totalSellablePages = Math.ceil(sellableItems.length / ITEMS_PER_PAGE);

  const paginatedNonSellableItems = useMemo(() => 
    nonSellableItems.slice((nonSellablePage - 1) * ITEMS_PER_PAGE, nonSellablePage * ITEMS_PER_PAGE), [nonSellableItems, nonSellablePage]);
  const totalNonSellablePages = Math.ceil(nonSellableItems.length / ITEMS_PER_PAGE);

  return (
    <>
      <PageHeader title="Manage Sellable Items" buttonVariant="secondary" buttonLabel="Back" buttonLink="/inventory-items" buttonIcon='bi-arrow-left'/>
      <div className="container">
        <SubscriptionWarning />
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Assign Items for Sales Orders</h5>
          </div>
          <div className="card-body">
            {isLoading ? (
              <div className="text-center my-4">Loading items...</div>
            ) : (
              <div className="row g-4">
                
                {/* Sellable Items Column */}
                <div className="col-12 col-md-6 order-1 order-md-1">
                  <h6 className="text-success fw-bold">Sellable Items (Available for Sale)</h6>
                  <input
                    type="text"
                    className="form-control form-control-sm mb-2"
                    placeholder="Search sellable items..."
                    value={searchSellable}
                    onChange={e => setSearchSellable(e.target.value)}
                  />
                  <div className="card d-flex flex-column" style={{ height: '400px' }}>
                    <div className="list-group list-group-flush" style={{ overflowY: 'auto', flexGrow: 1 }}>
                      {paginatedSellableItems.length === 0 && <div className="p-3 text-muted text-center">No sellable items found.</div>}
                      {paginatedSellableItems.map(item => (
                        <button key={item.id} onClick={() => handleToggleSellable(item.id)} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center list-group-item-success">
                          {item.name}
                          {/* Right arrow on desktop, Down arrow on mobile */}
                          <i className="bi bi-arrow-right-circle-fill text-danger d-none d-md-block" title="Remove from Sales"></i>
                          <i className="bi bi-arrow-down-circle-fill text-danger d-md-none" title="Remove from Sales"></i>
                        </button>
                      ))}
                    </div>
                    {totalSellablePages > 1 && (
                      <div className="card-footer bg-white d-flex justify-content-center border-top py-2">
                        <Pagination size="sm" className="mb-0">
                          <Pagination.Prev onClick={() => setSellablePage(p => Math.max(1, p - 1))} disabled={sellablePage === 1} />
                          <Pagination.Item disabled>{sellablePage} / {totalSellablePages}</Pagination.Item>
                          <Pagination.Next onClick={() => setSellablePage(p => Math.min(totalSellablePages, p + 1))} disabled={sellablePage === totalSellablePages} />
                        </Pagination>
                      </div>
                    )}
                  </div>
                </div>

                {/* Non-Sellable Items Column */}
                <div className="col-12 col-md-6 order-2 order-md-2">
                  <h6 className="text-secondary fw-bold">Non-Sellable Items</h6>
                  <input
                    type="text"
                    className="form-control form-control-sm mb-2"
                    placeholder="Search non-sellable items..."
                    value={searchNonSellable}
                    onChange={e => setSearchNonSellable(e.target.value)}
                  />
                  <div className="card d-flex flex-column" style={{ height: '400px' }}>
                    <div className="list-group list-group-flush" style={{ overflowY: 'auto', flexGrow: 1 }}>
                      {paginatedNonSellableItems.length === 0 && <div className="p-3 text-muted text-center">No non-sellable items found.</div>}
                      {paginatedNonSellableItems.map(item => (
                        <button key={item.id} onClick={() => handleToggleSellable(item.id)} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                          {item.name}
                          {/* Left arrow on desktop, Up arrow on mobile */}
                          <i className="bi bi-arrow-left-circle-fill text-success d-none d-md-block" title="Add to Sales"></i>
                          <i className="bi bi-arrow-up-circle-fill text-success d-md-none" title="Add to Sales"></i>
                        </button>
                      ))}
                    </div>
                    {totalNonSellablePages > 1 && (
                      <div className="card-footer bg-white d-flex justify-content-center border-top py-2">
                        <Pagination size="sm" className="mb-0">
                          <Pagination.Prev onClick={() => setNonSellablePage(p => Math.max(1, p - 1))} disabled={nonSellablePage === 1} />
                          <Pagination.Item disabled>{nonSellablePage} / {totalNonSellablePages}</Pagination.Item>
                          <Pagination.Next onClick={() => setNonSellablePage(p => Math.min(totalNonSellablePages, p + 1))} disabled={nonSellablePage === totalNonSellablePages} />
                        </Pagination>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="d-flex gap-2 mt-4">
              <button onClick={handleSave} className="btn btn-primary" disabled={isLoading || isSaving || isSubscriptionPaid === false}>
                {isSaving ? (
                  <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...</>
                ) : (
                  <><i className="bi bi-save me-1"></i> Save Changes</>
                )}
              </button>
              <button onClick={() => navigate('/inventory-items')} className="btn btn-secondary" disabled={isSaving}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManageSellableItems;