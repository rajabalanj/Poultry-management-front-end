
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ledgerApi, inventoryItemApi } from '../../services/api';
import { InventoryLedger } from '../../types/ledgers';
import Loading from '../Common/Loading';
import { InventoryItemResponse } from '../../types/InventoryItem';
import CustomDatePicker from '../Common/CustomDatePicker';
import StyledSelect from '../Common/StyledSelect';
import {financialReportsApi} from '../../services/api';
import { format } from 'date-fns';

type OptionType = { value: string; label: string };

const InventoryLedgerComponent: React.FC = () => {
    const today = new Date().toISOString().slice(0, 10);
    const [itemId, setItemId] = useState(() => sessionStorage.getItem('il_item_id') || '');
    const [startDate, setStartDate] = useState(() => sessionStorage.getItem('il_start_date') || today);
    const [endDate, setEndDate] = useState(() => sessionStorage.getItem('il_end_date') || today);
    const [ledgerData, setLedgerData] = useState<InventoryLedger | null>(null);
    const [loading, setLoading] = useState(false);
    const [inventoryItems, setInventoryItems] = useState<InventoryItemResponse[]>([]);
    const [isSharing, setIsSharing] = useState(false);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const itemsData = await inventoryItemApi.getInventoryItems(0, 1000); // Fetch a larger list
                setInventoryItems(itemsData);
            } catch (error) {
                toast.error('Failed to fetch inventory items.');
            }
        };
        fetchItems();
    }, []);

    useEffect(() => {
        sessionStorage.setItem('il_item_id', itemId);
        sessionStorage.setItem('il_start_date', startDate);
        sessionStorage.setItem('il_end_date', endDate);
    }, [itemId, startDate, endDate]);

    useEffect(() => {
        if (sessionStorage.getItem('il_loaded') === 'true' && itemId) {
            handleFetchLedger();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFetchLedger = async () => {
        if (!itemId) {
            toast.error('Please enter an Item ID.');
            return;
        }
        if (new Date(startDate) > new Date(endDate)) {
            toast.error('Start date cannot be after end date.');
            return;
        }
        setLoading(true);
        setLedgerData(null);
        try {
            const data = await ledgerApi.getInventoryLedger(parseInt(itemId, 10), startDate, endDate);
            setLedgerData(data);
            sessionStorage.setItem('il_loaded', 'true');
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch Inventory Ledger.');
        } finally {
            setLoading(false);
        }
    };

    const handleShareOrDownload = async (fetchBlob: () => Promise<Blob>, filename: string, title: string) => {
                setIsSharing(true);
                try {
                  const blob = await fetchBlob();
                  const file = new File([blob], filename, { type: 'application/pdf' });
            
                  if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                      await navigator.share({ title, files: [file] });
                      toast.success(`${title} shared successfully!`);
                      return;
                    } catch (shareError: any) {
                      if (shareError.name === 'AbortError') return;
                      console.error('Share error:', shareError);
                    }
                  }
                  
                  // Fallback: direct download
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = filename;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                  toast.success(`${title} downloaded successfully!`);
                } catch (error: any) {
                  console.error('Failed to export PDF:', error);
                  toast.error(error.message || `Failed to export ${title}.`);
                } finally {
                  setIsSharing(false);
                }
              };

        const handleShareInventoryLedgerPDF = () => handleShareOrDownload(() => financialReportsApi.exportInventoryLedger(parseInt(itemId, 10), startDate ? format(startDate, 'yyyy-MM-dd') : '', endDate ? format(endDate, 'yyyy-MM-dd') : '', 'pdf'), 
        `Inventory_Ledger_Item_${itemId}_${startDate}_to_${endDate}.pdf`, 'Inventory Ledger Report');

    const itemOptions: OptionType[] = inventoryItems.map((item) => ({
        value: String(item.id),
        label: `${item.id} - ${item.name}`,
    }));
    const selectedItemOption = itemOptions.find(option => option.value === itemId);

    return (
        <div>
            <div className="row g-3 align-items-end p-3 border-bottom">
                <div className="col-md-3">
                    <label htmlFor="itemId" className="form-label">Item ID</label>
                    <StyledSelect
                        id="itemId"
                        value={selectedItemOption}
                        onChange={(option, _action) => setItemId(option ? String(option.value) : '')}
                        options={itemOptions}
                        placeholder="Select an Item"
                    />
                </div>
                <div className="col-md-3">
                    <label htmlFor="invStartDate" className="form-label me-3 mb-0">Start Date</label>
                    <CustomDatePicker
                        id="invStartDate"
                        selected={startDate ? new Date(startDate) : null}
                        onChange={(date: Date | null) => date && setStartDate(date.toISOString().slice(0, 10))}
                        maxDate={endDate ? new Date(endDate) : undefined}
                        className="form-control"
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        dateFormat="dd-MM-yyyy"
                    />
                </div>
                <div className="col-md-3">
                    <label htmlFor="invEndDate" className="form-label me-3 mb-0">End Date</label>
                    <CustomDatePicker
                        id="invEndDate"
                        selected={endDate ? new Date(endDate) : null}
                        onChange={(date: Date | null) => date && setEndDate(date.toISOString().slice(0, 10))}
                        minDate={startDate ? new Date(startDate) : undefined}
                        maxDate={new Date(today)}
                        className="form-control"
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        dateFormat="dd-MM-yyyy"
                    />
                </div>
                <div className="col-md-4 d-flex flex-wrap justify-content-center justify-content-md-end gap-2">
                    <button className="btn btn-primary mb-2" onClick={handleFetchLedger} disabled={loading || isSharing}>
                        <i className="bi bi-journal-text me-2"></i>{loading ? 'Generating...' : 'Get Inventory Ledger'}
                    </button>
                    <button className="btn btn-secondary mb-2" onClick={handleShareInventoryLedgerPDF} disabled={loading || isSharing || !ledgerData}>
                            <i className="bi bi-file-pdf me-1"></i>{isSharing ? 'Exporting...' : 'Share as PDF'}
                        </button>
                </div>
            </div>
            {loading && <Loading message="Loading data..." />}
            {ledgerData && (
                <div className="p-3">
                    <h5 className="mb-3">{ledgerData.title}</h5>
                    <p className="text-muted">Item ID: {ledgerData.item_id}</p>
                    <p className="text-muted">Opening Quantity: {Number(ledgerData.opening_quantity || 0).toFixed(2)}</p>
                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Reference</th>
                                    <th>Quantity Received</th>
                                    <th>Unit Cost</th>
                                    <th>Total Cost</th>
                                    <th>Quantity Sold</th>
                                    <th>Quantity on Hand</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ledgerData.entries.map((entry, index) => (
                                    <tr key={index}>
                                        <td>{entry.date}</td>
                                        <td>{entry.reference}</td>
                                        <td>{entry.quantity_received != null ? Number(entry.quantity_received).toFixed(2) : ''}</td>
                                        <td>{entry.unit_cost_str || (entry.unit_cost != null ? Number(entry.unit_cost).toFixed(2) : '')}</td>
                                        <td>{entry.total_cost_str || (entry.total_cost != null ? Number(entry.total_cost).toFixed(2) : '')}</td>
                                        <td>{entry.quantity_sold != null ? Number(entry.quantity_sold).toFixed(2) : ''}</td>
                                        <td>{Number(entry.quantity_on_hand || 0).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-muted">Closing Quantity on Hand: {Number(ledgerData.closing_quantity_on_hand || 0).toFixed(2)}</p>
                </div>
            )}
        </div>
    );
};

export default InventoryLedgerComponent;
