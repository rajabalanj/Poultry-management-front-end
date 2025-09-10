import React, { useState } from 'react';
import HeaderCard from './HeaderCard';
import ListModal from '../Common/ListModal'; // Import the new modal component

export interface HeaderCardData {
  title: string;
  mainValue: number;
  icon: string;
  iconColor?: string;
  subValues?: { label: string; value: number; subValue?: number }[]; // Ensure subValue is included
}

interface HeaderCardGroupProps {
  cards: HeaderCardData[];
  loading: boolean;
  error: string | null;
  onViewDetails?: (title: string, items: string[]) => void; // New prop
}


const HeaderCardGroup: React.FC<HeaderCardGroupProps> = ({ cards, loading, error }) => {
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalItems, setModalItems] = useState<string[]>([]);

  const handleViewDetails = (title: string, items: string[]) => {
    setModalTitle(title);
    setModalItems(items);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalTitle('');
    setModalItems([]);
  };
    
  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!cards || cards.length === 0) return <div>No data available</div>;

  return (
    <div className="mb-4">
      <div className="row g-2">
        {cards.map((card, index) => (
          <div className="col-4" key={index}>
            <HeaderCard {...card} onViewDetails={handleViewDetails} />
          </div>
        ))}
      </div>

      <ListModal
        show={showModal}
        onHide={handleCloseModal}
        title={modalTitle}
        items={modalItems}
      />
    </div>
  );
};

export default HeaderCardGroup;