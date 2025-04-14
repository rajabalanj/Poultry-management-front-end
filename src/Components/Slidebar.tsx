import React, { useState } from "react";
import { Offcanvas } from "react-bootstrap";

const Sidebar: React.FC = () => {
  const [show, setShow] = useState(false);

  const toggleSidebar = () => setShow(!show);

  return (
    <>
      {/* Toggle button visible only on small screens */}
      <button className="btn btn-outline-primary d-md-none m-2" onClick={toggleSidebar}>
        &#9776; Menu
      </button>

      {/* Sidebar for medium and up */}
      <div className="d-none d-md-block bg-light p-3 border-end" style={{ minWidth: "200px" }}>
        <h5>Poultry Management</h5>
        <ul className="nav flex-column">
          <li className="nav-item">
            <button className="btn btn-link text-start w-100">Batch Management</button>
          </li>
        </ul>
      </div>

      {/* Offcanvas for small screens */}
      <Offcanvas show={show} onHide={toggleSidebar} placement="start">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Poultry Management</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <ul className="nav flex-column">
            <li className="nav-item">
              <button className="btn btn-link text-start w-100" onClick={toggleSidebar}>
                Batch Management
              </button>
            </li>
          </ul>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default Sidebar;
