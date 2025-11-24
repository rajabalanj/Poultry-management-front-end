import PageHeader from './Layout/PageHeader';
import TopSellingItems from './Dashboard/TopSellingItems';

const TopSellingItemsReport = () => {
  return (
    <div className="container">
      <PageHeader title="Top Selling Items Report" />
      <div className="card shadow-sm">
        <div className="card-body">
          <TopSellingItems />
        </div>
      </div>
    </div>
  );
};

export default TopSellingItemsReport;
