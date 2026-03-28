import React from "react";

function AdminDashboard() {
  const stats = [
    { title: "Total NGOs", value: 24 },
    { title: "Pending NGO Requests", value: 6 },
    { title: "Pending Projects", value: 8 },
    { title: "Total Donations", value: "Rs. 2,45,000" },
  ];

  const recentActivities = [
    "Helping Hands Nepal submitted verification documents.",
    "Women Care Nepal submitted a new education project.",
    "3 new donations were recorded today.",
    "One project was flagged for missing proof.",
  ];

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="admin-subtitle">
            Manage NGO verification, projects, transparency, and platform activity across AidFlow.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((item, index) => (
          <div className="stat-card" key={index}>
            <h3>{item.title}</h3>
            <p>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="admin-section">
        <h2>Recent Activity</h2>
        <ul className="activity-list">
          {recentActivities.map((activity, index) => (
            <li key={index}>{activity}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default AdminDashboard; 