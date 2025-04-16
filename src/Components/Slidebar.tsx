import React, { useState } from "react";
import { Link } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.min.css";

const Slidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button
        className="btn btn-link position-fixed top-0 start-0 m-2 p-2"
        onClick={toggleSidebar}
        style={{ 
          zIndex: 1000,
          marginRight: '20px'
        }}
      >
        <span className="hamburger-icon">&#9776;</span>
      </button>

      <div
        className={`sidebar ${isOpen ? "open" : ""}`}
        style={{
          width: isOpen ? "250px" : "0",
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          backgroundColor: "#f8f9fa",
          transition: "width 0.3s ease",
          zIndex: 999,
          overflowX: "hidden",
          paddingTop: "60px"
        }}
      >
        <div className="p-3">
          <h5 className="mb-4">Menu</h5>
          <ul className="list-unstyled">
            <li className="mb-3">
              <Link to="/" className="text-decoration-none text-dark d-block py-2">
                <i className="bi bi-speedometer2 me-2"></i>
                Dashboard
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {isOpen && (
        <div
          className="overlay"
          onClick={toggleSidebar}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 998,
          }}
        />
      )}
    </>
  );
};

export default Slidebar;
