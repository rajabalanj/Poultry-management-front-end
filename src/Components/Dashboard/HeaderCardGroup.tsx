import React from 'react';
import HeaderCard from './HeaderCard';

interface HeaderCardData {
  title: string;
  mainValue: number;
  icon: string;
  subValues?: { label: string; value: number }[];
}

interface HeaderCardGroupProps {
  cards: HeaderCardData[];
  loading: boolean;
  error: string | null;
}


const HeaderCardGroup: React.FC<HeaderCardGroupProps> = ({ cards, loading, error }) => {
    
  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!cards || cards.length === 0) return <div>No data available</div>;

  return (
    <div className="mb-4">
      <div className="row g-2">
        {cards.map((card, index) => (
          <div className="col-4" key={index}>
            <HeaderCard {...card} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeaderCardGroup;