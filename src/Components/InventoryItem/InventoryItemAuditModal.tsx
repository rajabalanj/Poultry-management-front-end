
import React, { useState, useEffect } from 'react';
import { Modal, Button, Table } from 'react-bootstrap';
import { inventoryItemApi } from '../../services/api';
import { InventoryItemAudit } from '../../types/InventoryItemAudit';

interface InventoryItemAuditModalProps {
  show: boolean;
  onHide: () => void;
  itemId: number;
}

const InventoryItemAuditModal: React.FC<InventoryItemAuditModalProps> = ({ show, onHide, itemId }) => {
  const [auditLog, setAuditLog] = useState<InventoryItemAudit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      const fetchAuditLog = async () => {
        setLoading(true);
        try {
          const data = await inventoryItemApi.getInventoryItemAudit(itemId);
          setAuditLog(data);
        } catch (err) {
          setError('Failed to load audit log.');
        } finally {
          setLoading(false);
        }
      };
      fetchAuditLog();
    }
  }, [show, itemId]);

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Inventory Audit Trail</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading && <p>Loading...</p>}
        {error && <p className="text-danger">{error}</p>}
        {!loading && !error && (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Date</th>
                <th>Change Type</th>
                <th>Change Amount</th>
                <th>Old Quantity</th>
                <th>New Quantity</th>
                <th>Changed By</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>{log.change_type}</td>
                  <td>{log.change_amount}</td>
                  <td>{log.old_quantity}</td>
                  <td>{log.new_quantity}</td>
                  <td>{log.changed_by}</td>
                  <td>{log.note}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default InventoryItemAuditModal;
