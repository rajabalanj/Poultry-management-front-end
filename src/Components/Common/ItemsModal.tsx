
import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { inventoryItemApi } from '../../services/api';
import { InventoryItemResponse } from '../../types/InventoryItem';
import { SalesOrderItemResponse } from '../../types/SalesOrderItem';
import { PurchaseOrderItemResponse } from '../../types/PurchaseOrderItem';

type OrderItem = SalesOrderItemResponse | PurchaseOrderItemResponse;

interface ItemsModalProps {
  show: boolean;
  onHide: () => void;
  items: OrderItem[];
  title: string;
}

const ItemsModal: React.FC<ItemsModalProps> = ({ show, onHide, items, title }) => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItemResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventoryItems = async () => {
      try {
        setLoading(true);
        const inventoryItemsData = await inventoryItemApi.getInventoryItems();
        setInventoryItems(inventoryItemsData);
      } catch (error) {
        console.error("Failed to fetch inventory items:", error);
      } finally {
        setLoading(false);
      }
    };

    if (show) {
      fetchInventoryItems();
    }
  }, [show]);

  const getItemName = (itemId: number) => {
    const item = inventoryItems.find(i => i.id === itemId);
    return item?.name || 'N/A';
  };

  const getItemUnit = (itemId: number) => {
    const item = inventoryItems.find(i => i.id === itemId);
    return item?.unit || 'N/A';
  };

  return (
    <Modal show={show} onHide={onHide} centered scrollable size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <p>Loading items...</p>
        ) : items.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-striped table-hover mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item Name</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Price/Unit (Rs.)</th>
                  <th>Line Total (Rs.)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id || index}>
                    <td>{index + 1}</td>
                    <td>{getItemName(item.inventory_item_id)}</td>
                    <td>{item.quantity}</td>
                    <td>{getItemUnit(item.inventory_item_id)}</td>
                    <td>{(Number(item.price_per_unit) || 0).toFixed(2)}</td>
                    <td>{(Number(item.line_total) || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No items to display.</p>
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

export default ItemsModal;
