import { NavLink, useNavigate } from "react-router-dom";
import "./NGOSidebar.css";

function NGOSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  return (
    <div className="ngo-sidebar">
      <div className="sidebar-header">
        
        <div>
          <h2>AidFlow</h2>
          <p className="portal-text">NGO Portal</p>
        </div>
      </div>

      <div className="sidebar-section">
        <p className="section-title">NAVIGATION</p>

        <NavLink to="/ngo-dashboard" className="nav-item">
          Dashboard
        </NavLink>

        <NavLink to="/ngo-projects" className="nav-item">
          My Projects
        </NavLink>

        <NavLink to="/create-project" className="nav-item">
          Create Project
        </NavLink>

        <NavLink to="/settings" className="nav-item">
          Settings
        </NavLink>

        <NavLink to="/Analytics" className="nav-item">
          Analytics
        </NavLink>
      </div>

      

      <button className="logout-btn" onClick={handleLogout}>
        Sign Out
      </button>
    </div>
  );
}

export default NGOSidebar;