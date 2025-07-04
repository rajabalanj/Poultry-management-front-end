import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { feedApi } from "../services/api";
import { FeedAudit } from "../types/feed_audit";
import PageHeader from "../Components/Layout/PageHeader";

const FeedAuditReport: React.FC = () => {
  const { feed_id } = useParams<{ feed_id: string }>();
  const [audits, setAudits] = useState<FeedAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        if (!feed_id) return;
        const data = await feedApi.getFeedAudit(Number(feed_id));
        setAudits(data);
      } catch (err) {
        setError("Failed to load feed audit report");
      } finally {
        setLoading(false);
      }
    };
    fetchAudit();
  }, [feed_id]);

  return (
    <div className="container-fluid">
      <PageHeader
        title="Feed Audit Report"
        buttonLabel="Back"
        buttonLink={`/feed/${feed_id}/details`}
      />
      {loading && <div>Loading...</div>}
      {error && <div className="text-danger">{error}</div>}
      {!loading && !error && (
        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Change Type</th>
                <th>Change Amount</th>
                <th>Old Weight</th>
                <th>New Weight</th>
                <th>Changed By</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {audits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                audits.map((audit, idx) => (
                  <tr key={idx}>
                    <td>{new Date(audit.timestamp).toLocaleString()}</td>
                    <td>{audit.change_type}</td>
                    <td>{audit.change_amount}</td>
                    <td>{audit.old_weight}</td>
                    <td>{audit.new_weight}</td>
                    <td>{audit.changed_by}</td>
                    <td>{audit.note}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FeedAuditReport;