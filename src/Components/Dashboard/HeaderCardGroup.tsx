import React, { useState } from 'react';
import HeaderCard from './HeaderCard';
import ListModal from '../Common/ListModal'; // Import the new modal component
import Loading from '../Common/Loading'; // Import Loading component

export interface HeaderCardData {
  title: string;
  mainValue: number;
  icon: string;
  iconColor?: string;
  // subValue can be a number (secondary numeric value) or a string (extra info like a list)
  subValues?: { label: string; value: number; subValue?: number | string }[]; // Ensure subValue is included
}

interface HeaderCardGroupProps {
  cards: HeaderCardData[];
  loading: boolean;
  error: string | null;
  onViewDetails?: (title: string, items: string[]) => void; // New prop
}


const HeaderCardGroup: React.FC<HeaderCardGroupProps> = ({ cards, loading, error, onViewDetails }) => {
  // If a parent provided onViewDetails, forward to HeaderCard. Otherwise use local modal fallback.
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalItems, setModalItems] = useState<string[]>([]);

  const handleViewDetails = (title: string, items: string[]) => {
    if (onViewDetails) return onViewDetails(title, items);
    setModalTitle(title);
    setModalItems(items);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalTitle('');
    setModalItems([]);
  };
    
  if (loading) return <Loading message="Loading data..." />;
  if (error) return <div>{error}</div>;
  if (!cards || cards.length === 0) return <div>No data available</div>;

  return (
    <div className="mb-4">
      <div className="row g-3 g-md-2">
        {cards.map((card, index) => (
          <div className="col-12 col-md-6 col-lg-4" key={index}>
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