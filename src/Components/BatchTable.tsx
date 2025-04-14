import React from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
interface Batch {
  batchNo: string;
  shedNo: number;
  age: string;
  openingCount: number;
  mortality: number;
  culls: number;
  closingCount: number;
  table: number;
  jumbo: number;
  cr: number;
  totalEggs: number;
  date: string;
}


const mockData: Batch[] = [
    {
      batchNo: "B-0001",
      shedNo: 1,
      age: "Week 1, Day 1",
      openingCount: 18652,
      mortality: 2,
      culls: 3,
      closingCount: 18647,
      table: 500,
      jumbo: 1,
      cr: 30,
      totalEggs: 531,
      date: "3/17/2025",
    },
    {
      batchNo: "B-0002",
      shedNo: 2,
      age: "Week 50, Day 6",
      openingCount: 22356,
      mortality: 0,
      culls: 0,
      closingCount: 22356,
      table: 0,
      jumbo: 0,
      cr: 0,
      totalEggs: 0,
      date: "3/17/2025",
    },
  ];


const BatchTable: React.FC = () => {
  return (
    <div className="table-responsive">
      <table className="table table-striped table-bordered align-middle">
        <thead className="table-light">
          <tr>
            <th>Batch No.</th>
            <th>Shed No.</th>
            <th>Age</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {mockData.map((batch) => (
            <tr key={batch.batchNo}>
              <td>{batch.batchNo}</td>
              <td>{batch.shedNo}</td>
              <td>{batch.age}</td>
              <td><a href="/batch/B-0001/details" title="View Details" aria-label="View Details for Batch B-0001">
              <i className="bi bi-eye"></i>
        </a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BatchTable;
