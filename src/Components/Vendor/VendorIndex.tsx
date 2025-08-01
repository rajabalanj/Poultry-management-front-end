// src/components/Vendor/VendorIndex.tsx
import { useCallback, useEffect, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import PageHeader from "../Layout/PageHeader"; // Assuming this path is correct
import { Modal, Button } from "react-bootstrap";
import { vendorApi } from "../../services/api"; // Import the new vendorApi
import { VendorResponse } from "../../types/Vendor";
import { toast } from 'react-toastify';
import VendorTable from "./VendorTable"; // Import the VendorTable

const VendorIndexPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vendors, setVendors] = useState<VendorResponse[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<number | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null); // To show specific delete errors

  // Effect to fetch vendor list
  useEffect(() => {
    const fetchVendorList = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await vendorApi.getVendors();
        setVendors(response);
      } catch (error: any) {
        setError(error?.message || 'Failed to fetch vendor list');
        toast.error(error?.message || 'Failed to fetch vendor list');
      } finally {
        setLoading(false);
      }
    };
    fetchVendorList();
  }, []); // Run once on component mount

  const handleDelete = useCallback((id: number) => {
    setVendorToDelete(id);
    setDeleteErrorMessage(null); // Clear previous error messages
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = async () => {
    if (vendorToDelete !== null) {
      try {
        await vendorApi.deleteVendor(vendorToDelete);
        setVendors((prevVendors) => prevVendors.filter((vendor) => vendor.id !== vendorToDelete));
        toast.success("Vendor deleted successfully!");
      } catch (error: any) {
        const message = error?.message || 'Failed to delete vendor';
        setDeleteErrorMessage(message); // Set specific error message for modal
        toast.error(message);
      } finally {
        // Only close modal if no specific error message is displayed
        if (!deleteErrorMessage) {
            setVendorToDelete(null);
            setShowDeleteModal(false);
        }
      }
    }
  };

  const cancelDelete = () => {
    setVendorToDelete(null);
    setShowDeleteModal(false);
    setDeleteErrorMessage(null); // Clear error message on cancel
  };

  return (
    <>
      <PageHeader title="Vendor List" buttonVariant="primary" buttonLabel="Create Vendor" buttonLink="/create-vendor" />
      <div>
        <VendorTable
          vendors={vendors}
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
              "Are you sure you want to delete this vendor?"
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

export default VendorIndexPage;