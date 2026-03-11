import React, { useEffect, useState } from "react";
import axios from "axios";
import DonorSidebar from "../components/DonorSidebar";
import "./MyDonation.css";

function MyDonations() {
  const [donations, setDonations] = useState([]);

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get("http://localhost:5000/api/donations/my", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("DONATIONS:", res.data);
      setDonations(res.data);
    } catch (error) {
      console.error("Error fetching donations", error);
    }
  };

  const totalDonated = donations.reduce(
    (sum, donation) => sum + donation.amount,
    0
  );

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "?");

  const getAvatarColor = (name) => {
    const colors = ["#1e5631", "#d4a843", "#2d6a4f", "#8B5E3C", "#3B82F6"];
    if (!name) return colors[0];
    return colors[name.charCodeAt(0) % colors.length];
  };

  // Simple month grouping for chart
  const monthTotals = {};
  donations.forEach((d) => {
    const date = new Date(d.createdAt);
    const key = date.toLocaleString("default", { month: "short" });
    monthTotals[key] = (monthTotals[key] || 0) + d.amount;
  });
  const chartMonths = Object.keys(monthTotals);
  const chartValues = Object.values(monthTotals);
  const maxVal = Math.max(...chartValues, 1);

  return (
    <div className="mydon-wrapper">
      <DonorSidebar />

      <div className="mydon-content">
        {/* Header */}
        <h1 className="mydon-title">My Donations</h1>
        <p className="mydon-subtitle">View and manage all your contributions.</p>

        {/* 3 Summary Cards */}
        <div className="mydon-stats">
          <div className="mydon-stat green-stat">
            <div className="mydon-stat-label">TOTAL DONATED</div>
            <div className="mydon-stat-value white">
              NPR {totalDonated.toLocaleString()}
            </div>
            <div className="mydon-stat-sub white-sub">
              {donations.length} donation{donations.length !== 1 ? "s" : ""} total
            </div>
          </div>

          <div className="mydon-stat">
            <div className="mydon-stat-label">THIS MONTH</div>
            <div className="mydon-stat-value">
              NPR{" "}
              {donations
                .filter((d) => {
                  const now = new Date();
                  const created = new Date(d.createdAt);
                  return (
                    created.getMonth() === now.getMonth() &&
                    created.getFullYear() === now.getFullYear()
                  );
                })
                .reduce((s, d) => s + d.amount, 0)
                .toLocaleString()}
            </div>
            <div className="mydon-stat-sub">↑ from last month</div>
          </div>

          <div className="mydon-stat">
            <div className="mydon-stat-label">RECURRING</div>
            <div className="mydon-stat-value">0</div>
            <div className="mydon-stat-sub">Active recurring donations</div>
          </div>
        </div>

        {/* Monthly Giving Chart */}
        {chartMonths.length > 0 && (
          <div className="mydon-chart-card">
            <h3>Monthly Giving</h3>
            <div className="bar-chart">
              {chartMonths.map((month, i) => (
                <div className="bar-col" key={month}>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ height: `${(chartValues[i] / maxVal) * 100}%` }}
                    />
                  </div>
                  <span className="bar-label">{month}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Donations List */}
        <div className="mydon-list-section">
          <div className="mydon-list-header">
            <h3>All Donations</h3>
          </div>

          {donations.length === 0 ? (
            <div className="mydon-empty">
              <div className="mydon-empty-icon">🤝</div>
              <p>No donations yet.</p>
            </div>
          ) : (
            donations.map((donation, index) => (
              <div
                key={donation._id}
                className="mydon-row"
                style={{
                  animation: "slideUp 0.4s ease both",
                  animationDelay: `${index * 0.05}s`,
                }}
              >
                <div
                  className="mydon-avatar"
                  style={{
                    background: getAvatarColor(
                      donation.project?.ngo?.organizationName
                    ),
                  }}
                >
                  {getInitial(donation.project?.ngo?.organizationName)}
                </div>

                <div className="mydon-info">
                  <div className="mydon-info-title">
                    {donation.project?.title || "(No project)"}
                  </div>
                  <div className="mydon-info-ngo">
                    NGO: {donation.project?.ngo?.organizationName || "-"}
                  </div>
                </div>

                <div className="mydon-right">
                  <div className="mydon-amount">
                    NPR {donation.amount?.toLocaleString()}
                  </div>
                  <div className="mydon-date-status">
                    <span className="mydon-date">
                      {new Date(donation.createdAt).toLocaleDateString()}
                    </span>
                    <span className="mydon-status completed">completed</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default MyDonations;