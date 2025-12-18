import React, { useState } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import { inventoryItemApi } from '../../services/api';
import { InventoryItemResponse } from '../../types/InventoryItem';

interface AdjustInventoryModalProps {
  item: InventoryItemResponse;
  onClose: () => void;
  onSuccess: (updatedItem: InventoryItemResponse) => void;
}

const AdjustInventoryModal: React.FC<AdjustInventoryModalProps> = ({ item, onClose, onSuccess }) => {
  const [changeAmount, setChangeAmount] = useState<number>(0);
  const [isIncrease, setIsIncrease] = useState<boolean>(true);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (changeAmount === 0) {
      setError('Change amount cannot be zero.');
      setIsSubmitting(false);
      return;
    }

    // Apply the sign based on the adjustment type
    const finalAmount = isIncrease ? changeAmount : -Math.abs(changeAmount);

    try {
      const adjustment = {
        change_amount: finalAmount,
        change_type: 'manual' as const,
        note: note,
      };
      const updatedItem = await inventoryItemApi.adjustInventoryItem(item.id, adjustment);
      onSuccess(updatedItem);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Adjust Inventory for {item.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="adjustmentType">
            <Form.Label>Adjustment Type</Form.Label>
            <div>
              <Form.Check
                inline
                type="radio"
                label="Increase"
                name="adjustmentType"
                id="increaseRadio"
                checked={isIncrease}
                onChange={() => setIsIncrease(true)}
              />
              <Form.Check
                inline
                type="radio"
                label="Decrease"
                name="adjustmentType"
                id="decreaseRadio"
                checked={!isIncrease}
                onChange={() => setIsIncrease(false)}
              />
            </div>
          </Form.Group>

          <Form.Group className="mb-3" controlId="changeAmount">
            <Form.Label>Amount</Form.Label>
            <Form.Control
              type="number"
              value={Math.abs(changeAmount)}
              onChange={(e) => setChangeAmount(parseFloat(e.target.value))}
              min="0"
              step="1"
              required
            />
            <Form.Text className="text-muted">
              Enter the amount to {isIncrease ? "increase" : "decrease"} the stock by.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3" controlId="note">
            <Form.Label>Note</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
            />
          </Form.Group>

          {error && <Alert variant="danger">{error}</Alert>}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Adjustment'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AdjustInventoryModal;

