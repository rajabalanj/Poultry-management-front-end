import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { batchApi } from '../services/api';
import { Batch } from '../services/api';
import { toast } from 'react-toastify';


const BatchDetails: React.FC = () => {
  const { batchNo } = useParams<{ batchNo: string }>();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBatch, setEditedBatch] = useState<Batch | null>(null);

  useEffect(() => {
    const fetchBatch = async () => {
      try {
        if (batchNo) {
          const response = await batchApi.getBatch(batchNo);
          setBatch(response.data);
          setEditedBatch(response.data);
        }
      } catch (error) {
        console.error('Error fetching batch:', error);
        toast.error('Failed to load batch details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBatch();
  }, [batchNo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (editedBatch) {
      setEditedBatch({
        ...editedBatch,
        [name]: name === 'age' ? value : parseInt(value)
      });
    }
  };

  const handleSave = async () => {
    try {
      if (editedBatch && batchNo) {
        await batchApi.updateBatch(batchNo, editedBatch);
        setBatch(editedBatch);
        setIsEditing(false);
        toast.success('Batch updated successfully!');
      }
    } catch (error) {
      console.error('Error updating batch:', error);
      toast.error('Failed to update batch');
    }
  };

  if (isLoading) {
    return <div className="text-center text-md">Loading...</div>;
  }

  if (!batch || !editedBatch) {
    return <div className="text-center text-md">Batch not found</div>;
  }

  return (
    <div className="container mt-4">
      <div className="row g-3">
        <div className="col-6">
          <div className="card shadow-sm">
            <div className="card-body p-2">
              <h4 className="text-sm mb-2">Batch Details - {batch.batchNo}</h4>
              
              <div className="row g-2">
                <div className="col-12">
                  <label className="form-label text-xs">Shed No.</label>
                  <input
                    type="number"
                    className="form-control form-control-sm text-sm"
                    name="shedNo"
                    value={isEditing ? editedBatch.shedNo : batch.shedNo}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>
                
                <div className="col-12">
                  <label className="form-label text-xs">Age</label>
                  <input
                    type="text"
                    className="form-control form-control-sm text-sm"
                    name="age"
                    value={isEditing ? editedBatch.age : batch.age}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label text-xs">Opening Count</label>
                  <input
                    type="number"
                    className="form-control form-control-sm text-sm"
                    name="openingCount"
                    value={isEditing ? editedBatch.openingCount : batch.openingCount}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label text-xs">Mortality</label>
                  <input
                    type="number"
                    className="form-control form-control-sm text-sm"
                    name="mortality"
                    value={isEditing ? editedBatch.mortality : batch.mortality}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label text-xs">Culls</label>
                  <input
                    type="number"
                    className="form-control form-control-sm text-sm"
                    name="culls"
                    value={isEditing ? editedBatch.culls : batch.culls}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label text-xs">Table Eggs</label>
                  <input
                    type="number"
                    className="form-control form-control-sm text-sm"
                    name="table"
                    value={isEditing ? editedBatch.table : batch.table}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label text-xs">Jumbo Eggs</label>
                  <input
                    type="number"
                    className="form-control form-control-sm text-sm"
                    name="jumbo"
                    value={isEditing ? editedBatch.jumbo : batch.jumbo}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label text-xs">CR</label>
                  <input
                    type="number"
                    className="form-control form-control-sm text-sm"
                    name="cr"
                    value={isEditing ? editedBatch.cr : batch.cr}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="mt-3 d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm text-xs"
                  onClick={() => navigate('/')}
                >
                  Back
                </button>
                {!isEditing ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm text-xs"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm text-xs"
                      onClick={() => {
                        setIsEditing(false);
                        setEditedBatch(batch);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm text-xs"
                      onClick={handleSave}
                    >
                      Save
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchDetails; 