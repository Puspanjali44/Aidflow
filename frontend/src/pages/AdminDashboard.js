import React, { useEffect, useState } from "react";
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

export default function AdminDashboard() {
  const [summary, setSummary] = useState({
    totalNGOs: 0,
    pendingNGORequests: 0,
    pendingProjects: 0,
    totalDonations: 0,
    totalDonationAmount: 0,
    approvedNGOs: 0,
    flaggedNGOs: 0,
    activeProjects: 0,
    flaggedProjects: 0,
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [fraudOverview, setFraudOverview] = useState({
    counts: {
      flaggedNgos: 0,
      flaggedProjects: 0,
      highRiskNgos: 0,
      highRiskProjects: 0,
    },
    flaggedNgos: [],
    flaggedProjects: [],
    highRiskNgos: [],
    highRiskProjects: [],
  });

  const [loading, setLoading] = useState(true);
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

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    try {
      const [summaryRes, activityRes, fraudRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/dashboard-summary`, { headers }),
        fetch(`${API_BASE}/api/admin/recent-activity`, { headers }),
        fetch(`${API_BASE}/api/admin/fraud-overview`, { headers }),
      ]);

      const summaryData = summaryRes.ok ? await summaryRes.json() : null;
      const activityData = activityRes.ok ? await activityRes.json() : [];
      const fraudData = fraudRes.ok ? await fraudRes.json() : null;

      if (!summaryRes.ok) {
        throw new Error("Failed to load dashboard summary");
      }

      setSummary({
        totalNGOs: summaryData.totalNGOs || 0,
        pendingNGORequests: summaryData.pendingNGORequests || 0,
        pendingProjects: summaryData.pendingProjects || 0,
        totalDonations: summaryData.totalDonations || 0,
        totalDonationAmount: summaryData.totalDonationAmount || 0,
        approvedNGOs: summaryData.approvedNGOs || 0,
        flaggedNGOs: summaryData.flaggedNGOs || 0,
        activeProjects: summaryData.activeProjects || 0,
        flaggedProjects: summaryData.flaggedProjects || 0,
      });

      setRecentActivities(Array.isArray(activityData) ? activityData : []);

      setFraudOverview(
        fraudData || {
          counts: {
            flaggedNgos: 0,
            flaggedProjects: 0,
            highRiskNgos: 0,
            highRiskProjects: 0,
          },
          flaggedNgos: [],
          flaggedProjects: [],
          highRiskNgos: [],
          highRiskProjects: [],
        }
      );
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setErrors([
        "Failed to load admin dashboard. Check backend routes, token, and database connection.",
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <h1>Loading Admin Dashboard...</h1>
      </div>
    );
  }

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
          <ul>
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

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
          <p className="stat-value">{formatCurrency(summary.totalDonationAmount)}</p>
        </div>
      </div>

      <div className="main-content-grid">
        <div className="admin-section">
          <h2>Recent Activity</h2>
          {recentActivities.length === 0 ? (
            <p className="empty-state">No recent activity to show.</p>
          ) : (
            <div className="activity-list">
              {recentActivities.map((act, index) => (
                <div key={act._id || index} className="activity-item">
                  <div>{act.message || "Activity recorded"}</div>
                  <span className="time">{formatTimeAgo(act.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="admin-section">
          <h2>Fraud Overview</h2>
          <div className="overview-item">
            <span>Flagged NGOs</span>
            <strong>{fraudOverview.counts.flaggedNgos}</strong>
          </div>
          <div className="overview-item">
            <span>Flagged Projects</span>
            <strong>{fraudOverview.counts.flaggedProjects}</strong>
          </div>
          <div className="overview-item">
            <span>High Risk NGOs</span>
            <strong>{fraudOverview.counts.highRiskNgos}</strong>
          </div>
          <div className="overview-item">
            <span>High Risk Projects</span>
            <strong>{fraudOverview.counts.highRiskProjects}</strong>
          </div>
        </div>

        <div className="admin-section table-card">
          <h2>Platform Overview</h2>
          <div className="overview-item">
            <span>Approved NGOs</span>
            <strong>{summary.approvedNGOs}</strong>
          </div>
          <div className="overview-item">
            <span>Active Projects</span>
            <strong>{summary.activeProjects}</strong>
          </div>
          <div className="overview-item">
            <span>Flagged NGOs</span>
            <strong>{summary.flaggedNGOs}</strong>
          </div>
          <div className="overview-item">
            <span>Flagged Projects</span>
            <strong>{summary.flaggedProjects}</strong>
          </div>
          <div className="overview-item">
            <span>Total Donation Records</span>
            <strong>{summary.totalDonations}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}