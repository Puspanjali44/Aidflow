import React from "react";
import { Link } from "react-router-dom";
import "./Dashboard.css";

function DonorDashboard() {
  return (
    <div className="dashboard">

      <aside className="sidebar">
        <h2>AidFlow</h2>
        <ul>
          <li><Link to="/dashboard">Dashboard</Link></li>
          <li><Link to="/browse">Browse NGOs</Link></li>
          <li><Link to="/donations">My Donations</Link></li>
          <li><Link to="/badges">Badges</Link></li>
          <li><Link to="/settings">Settings</Link></li>
        </ul>
      </aside>

      <main className="main">
        <h1>Welcome Back, Donor!</h1>

        <div className="stats">
          <div className="card">$1,240<br/>Total Donations</div>
          <div className="card">12<br/>Projects</div>
          <div className="card">480<br/>Impact Points</div>
        </div>

        <h2>Recent Donations</h2>

        <div className="donation">Education for Rural Kids</div>
        <div className="donation">Earthquake Relief Nepal</div>
        <div className="donation">Women Empowerment Project</div>
      </main>

    </div>
  );
}

export default DonorDashboard;