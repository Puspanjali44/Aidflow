import { NavLink, useNavigate } from "react-router-dom";
import "./NGOSidebar.css";

function NGOSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  const navItems = [
    { path: "/ngo-dashboard", label: "Dashboard" },
    { path: "/ngo-projects", label: "My Projects" },
    { path: "/create-project", label: "Create Project" },
    { path: "/settings", label: "Settings" },
    { path: "/Analytics", label: "Analytics" },
  ];

  return (
    <div className="ngo-sidebar">
      <div className="sidebar-header">
        <div>
          <h2>AidFlow</h2>
          <p className="portal-text">NGO Portal</p>
        </div>
      </div>

      <div className="sidebar-section">
        <p className="section-title">Navigation</p>

        {navItems.map(({ path, label }) => (
          <NavLink key={path} to={path} className="nav-item">
            {label}
          </NavLink>
        ))}
      </div>

      <button className="logout-btn" onClick={handleLogout}>
        Sign Out
      </button>
    </div>
  );
}

export default NGOSidebar;