import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { inventoryItemApi, batchApi } from '../../services/api';
import { InventoryItemResponse, InventoryItemUnit } from '../../types/InventoryItem';
import { BatchResponse } from '../../types/batch';
import StyledSelect from '../Common/StyledSelect';
import CustomDatePicker from '../Common/CustomDatePicker';

interface UseInventoryItemModalProps {
  item: InventoryItemResponse;
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const UseInventoryItemModal: React.FC<UseInventoryItemModalProps> = ({ item, show, onClose, onSuccess }) => {
  const [batches, setBatches] = useState<BatchResponse[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<{
    batch_no: string;
    used_quantity: string;
    unit: InventoryItemUnit;
    usedAt: Date | null;
  }>({
    batch_no: '',
    used_quantity: '',
    unit: item.unit || 'kg' as InventoryItemUnit,
    usedAt: new Date(),
  });

  useEffect(() => {
    const fetchBatches = async () => {
      setLoadingBatches(true);
      try {
        const response = await batchApi.getBatches(0, 100);
        setBatches(response);
      } catch (error) {
        console.error('Failed to fetch batches:', error);
        toast.error('Failed to load batches');
      } finally {
        setLoadingBatches(false);
      }
    };

    if (show) {
      fetchBatches();
    }
  }, [show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.batch_no || 
      !formData.used_quantity || 
      parseFloat(formData.used_quantity) <= 0 || 
      !formData.usedAt
    ) {
      toast.warning('Please enter valid batch and quantity');
      return;
    }

    setSubmitting(true);
    try {
      const date = formData.usedAt as Date;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}T00:00:00`;

      await inventoryItemApi.useInventoryItem({
        inventory_item_id: item.id,
        batch_no: formData.batch_no,
        used_quantity: parseFloat(formData.used_quantity),
        usedAt: formattedDate,
        unit: formData.unit,
      });
      toast.success('Inventory usage recorded successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to record usage');
    } finally {
      setSubmitting(false);
    }
  };

  const batchOptions = batches.map(b => ({ value: b.batch_no, label: b.batch_no }));
  const unitOptions = [
    { value: 'gram', label: 'gram' },
    { value: 'kg', label: 'kg' },
    { value: 'ton', label: 'ton' },
  ];

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Use Inventory Item: {item.name}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Select Batch</Form.Label>
            <StyledSelect
              options={batchOptions}
              isLoading={loadingBatches}
              placeholder="Select a batch..."
              value={batchOptions.find(o => o.value === formData.batch_no)}
              onChange={(opt) => setFormData({ ...formData, batch_no: opt?.value ? String(opt.value) : '' })}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Quantity</Form.Label>
            <Form.Control
              type="number"
              step="any"
              placeholder="Enter quantity"
              value={formData.used_quantity}
              onChange={(e) => setFormData({ ...formData, used_quantity: e.target.value })}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Usage Date</Form.Label>
            <CustomDatePicker
              selected={formData.usedAt}
              onChange={(date) => setFormData({ ...formData, usedAt: date })}
              dateFormat="dd-MM-yyyy"
              placeholderText="Select date"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Unit</Form.Label>
            <StyledSelect
              options={unitOptions}
              value={unitOptions.find(o => o.value === formData.unit)}
              onChange={(opt) => setFormData({ ...formData, unit: (opt?.value ? String(opt.value) : 'kg') as InventoryItemUnit })}
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Saving...
              </>
            ) : (
              'Submit'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default UseInventoryItemModal;