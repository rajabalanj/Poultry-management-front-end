// src/components/Shed/ShedIndex.tsx
import React, { useCallback, useEffect, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import PageHeader from "../Layout/PageHeader";
import { Modal, Button } from "react-bootstrap";
import { shedApi } from "../../services/api";
import { ShedResponse } from "../../types/shed";
import { toast } from 'react-toastify';
import ShedTable from "./ShedTable";


const ShedIndexPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheds, setSheds] = useState<ShedResponse[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchShedList = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await shedApi.getSheds();
        setSheds(response);
      } catch (error: any) {
        setError(error?.message || 'Failed to fetch shed list');
        toast.error(error?.message || 'Failed to fetch shed list');
      } finally {
        setLoading(false);
      }
    };

    fetchShedList();
  }, []);

  const handleDelete = useCallback((id: number) => {
    setItemToDelete(id);
    setDeleteErrorMessage(null);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = async () => {
    if (itemToDelete !== null) {
      try {
        await shedApi.deleteShed(itemToDelete);
        setSheds((prevItems) => prevItems.filter((item) => item.id !== itemToDelete));
        toast.success("Shed deleted successfully!");
        setItemToDelete(null);
        setShowDeleteModal(false);
      } catch (error: any) {
        const message = error?.message || 'Failed to delete shed';
        setDeleteErrorMessage(message);
        toast.error(message);
      }
    }
  };

  const cancelDelete = () => {
    setItemToDelete(null);
    setShowDeleteModal(false);
    setDeleteErrorMessage(null);
  };

  return (
    <>
      <PageHeader
        title="Sheds"
        buttonVariant="primary"
        buttonLabel="Add New Shed"
        buttonLink="/sheds/create"
        buttonIcon="bi-plus-lg"
      />
      <div className="container mt-4">
        <ShedTable
          sheds={sheds}
          loading={loading}
          error={error}
          onDelete={handleDelete}
        />

        <Modal show={showDeleteModal} onHide={cancelDelete}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Delete</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {deleteErrorMessage ? (
              <div className="text-danger mb-3">{deleteErrorMessage}</div>
            ) : (
              "Are you sure you want to delete this shed?"
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={cancelDelete}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} disabled={!!deleteErrorMessage}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
};

export default ShedIndexPage;