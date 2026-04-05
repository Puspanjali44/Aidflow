import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./AdminSidebar.css";

const navItems = [
  { to: "/admin",                   end: true,  icon: "📊", label: "Dashboard"        },
  { to: "/admin/ngo-verification",  end: false, icon: "🏢", label: "NGO Verification" },
  { to: "/admin/project-approval",  end: false, icon: "📋", label: "Project Approval" },
  { to: "/admin/analytics",         end: false, icon: "📈", label: "Analytics"        },
  { to: "/admin/settings",          end: false, icon: "⚙️", label: "Settings"         },
];

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
        {/* BRAND */}
        <div className="admin-logo">
          <h2>AidFlow Admin</h2>
          <p>Control Panel</p>
        </div>

        {/* NAV LINKS */}
        <nav className="admin-nav">
          {navItems.map(({ to, end, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `admin-link${isActive ? " active" : ""}`
              }
            >
              <span>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* LOGOUT */}
      <button className="logout-btn" onClick={handleLogout}>
        🚪 Logout
      </button>

    </div>
  );
}

export default AdminSidebar;
