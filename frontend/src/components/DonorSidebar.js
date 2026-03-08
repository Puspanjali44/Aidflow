import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../components/DonorSidebar.css"; // reuse same CSS

function DonorSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  return (
    <div className="ngo-sidebar">
      <h2 className="sidebar-logo">AidFlow</h2>

      <nav className="sidebar-nav">
        <Link
          to="/donor-dashboard"
          className={location.pathname === "/donor-dashboard" ? "active-link" : ""}
        >
          Dashboard
        </Link>

        <Link
          to="/browse"
          className={location.pathname === "/browse" ? "active-link" : ""}
        >
          Browse NGOs
        </Link>

        <Link
          to="/my-donations"
          className={location.pathname === "/my-donations" ? "active-link" : ""}
        >
          My Donations
        </Link>
      </nav>

      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default DonorSidebar;