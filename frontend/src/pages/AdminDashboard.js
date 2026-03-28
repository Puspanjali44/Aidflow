import React, { useEffect, useState, useMemo } from "react";
import "./AdminDashboard.css";

const API_BASE = "http://localhost:5000";

function formatCurrency(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatTimeAgo(dateLike) {
  if (!dateLike) return "just now";
  const now = new Date();
  const date = new Date(dateLike);
  const diffMs = now - date;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (hours < 1) return "just now";
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "NG";
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState({
    totalNGOs: 0,
    pendingNGORequests: 0,
    pendingProjects: 0,
    totalDonations: 0,
  });

  const [ngos, setNgos] = useState([]);
  const [projects, setProjects] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ngoFilter, setNgoFilter] = useState("all");
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setErrors([]);

    const token = localStorage.getItem("token");
    if (!token) {
      setErrors(["Please login as Admin"]);
      setLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    try {
      // Fetch only the data needed for this dashboard
      const [ngosRes, projectsRes, activitiesRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/ngos`, { headers }),
        fetch(`${API_BASE}/api/projects/admin/all?status=under_review`, { headers }),
        fetch(`${API_BASE}/api/admin/recent-activity`, { headers }), // optional - can return []
      ]);

      const ngoData = ngosRes.ok ? await ngosRes.json() : [];
      const projectData = projectsRes.ok ? await projectsRes.json() : [];
      const activityData = activitiesRes.ok ? await activitiesRes.json() : [];

      // Process NGOs
      const processedNgos = Array.isArray(ngoData) ? ngoData.map((ngo) => ({
        id: ngo._id,
        name: ngo.organizationName || ngo.name || "Unnamed NGO",
        email: ngo.email || ngo.contactEmail || "No email",
        status: (ngo.verificationStatus || "Pending").toLowerCase(),
        initials: getInitials(ngo.organizationName || ngo.name),
      })) : [];

      // Process Projects (only under_review for Project Approval section)
      const processedProjects = Array.isArray(projectData) ? projectData.map((p) => ({
        id: p._id,
        title: p.title || "Untitled Project",
        ngoName: p.ngo?.name || p.ngo?.organizationName || "Unknown NGO",
        goal: formatCurrency(p.goalAmount),
        status: "Pending",
      })) : [];

      // Process Recent Activity
      const processedActivities = Array.isArray(activityData) ? activityData.map((item, i) => ({
        id: item._id || i,
        message: item.message || item.description || "New activity recorded",
        time: formatTimeAgo(item.createdAt),
      })) : [];

      setNgos(processedNgos);
      setProjects(processedProjects);
      setRecentActivities(processedActivities);

      // Calculate summary from fetched data
      setSummary({
        totalNGOs: processedNgos.length,
        pendingNGORequests: processedNgos.filter((n) => n.status === "pending").length,
        pendingProjects: processedProjects.length,
        totalDonations: 0, // You can later add a donations endpoint
      });

    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setErrors(["Failed to load data from backend. Check if server is running and you are logged in as Admin."]);
    } finally {
      setLoading(false);
    }
  };

  const filteredNgos = useMemo(() => {
    if (ngoFilter === "all") return ngos;
    return ngos.filter((ngo) => ngo.status === ngoFilter);
  }, [ngos, ngoFilter]);

  if (loading) return <div className="admin-page"><h1>Loading Admin Dashboard...</h1></div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p className="admin-subtitle">
          Manage NGO verification, projects, transparency, and platform activity across AidFlow.
        </p>
      </div>

      {errors.length > 0 && (
        <div className="error-box">
          <strong>Backend Issues:</strong>
          <ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}

      {/* Stats Cards - Matching Screenshot */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <h3>Total NGOs</h3>
          <p className="stat-value">{summary.totalNGOs}</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔍</div>
          <h3>Pending NGO Requests</h3>
          <p className="stat-value">{summary.pendingNGORequests}</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <h3>Pending Projects</h3>
          <p className="stat-value">{summary.pendingProjects}</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <h3>Total Donations</h3>
          <p className="stat-value">{formatCurrency(summary.totalDonations)}</p>
        </div>
      </div>

      <div className="main-content-grid">
        {/* NGO Verification - Exact match to screenshot */}
        <div className="admin-section">
          <div className="section-header">
            <h2>NGO Verification</h2>
            <div className="tabs">
              <button className={`tab ${ngoFilter === "all" ? "active" : ""}`} onClick={() => setNgoFilter("all")}>All</button>
              <button className={`tab ${ngoFilter === "pending" ? "active" : ""}`} onClick={() => setNgoFilter("pending")}>Pending</button>
              <button className={`tab ${ngoFilter === "approved" ? "active" : ""}`} onClick={() => setNgoFilter("approved")}>Approved</button>
              <button className={`tab ${ngoFilter === "rejected" ? "active" : ""}`} onClick={() => setNgoFilter("rejected")}>Rejected</button>
            </div>
          </div>

          {filteredNgos.length === 0 ? (
            <p className="empty-state">No NGOs to verify yet.</p>
          ) : (
            <div className="ngo-list">
              {filteredNgos.map((ngo) => (
                <div key={ngo.id} className="ngo-item">
                  <div className="ngo-info">
                    <div className="ngo-initials">{ngo.initials}</div>
                    <div>
                      <div className="ngo-name">{ngo.name}</div>
                      <div className="ngo-email">{ngo.email}</div>
                    </div>
                  </div>
                  <div className="ngo-status">
                    <span className={`status-badge ${ngo.status}`}>
                      {ngo.status.charAt(0).toUpperCase() + ngo.status.slice(1)}
                    </span>
                    {ngo.status === "pending" && <button className="review-btn">Review</button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="admin-section recent-activity">
          <h2>Recent Activity</h2>
          {recentActivities.length === 0 ? (
            <p className="empty-state">No recent activity to show.</p>
          ) : (
            <div className="activity-list">
              {recentActivities.map((act) => (
                <div key={act.id} className="activity-item">
                  {act.message} <span className="time">{act.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Project Approval Table */}
        <div className="admin-section table-card">
          <h2>Project Approval</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>NGO</th>
                <th>Goal</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr><td colSpan="5" className="empty-table-message">No pending projects at the moment.</td></tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.id}>
                    <td>{project.title}</td>
                    <td>{project.ngoName}</td>
                    <td>{project.goal}</td>
                    <td><span className="status-badge pending">Pending</span></td>
                    <td className="action-buttons">
                      <button className="approve-btn">Approve</button>
                      <button className="reject-btn">Reject</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Platform Overview + Quick Actions */}
        <div className="sidebar-column">
          <div className="admin-section platform-overview">
            <h2>Platform Overview</h2>
            <div className="overview-item"><span>Verified NGOs</span><strong>{summary.totalNGOs}</strong></div>
            <div className="overview-item"><span>Active Projects</span><strong>0</strong></div>
            <div className="overview-item"><span>This Month's Donations</span><strong>Rs. 0</strong></div>
            <div className="overview-item"><span>Platform Uptime</span><strong>99.9%</strong></div>
          </div>

          <div className="admin-section quick-actions">
            <h2>Quick Actions</h2>
            <button className="action-btn">Review Pending NGOs</button>
            <button className="action-btn">Approve Projects</button>
            <button className="action-btn">View Reports</button>
          </div>
        </div>
      </div>
    </div>
  );
}