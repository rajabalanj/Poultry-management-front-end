
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ledgerApi, inventoryItemApi } from '../../services/api';
import { InventoryLedger } from '../../types/ledgers';
import Loading from '../Common/Loading';
import { DateSelector } from '../DateSelector';
import { InventoryItemResponse } from '../../types/InventoryItem';

const InventoryLedgerComponent: React.FC = () => {
    const today = new Date().toISOString().slice(0, 10);
    const [itemId, setItemId] = useState('');
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [ledgerData, setLedgerData] = useState<InventoryLedger | null>(null);
    const [loading, setLoading] = useState(false);
    const [inventoryItems, setInventoryItems] = useState<InventoryItemResponse[]>([]);

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
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch Inventory Ledger.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="row g-3 align-items-end p-3 border-bottom">
                <div className="col-md-3">
                    <label htmlFor="itemId" className="form-label">Item ID</label>
                    <select
                        id="itemId"
                        className="form-select"
                        value={itemId}
                        onChange={(e) => setItemId(e.target.value)}
                    >
                        <option value="">Select an Item</option>
                        {inventoryItems.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.id} - {item.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-md-3">
                    <DateSelector label="Start Date" value={startDate} onChange={setStartDate} maxDate={endDate} />
                </div>
                <div className="col-md-3">
                    <DateSelector label="End Date" value={endDate} onChange={setEndDate} minDate={startDate} maxDate={today} />
                </div>
                <div className="col-md-3">
                    <button className="btn btn-primary w-100 mb-2" onClick={handleFetchLedger} disabled={loading}>
                        {loading ? 'Generating...' : 'Get Inventory Ledger'}
                    </button>
                </div>
            </div>
            {loading && <Loading message="Loading data..." />}
            {ledgerData && (
                <div className="p-3">
                    <h4 className="mb-3">{ledgerData.title}</h4>
                    <p className="text-muted">Item ID: {ledgerData.item_id}</p>
                    <p className="text-muted">Opening Quantity: {ledgerData.opening_quantity.toFixed(2)}</p>
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
                                        <td>{entry.quantity_received?.toFixed(2)}</td>
                                        <td>{entry.unit_cost?.toFixed(2)}</td>
                                        <td>{entry.total_cost?.toFixed(2)}</td>
                                        <td>{entry.quantity_sold?.toFixed(2)}</td>
                                        <td>{entry.quantity_on_hand.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-muted">Closing Quantity on Hand: {ledgerData.closing_quantity_on_hand.toFixed(2)}</p>
                </div>
            )}
        </div>
    );
};

export default InventoryLedgerComponent;
