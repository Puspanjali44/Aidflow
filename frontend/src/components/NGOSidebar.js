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
      <h2 className="sidebar-logo">AidFlow</h2>

      <div className="sidebar-nav">
        <NavLink to="/ngo-dashboard">Dashboard</NavLink>
        <NavLink to="/ngo-projects">My Projects</NavLink>
        <NavLink to="/create-project">Create Project</NavLink>
        <NavLink to="/settings">Settings</NavLink>
      </div>

      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default NGOSidebar;