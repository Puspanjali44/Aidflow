import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./AdminDashboard.css";

const API_BASE = "http://localhost:5000";

function formatCurrency(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function riskClass(score) {
  const s = Number(score || 0);
  if (s >= 70) return "risk-high";
  if (s >= 30) return "risk-medium";
  return "risk-low";
}

function statusClass(status) {
  const map = {
    approved: "badge-approved",
    active: "badge-approved",
    pending: "badge-pending",
    under_review: "badge-pending",
    rejected: "badge-rejected",
    paused: "badge-paused",
    completed: "badge-completed",
    draft: "badge-draft",
  };
  return map[status] || "badge-default";
}

function SimpleBarChart({ data, valueKey, labelKey }) {
  const maxValue = Math.max(...data.map((item) => Number(item[valueKey] || 0)), 1);

  if (!data.length) return <p className="empty-state">No data available.</p>;

  return (
    <div className="simple-bar-chart">
      {data.map((item, index) => {
        const value = Number(item[valueKey] || 0);
        const height = `${(value / maxValue) * 100}%`;

        return (
          <div className="bar-group" key={index}>
            <div className="bar-value">{value.toLocaleString("en-IN")}</div>
            <div className="bar-track">
              <div className="bar-fill" style={{ height }} />
            </div>
            <div className="bar-label">{item[labelKey]}</div>
          </div>
        );
      })}
    </div>
  );
}

function SmallStatusChart({ title, items }) {
  return (
    <div className="admin-section table-card">
      <h2>{title}</h2>
      <div className="mini-chart-list">
        {items.map((item, i) => (
          <div key={i} className="overview-item">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function FraudList({ title, items, isProject = false }) {
  return (
    <div className="admin-section table-card">
      <h2>{title}</h2>
      {items.length ? (
        items.map((item) => (
          <div key={item._id} className="fraud-row">
            <div>
              <strong>
                {isProject ? item.title : item.organizationName || item.name}
              </strong>
              <p>
                {isProject
                  ? `${item.ngo?.organizationName || item.ngo?.name || "Unknown NGO"} • ${
                      item.flagReason || "Risk detected"
                    }`
                  : item.flagReason || "Risk detected"}
              </p>
            </div>

            <div className="fraud-actions">
              <span className={`risk-badge ${riskClass(item.fraudScore)}`}>
                {item.fraudScore || 0}
              </span>
              {isProject && (
                <Link className="view-link" to={`/projects/${item._id}`}>
                  Open
                </Link>
              )}
            </div>
          </div>
        ))
      ) : (
        <p className="empty-state">No data available.</p>
      )}
    </div>
  );
}

function TopSummaryCard({ title, value, sub }) {
  return (
    <div className="stat-card">
      <h3>{title}</h3>
      <p className="stat-value">{value}</p>
      <p className="growth neutral">{sub}</p>
    </div>
  );
}

function AdminAnalytics() {
  const [analytics, setAnalytics] = useState({
    monthlyDonationTrends: [],
    ngoFundingBreakdown: [],
    projectFundingBreakdown: [],
    topNgos: [],
    topProjects: [],
    ngoVerificationStats: {
      approved: 0,
      pending: 0,
      rejected: 0,
    },
    projectStatusStats: {
      draft: 0,
      under_review: 0,
      active: 0,
      paused: 0,
      completed: 0,
      rejected: 0,
    },
    fraudHighlights: {
      flaggedNgos: [],
      flaggedProjects: [],
      highRiskNgos: [],
      highRiskProjects: [],
    },
    recentActivity: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login as admin.");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/api/admin/analytics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to load admin analytics");
      }

      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Admin analytics error:", err);
      setError("Failed to load admin analytics.");
    } finally {
      setLoading(false);
    }
  };

  const totalNgoMoney = analytics.ngoFundingBreakdown.reduce(
    (sum, ngo) => sum + Number(ngo.totalAmount || 0),
    0
  );

  const totalProjectMoney = analytics.projectFundingBreakdown.reduce(
    (sum, project) => sum + Number(project.totalAmount || 0),
    0
  );

  const totalDonationRecords = analytics.ngoFundingBreakdown.reduce(
    (sum, ngo) => sum + Number(ngo.totalDonations || 0),
    0
  );

  const totalNGOs = analytics.ngoFundingBreakdown.length;
  const totalProjects = analytics.projectFundingBreakdown.length;

  if (loading) {
    return (
      <div className="admin-page">
        <h1>Loading Admin Analytics...</h1>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h1>Admin Analytics</h1>
      <p className="admin-subtitle">
        View platform trends, NGO activity, donation insights, and project performance.
      </p>

      {error && (
        <div className="error-box">
          <strong>{error}</strong>
        </div>
      )}

      <div className="stats-grid">
        <TopSummaryCard
          title="Total NGOs"
          value={totalNGOs}
          sub="All NGOs in analytics"
        />
        <TopSummaryCard
          title="Total Projects"
          value={totalProjects}
          sub="All projects in analytics"
        />
        <TopSummaryCard
          title="Total Donation Amount"
          value={formatCurrency(totalProjectMoney)}
          sub="All successful donations"
        />
        <TopSummaryCard
          title="Donation Records"
          value={totalDonationRecords}
          sub="Successful donation entries"
        />
      </div>

      <div className="admin-section table-card">
        <h2>Monthly Donation Trends</h2>
        <SimpleBarChart
          data={analytics.monthlyDonationTrends}
          valueKey="totalAmount"
          labelKey="month"
        />
      </div>

      <div className="two-col-grid">
        <SmallStatusChart
          title="NGO Approval / Rejection"
          items={[
            { label: "Approved", value: analytics.ngoVerificationStats.approved },
            { label: "Pending", value: analytics.ngoVerificationStats.pending },
            { label: "Rejected", value: analytics.ngoVerificationStats.rejected },
          ]}
        />

        <SmallStatusChart
          title="Project Approval / Rejection"
          items={[
            { label: "Draft", value: analytics.projectStatusStats.draft },
            { label: "Under Review", value: analytics.projectStatusStats.under_review },
            { label: "Active", value: analytics.projectStatusStats.active },
            { label: "Paused", value: analytics.projectStatusStats.paused },
            { label: "Completed", value: analytics.projectStatusStats.completed },
            { label: "Rejected", value: analytics.projectStatusStats.rejected },
          ]}
        />
      </div>

      <div className="two-col-grid">
        <div className="admin-section table-card">
          <h2>Top NGOs</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>NGO</th>
                <th>Raised</th>
                <th>Donations</th>
                <th>Fraud</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topNgos.length ? (
                analytics.topNgos.map((ngo) => (
                  <tr key={ngo._id}>
                    <td>{ngo.ngoName}</td>
                    <td>{formatCurrency(ngo.totalAmount)}</td>
                    <td>{ngo.totalDonations}</td>
                    <td>
                      <span className={`risk-badge ${riskClass(ngo.fraudScore)}`}>
                        {ngo.fraudScore || 0}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="center">
                    No NGO data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-section table-card">
          <h2>Top Projects</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>NGO</th>
                <th>Raised</th>
                <th>Open</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topProjects.length ? (
                analytics.topProjects.map((project) => (
                  <tr key={project._id}>
                    <td>{project.projectTitle}</td>
                    <td>{project.ngoName}</td>
                    <td>{formatCurrency(project.totalAmount)}</td>
                    <td>
                      <Link className="view-link" to={`/projects/${project._id}`}>
                        Open
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="center">
                    No project data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-section table-card">
        <h2>Funding Breakdown by NGO</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>NGO</th>
              <th>Total Raised</th>
              <th>Donation Records</th>
              <th>Projects Funded</th>
              <th>Status</th>
              <th>Fraud</th>
            </tr>
          </thead>
          <tbody>
            {analytics.ngoFundingBreakdown.length ? (
              analytics.ngoFundingBreakdown.map((ngo) => (
                <tr key={ngo._id}>
                  <td>{ngo.ngoName}</td>
                  <td>{formatCurrency(ngo.totalAmount)}</td>
                  <td>{ngo.totalDonations}</td>
                  <td>{ngo.totalProjectsFunded}</td>
                  <td>
                    <span className={`status-badge ${statusClass(ngo.verificationStatus)}`}>
                      {ngo.verificationStatus}
                    </span>
                  </td>
                  <td>
                    <span className={`risk-badge ${riskClass(ngo.fraudScore)}`}>
                      {ngo.flagged ? `Flagged • ${ngo.fraudScore || 0}` : ngo.fraudScore || 0}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="center">
                  No NGO funding data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-section table-card">
        <h2>Funding Breakdown by Project</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>NGO</th>
              <th>Total Raised</th>
              <th>Goal</th>
              <th>Status</th>
              <th>Fraud</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {analytics.projectFundingBreakdown.length ? (
              analytics.projectFundingBreakdown.map((project) => (
                <tr key={project._id}>
                  <td>{project.projectTitle}</td>
                  <td>{project.ngoName}</td>
                  <td>{formatCurrency(project.totalAmount)}</td>
                  <td>{formatCurrency(project.goalAmount)}</td>
                  <td>
                    <span className={`status-badge ${statusClass(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  <td>
                    <span className={`risk-badge ${riskClass(project.fraudScore)}`}>
                      {project.flagged
                        ? `Flagged • ${project.fraudScore || 0}`
                        : project.fraudScore || 0}
                    </span>
                  </td>
                  <td>
                    <Link className="view-link" to={`/projects/${project._id}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="center">
                  No project funding data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="two-col-grid">
        <FraudList
          title="Flagged NGOs"
          items={analytics.fraudHighlights.flaggedNgos}
        />
        <FraudList
          title="Flagged Projects"
          items={analytics.fraudHighlights.flaggedProjects}
          isProject
        />
      </div>

      <div className="two-col-grid">
        <FraudList
          title="High Risk NGOs"
          items={analytics.fraudHighlights.highRiskNgos}
        />
        <FraudList
          title="High Risk Projects"
          items={analytics.fraudHighlights.highRiskProjects}
          isProject
        />
      </div>
    </div>
  );
}

export default AdminAnalytics;