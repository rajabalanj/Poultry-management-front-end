import { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import PageHeader from './Layout/PageHeader';
import TopSellingItems from './Dashboard/TopSellingItems';
import { toPng } from 'html-to-image';

const TopSellingItemsReport = () => {
  const [isSharing, setIsSharing] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    if (!reportRef.current) {
      toast.error("Table element not found.");
      return;
    }

    if (!navigator.share) {
      toast.error("Web Share API is not supported in your browser.");
      return;
    }

    const reportNode = reportRef.current;
    setIsSharing(true);

    const originalReportStyle = {
      width: reportNode.style.width,
      minWidth: reportNode.style.minWidth,
      whiteSpace: reportNode.style.whiteSpace,
    };

    try {
      reportNode.style.width = 'auto';
      reportNode.style.minWidth = '1200px';
      reportNode.style.whiteSpace = 'nowrap';

      const dataUrl = await toPng(reportNode, {
        backgroundColor: '#ffffff',
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `top-selling-items-report.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Top Selling Items Report',
          text: `Top Selling Items Report.`,
          files: [file],
        });
        toast.success("Report shared successfully!");
      } else {
        toast.error("Sharing files is not supported on this device.");
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Sharing failed', error);
        toast.error(`Failed to share report: ${error.message}`);
      }
    } finally {
      reportNode.style.width = originalReportStyle.width;
      reportNode.style.minWidth = originalReportStyle.minWidth;
      reportNode.style.whiteSpace = originalReportStyle.whiteSpace;
      setIsSharing(false);
    }
  };

  return (
    <div className="container">
      <PageHeader title="Top Selling Items Report" />
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Top Selling Items</h5>
            <button
              className="btn btn-secondary"
              onClick={handleShare}
              disabled={isSharing}
            >
              {isSharing ? 'Generating...' : 'Share as Image'}
            </button>
          </div>
          <div ref={reportRef}>
            <TopSellingItems />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopSellingItemsReport;
