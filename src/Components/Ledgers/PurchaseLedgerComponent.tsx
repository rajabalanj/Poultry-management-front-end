
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Modal, Pagination } from 'react-bootstrap';
import { ledgerApi, businessPartnerApi } from '../../services/api';
import { PurchaseLedger } from '../../types/ledgers';
import Loading from '../Common/Loading';
import { BusinessPartner } from '../../types/BusinessPartner';
import StyledSelect from '../Common/StyledSelect';
import CustomDatePicker from '../Common/CustomDatePicker';
import AddPaymentForm from '../PurchaseOrder/AddPaymentForm';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useTableKeyboardNavigation } from '../../hooks/useTableKeyboardNavigation';
import { financialReportsApi } from '../../services/api';

type OptionType = { value: string; label: string };

const PurchaseLedgerComponent: React.FC = () => {
    const [vendorId, setVendorId] = useState(() => sessionStorage.getItem('pl_vendor_id') || '');
    const [ledgerData, setLedgerData] = useState<PurchaseLedger | null>(null);
    const [loading, setLoading] = useState(false);
    const [vendors, setVendors] = useState<BusinessPartner[]>([]);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const navigate = useNavigate();
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPoId, setSelectedPoId] = useState<number | null>(null);
    const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1);
    const [isSharing, setIsSharing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        const fetchVendors = async () => {
            try {
                const vendorsData = await businessPartnerApi.getVendors();
                setVendors(vendorsData);
            } catch (error) {
                toast.error('Failed to fetch vendors.');
            }
        };
        fetchVendors();
    }, []);

    useEffect(() => {
        sessionStorage.setItem('pl_vendor_id', vendorId);
    }, [vendorId]);

    useEffect(() => {
        if (sessionStorage.getItem('pl_loaded') === 'true' && vendorId) {
            handleFetchLedger();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFetchLedger = async () => {
        setLoading(true);
        setLedgerData(null);
        setCurrentPage(1);
        try {
            const formattedStartDate = startDate ? format(startDate, 'yyyy-MM-dd') : undefined;
            const formattedEndDate = endDate ? format(endDate, 'yyyy-MM-dd') : undefined;
            const parsedVendorId = vendorId ? parseInt(vendorId, 10) : undefined;
            const data = await ledgerApi.getPurchaseLedger(parsedVendorId, formattedStartDate, formattedEndDate);
            setLedgerData(data);
            sessionStorage.setItem('pl_loaded', 'true');
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch Purchase Ledger.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenPayment = (e: React.MouseEvent, po_id: number) => {
        e.stopPropagation();
        setSelectedPoId(po_id);
        setShowPaymentModal(true);
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
    
    const handleSharePurchaseLedgerPDF = () => handleShareOrDownload(
        () => financialReportsApi.exportPurchaseLedger(vendorId ? parseInt(vendorId, 10) : undefined, startDate ? format(startDate, 'yyyy-MM-dd') : undefined, endDate ? format(endDate, 'yyyy-MM-dd') : undefined, 'pdf'),
        `Purchase_Ledger_${vendorId || 'All'}_${startDate ? format(startDate, 'yyyy-MM-dd') : 'start'}_to_${endDate ? format(endDate, 'yyyy-MM-dd') : 'end'}.pdf`,
        'Purchase Ledger Report'
    );

    // Handle Escape key for payment modal
    useEscapeKey(() => setShowPaymentModal(false), showPaymentModal);

    const handleRowClick = (entry: PurchaseLedger['entries'][0], index?: number) => {
        if (index !== undefined) {
            setFocusedRowIndex(index);
            setSelectedIndex(index);
        }
        navigate(`/purchase-orders/${entry.po_id}/details`);
    };

    const paginatedEntries = ledgerData?.entries.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE) || [];
    const totalPages = Math.ceil((ledgerData?.entries.length || 0) / ITEMS_PER_PAGE);

    const renderPaginationItems = () => {
        const items = [];
        
        items.push(
            <Pagination.Prev
                key="prev"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
            />
        );

        if (totalPages <= 7) {
            for (let number = 1; number <= totalPages; number++) {
                items.push(
                    <Pagination.Item key={number} active={number === currentPage} onClick={() => setCurrentPage(number)}>
                        {number}
                    </Pagination.Item>
                );
            }
        } else {
            items.push(
                <Pagination.Item key={1} active={1 === currentPage} onClick={() => setCurrentPage(1)}>
                    1
                </Pagination.Item>
            );

            if (currentPage > 4) items.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);

            let startPage = Math.max(2, currentPage - 1);
            let endPage = Math.min(totalPages - 1, currentPage + 1);

            if (currentPage <= 4) {
                endPage = 5;
                startPage = 2;
            } else if (currentPage >= totalPages - 3) {
                startPage = totalPages - 4;
                endPage = totalPages - 1;
            }

            for (let number = startPage; number <= endPage; number++) {
                items.push(
                    <Pagination.Item key={number} active={number === currentPage} onClick={() => setCurrentPage(number)}>
                        {number}
                    </Pagination.Item>
                );
            }

            if (currentPage < totalPages - 3) items.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);

            items.push(
                <Pagination.Item key={totalPages} active={totalPages === currentPage} onClick={() => setCurrentPage(totalPages)}>
                    {totalPages}
                </Pagination.Item>
            );
        }

        items.push(
            <Pagination.Next
                key="next"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
            />
        );

        return items;
    };

    // Keyboard navigation for table rows
    const { resetSelection, setSelectedIndex } = useTableKeyboardNavigation({
        rowCount: paginatedEntries.length || 0,
        onRowSelect: (index) => {
            setFocusedRowIndex(index);
            const row = document.querySelector(`tr[data-row-index="${index}"]`);
            row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        },
        onRowEnter: (index) => {
            if (paginatedEntries && paginatedEntries[index]) {
                handleRowClick(paginatedEntries[index], index);
            }
        },
        onRowAction: (index, key) => {
            if (key === 'p' && paginatedEntries && paginatedEntries[index]) {
                setSelectedPoId(paginatedEntries[index].po_id);
                setShowPaymentModal(true);
            }
        },
        enabled: !showPaymentModal && paginatedEntries.length > 0,
    });

    // Reset keyboard navigation when ledger data changes
    useEffect(() => {
        resetSelection();
        setFocusedRowIndex(-1);
    }, [ledgerData, currentPage, resetSelection]);

    const vendorOptions: OptionType[] = vendors.map((vendor) => ({
        value: String(vendor.id),
        label: `${vendor.id} - ${vendor.name}`,
    }));
    const selectedVendorOption = vendorOptions.find(option => option.value === vendorId);

    return (
        <>
            <div>
                <div className="row g-3 align-items-end p-3 border-bottom">
                    <div className="col-md-3">
                        <label htmlFor="vendorId" className="form-label">Vendor ID</label>
                        <StyledSelect
                            id="vendorId"
                            value={selectedVendorOption}
                            onChange={(option, _action) => setVendorId(option ? String(option.value) : '')}
                            options={vendorOptions}
                            placeholder="Select a Vendor"
                            isClearable
                        />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">Start Date</label>
                        <CustomDatePicker
                            selected={startDate}
                            onChange={setStartDate}
                            placeholderText="Start Date"
                            isClearable
                        />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">End Date</label>
                        <CustomDatePicker
                            selected={endDate}
                            onChange={setEndDate}
                            placeholderText="End Date"
                            isClearable
                        />
                    </div>
                    <div className="col-md-4 d-flex justify-content-center justify-content-md-end gap-2">
                        <button className="btn btn-primary mb-2" onClick={handleFetchLedger} disabled={loading || isSharing}>
                            <i className="bi bi-journal-text me-2"></i>{loading ? 'Generating...' : 'Get Purchase Ledger'}
                        </button>
                        <button className="btn btn-secondary mb-2" onClick={handleSharePurchaseLedgerPDF} disabled={loading || isSharing || !ledgerData}>
                            <i className="bi bi-file-pdf me-1"></i>{isSharing ? 'Exporting...' : 'Share as PDF'}
                        </button>
                    </div>
                </div>
                {loading && <Loading message="Loading data..." />}
                {ledgerData && (
                    <div className="p-3">
                        <h5 className="mb-3">{ledgerData.title}</h5>
                        <p className="text-muted">
                            Vendor: {ledgerData.vendor_name ? `${ledgerData.vendor_name} (ID: ${ledgerData.vendor_id})` : ledgerData.vendor_id}
                            {ledgerData.total_records !== undefined && ` | Total records: ${ledgerData.total_records}`}
                        </p>
                        <div className="table-responsive">
                            <table className="table table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Vendor Name</th>
                                        <th>Invoice Number</th>
                                        <th>Description</th>
                                        <th>Amount</th>
                                        <th>Amount Paid</th>
                                        <th>Balance Amount</th>
                                        <th>Payment Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedEntries.map((entry, index) => (
                                        <tr 
                                            key={index} 
                                            data-row-index={index}
                                            onClick={() => handleRowClick(entry, index)} 
                                            className={focusedRowIndex === index ? 'table-primary' : ''}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td>{entry.date}</td>
                                            <td>{entry.vendor_name}</td>
                                            <td>{entry.invoice_number}</td>
                                            <td>{entry.description}</td>
                                            <td>{entry.amount_str || entry.amount.toFixed(2)}</td>
                                            <td>{entry.amount_paid_str || entry.amount_paid.toFixed(2)}</td>
                                            <td>{entry.balance_amount_str || entry.balance_amount.toFixed(2)}</td>
                                            <td>{entry.payment_status}</td>
                                            <td>
                                                <button 
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={(e) => handleOpenPayment(e, entry.po_id)}
                                                >
                                                    Add Payment
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {totalPages > 1 && (
                            <Pagination className="justify-content-center mt-3">
                                {renderPaginationItems()}
                            </Pagination>
                        )}
                    </div>
                )}
            </div>

            <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Add Payment</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedPoId && (
                        <AddPaymentForm 
                            poId={selectedPoId} 
                            onSuccess={() => {
                                setShowPaymentModal(false);
                                handleFetchLedger(); // Refresh ledger data
                            }}
                            onCancel={() => setShowPaymentModal(false)}
                        />
                    )}
                </Modal.Body>
            </Modal>
        </>
    );
};

export default PurchaseLedgerComponent;
