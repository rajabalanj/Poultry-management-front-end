// src/components/Shed/ShedIndex.tsx
import React, { useCallback, useEffect, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import PageHeader from "../Layout/PageHeader";
import { Modal, Button } from "react-bootstrap";
import { shedApi } from "../../services/api";
import { ShedResponse } from "../../types/shed";
import { toast } from 'react-toastify';
import { useSubscription } from '../context/SubscriptionContext';
import { usePageShortcuts } from "../../hooks/usePageShortcuts";
import { useModalScope } from "../../hooks/useModalScope";
import KeyboardShortcutsIndicator from "../Common/KeyboardShortcutsIndicator";
import { useTableKeyboardNavigation } from "../../hooks/useTableKeyboardNavigation";
import { useRef } from "react";
import ShedTable from "./ShedTable";


const ShedIndexPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheds, setSheds] = useState<ShedResponse[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const { isSubscriptionPaid } = useSubscription();

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1);

  usePageShortcuts({
    createNewPath: isSubscriptionPaid !== false ? '/sheds/create' : undefined,
  });

  useModalScope(showDeleteModal, 'modal');

  const { resetSelection, setSelectedIndex } = useTableKeyboardNavigation({
    rowCount: sheds.length,
    containerRef: tableContainerRef,
    onRowSelect: (index) => {
      setFocusedRowIndex(index);
    },
    onRowEnter: (index) => {
      const shed = sheds[index];
      if (shed) {
        window.location.href = `/sheds/${shed.id}/details`;
      }
    },
    onRowAction: (index, key) => {
      const shed = sheds[index];
      if (!shed) return;
      const k = key.toLowerCase();
      if (k === 'e' && isSubscriptionPaid !== false) {
        window.location.href = `/sheds/${shed.id}/edit`;
      } else if (k === 'd' && isSubscriptionPaid !== false) {
        handleDelete(shed.id);
      }
    },
    enabled: sheds.length > 0,
    actionKeys: ['e', 'E', 'd', 'D'],
  });

  useEffect(() => {
    resetSelection();
    setFocusedRowIndex(-1);
  }, [sheds, resetSelection]);

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
        buttonDisabled={isSubscriptionPaid === false}
      />
      <div className="container mt-4">
        <ShedTable
          sheds={sheds}
          loading={loading}
          error={error}
          onDelete={handleDelete}
          focusedRowIndex={focusedRowIndex}
          setFocusedRowIndex={setFocusedRowIndex}
          setSelectedIndex={setSelectedIndex}
          containerRef={tableContainerRef}
        />

        <Modal 
          show={showDeleteModal} 
          onHide={cancelDelete}
          onEntered={() => {
            const btn = document.querySelector('.modal-footer .btn-danger') as HTMLElement;
            btn?.focus();
          }}
        >
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
            <Button variant="danger" onClick={confirmDelete} disabled={!!deleteErrorMessage || isSubscriptionPaid === false}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
        <KeyboardShortcutsIndicator hasNew hasDelete />
      </div>
    </>
  );
};

export default ShedIndexPage;