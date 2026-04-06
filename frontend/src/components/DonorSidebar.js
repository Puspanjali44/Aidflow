import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./DonorSidebar.css";

const navItems = [
  { path: "/donor-dashboard",   icon: <HomeIcon />,   label: "Dashboard"        },
  { path: "/browse",            icon: <SearchIcon />, label: "Browse NGOs"      },
  { path: "/my-donations",      icon: <HeartIcon />,  label: "My Donations"     },
  { path: "/my-subscriptions",  icon: <SubIcon />,    label: "My Subscriptions" },
  { path: "/badges",            icon: <BadgeIcon />,  label: "Badges"           },
];

function DonorSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  return (
    <div className="ds-sidebar">

      {/* BRAND */}
      <div className="ds-brand">
        <div className="ds-logo-box">
          <LeafIcon />
        </div>
        <div>
          <h2 className="ds-brand-name">AidFlow</h2>
          <p className="ds-portal-label">Donor Portal</p>
        </div>
      </div>

      {/* NAV */}
      <div className="ds-nav-section">
        <p className="ds-nav-label">Navigation</p>
        <nav className="ds-nav">
          {navItems.map(({ path, icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `ds-nav-item${isActive ? " active" : ""}`
              }
            >
              <span className="ds-nav-icon">{icon}</span>
              <span className="ds-nav-label-text">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* SIGN OUT */}
      <div className="ds-footer">
        <button className="ds-signout" onClick={handleLogout}>
          <SignOutIcon />
          <span>Sign Out</span>
        </button>
      </div>

    </div>
  );
}

function LeafIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 22c1.25-1.25 2.5-2.5 3.75-3.75"/>
      <path d="M20 2c0 0-8 2-12 8s-2 12-2 12 8-2 12-8 2-12 2-12z"/>
    </svg>
  );
}
function HomeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}
function SubIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    </svg>
  );
}
function BadgeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6"/>
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
    </svg>
  );
}
function SignOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

export default DonorSidebar;
