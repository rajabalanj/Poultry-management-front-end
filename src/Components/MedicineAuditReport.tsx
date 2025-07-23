import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { medicineApi } from "../services/api";
import { MedicineAudit } from "../types/medicine_audit";
import PageHeader from "./Layout/PageHeader";

const MedicineAuditReport: React.FC = () => {
  const { medicine_id } = useParams<{ medicine_id: string }>();
  const [audits, setAudits] = useState<MedicineAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        if (!medicine_id) return;
        const data = await medicineApi.getMedicineAudit(Number(medicine_id));
        setAudits(data);
      } catch (err) {
        setError("Failed to load medicine audit report");
      } finally {
        setLoading(false);
      }
    };
    fetchAudit();
  }, [medicine_id]);

  return (
    <>
    <PageHeader
        title="Medicine Audit Report"
        buttonLabel="Back"
        buttonLink={`/medicine/${medicine_id}/details`}
      />
    <div className="container-fluid">
      {loading && <div>Loading...</div>}
      {error && <div className="text-danger">{error}</div>}
      {!loading && !error && (
        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead>
              <tr>
                <th>Timestamp</th>
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
    </>
  );
};

export default MedicineAuditReport;