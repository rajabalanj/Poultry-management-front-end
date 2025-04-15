import React from 'react';
import HeaderCard from './HeaderCard';

const HeaderCardGroup: React.FC = () => {
  return (
    <div className="mb-4">
      <div className="row g-2">
        <div className="col-4">
          <HeaderCard
            title="Total Birds"
            mainValue={27733}
            icon="bi bi-feather"
          />
        </div>
        
        <div className="col-4">
          <HeaderCard
            title="Total Eggs"
            mainValue={15971}
            icon="bi-egg"
            subValues={[
              { label: 'Normal', value: 14316, subValue: 856 },
              { label: 'Jumbo', value: 856, subValue: 799 },
              { label: 'Crack', value: 799, subValue: 66 }
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