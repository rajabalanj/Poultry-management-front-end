import React from 'react';
import HeaderCard from './HeaderCard';
import { Batch } from '../../services/api';

interface HeaderCardGroupProps {
  batches: Batch[];
  loading: boolean;
  error: string | null;
}

const HeaderCardGroup: React.FC<HeaderCardGroupProps> = ({ batches, loading, error }) => {
    
  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!batches || batches.length === 0) return <div>No data available</div>;

  return (
    <div className="mb-4">
      <div className="row g-2">
        <div className="col-4">
          <HeaderCard
            title="Total Birds"
            mainValue= {batches.reduce((sum, batch) => sum + batch.calculated_closing_count, 0)}
            icon="bi bi-feather"
          />
        </div>
        
        <div className="col-4">
          <HeaderCard
            title="Total Eggs"
            mainValue={batches.reduce((sum, batch) => sum + batch.total_eggs, 0)}
            icon="bi-egg"
            subValues={[
              { label: 'Normal', value: batches.reduce((sum, batch) => sum + batch.table, 0) },
              { label: 'Jumbo', value: batches.reduce((sum, batch) => sum + batch.jumbo, 0) },
              { label: 'Crack', value: batches.reduce((sum, batch) => sum + batch.cr, 0) }
            ]}
          />
        </div>
        
        <div className="col-4">
          <HeaderCard
            title="Total Feed Bags"
            mainValue={1260}
            icon="bi-basket"
            subValues={[
              { label: 'Chick Feed', value: 620 },
              { label: 'Layer Feed', value: 470 },
              { label: 'Grower Feed', value: 170 }
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default HeaderCardGroup;