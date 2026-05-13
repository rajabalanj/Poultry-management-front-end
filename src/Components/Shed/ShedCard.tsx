// src/Components/Shed/ShedCard.tsx
import React from "react";
import { ShedResponse } from "../../types/shed";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "../context/SubscriptionContext";

interface ShedCardProps {
  shed: ShedResponse;
  onDelete: (id: number) => void;
}

const ShedCard: React.FC<ShedCardProps> = ({ shed, onDelete }) => {
  const navigate = useNavigate();

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click from firing
    navigate(`/sheds/${shed.id}/edit`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click from firing
    onDelete(shed.id);
  };

  const handleViewDetails = () => {
    navigate(`/sheds/${shed.id}/details`);
  };

  const { isSubscriptionPaid } = useSubscription();

  return (
    <div
      className="card mb-3"
      style={{ cursor: "pointer" }}
      onClick={handleViewDetails}
    >
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="card-title">{shed.shed_no}</h5>
          <div>
            <button className="btn btn-sm btn-outline-primary me-2" onClick={handleEdit} disabled={isSubscriptionPaid === false}>
              <i className="bi bi-pencil-fill"></i>
            </button>
            <button className="btn btn-sm btn-outline-danger" onClick={handleDelete} disabled={isSubscriptionPaid === false}>
              <i className="bi bi-trash-fill"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShedCard;
