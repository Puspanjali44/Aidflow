import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

function AdminSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="admin-sidebar">
      <div>
        <div className="admin-logo">
          <h2>AidFlow Admin</h2>
          <p>Control Panel</p>
        </div>

        <nav className="admin-nav">
          <NavLink to="/admin" end className="admin-link">
            Dashboard
          </NavLink>

          <NavLink to="/admin/ngo-verification" className="admin-link">
            NGO Verification
          </NavLink>

          <NavLink to="/admin/project-approval" className="admin-link">
            Project Approval
          </NavLink>

          <NavLink to="/admin/analytics" className="admin-link">
            Analytics
          </NavLink>

          <NavLink to="/admin/settings" className="admin-link">
            Settings
          </NavLink>
        </nav>
      </div>

      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default AdminSidebar;