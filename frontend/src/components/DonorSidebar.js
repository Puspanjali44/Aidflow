import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./DonorSidebar.css";

function DonorSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  const navItems = [
    { path: "/donor-dashboard", label: "Dashboard"},
    { path: "/browse", label: "Browse NGOs" },
    { path: "/my-donations", label: "My Donations" },
    { path: "/badges", label: "Badges"},
  ];

  return (
    <div className="ngo-sidebar">
      <h2 className="sidebar-logo">AidFlow</h2>

      <p className="section-title">Navigation</p>

      <nav className="sidebar-nav">
        {navItems.map(({ path, label, icon }) => (
          <Link
            key={path}
            to={path}
            className={location.pathname === path ? "active-link" : ""}
          >
            <span style={{ fontSize: 15, lineHeight: 1 }}>{icon}</span>
            {label}
          </Link>
        ))}
      </nav>

      <button className="logout-btn" onClick={handleLogout}>
        Sign Out
      </button>
    </div>
  );
}

export default DonorSidebar;
