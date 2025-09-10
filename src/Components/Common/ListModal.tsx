import React from 'react';
import { Modal, Button } from 'react-bootstrap';

interface ListModalProps {
  show: boolean;
  onHide: () => void;
  title: string;
  items: string[]; // Array of strings to display in the list
}

const ListModal: React.FC<ListModalProps> = ({ show, onHide, title, items }) => {
  return (
    <Modal show={show} onHide={onHide} centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {
          items.length > 0 ? (
            <ul className="list-group">
              {items.map((item, index) => (
                <li key={index} className="list-group-item">{item}</li>
              ))}
            </ul>
          ) : (
            <p>No items to display.</p>
          )
        }
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ListModal;