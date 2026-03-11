import React, { useEffect, useState } from "react";
import DonorSidebar from "./components/DonorSidebar";
import "./Dashboard.css";
import axios from "axios";

function DonorDashboard() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setDonations([]);
        setLoading(false);
        return;
      }

      const res = await axios.get("http://localhost:5000/api/donations/my", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDonations(res.data || []);
    } catch (error) {
      console.error("Error fetching donations", error);
      setDonations([]);
    } finally {
      setLoading(false);
    }
  };

  const totalDonated = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
  const projectsCount = new Set(donations.map((d) => d.project?._id)).size;

  // Get initial letter for avatar
  const getInitial = (name) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  // Color for avatar based on initial
  const getAvatarColor = (name) => {
    const colors = ["#1e5631", "#d4a843", "#2d6a4f", "#8B5E3C", "#3B82F6"];
    if (!name) return colors[0];
    return colors[name.charCodeAt(0) % colors.length];
  };

  return (
    <div className="dashboard-wrapper">
      <DonorSidebar />

      <div className="dashboard-content">
        {/* Header */}
        <div className="dash-header">
          <div>
            <h1>Welcome Back, Donor! 👋</h1>
            <p className="dash-subtitle">Track your contributions and see your impact.</p>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="stats-row">
          <div className="stat-card-new">
            <div className="stat-icon-box green">♥</div>
            <div className="stat-value">NPR {totalDonated.toLocaleString()}</div>
            <div className="stat-label">Total Donated</div>
          </div>

          <div className="stat-card-new">
            <div className="stat-icon-box amber"></div>
            <div className="stat-value">{projectsCount}</div>
            <div className="stat-label">NGOs Supported</div>
          </div>

          <div className="stat-card-new">
            <div className="stat-icon-box teal"></div>
            <div className="stat-value">{donations.length}</div>
            <div className="stat-label">Donations</div>
          </div>

          <div className="stat-card-new">
            <div className="stat-icon-box gold"></div>
            <div className="stat-value">{Math.min(donations.length, 6)}</div>
            <div className="stat-label">Badges Earned</div>
          </div>
        </div>

        {/* Main grid: chart + impact sidebar */}
        <div className="dash-grid">
          {/* Donation Trends */}
          <div className="dash-chart-card">
            <div className="dash-chart-header">
              <h3>Donation Trends</h3>
              <span className="chart-badge">Last 6 months</span>
            </div>
            <div className="chart-placeholder">
              <svg viewBox="0 0 600 200" className="trend-line">
                <defs>
                  <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1e5631" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#1e5631" stopOpacity="0.01" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,180 C50,175 80,160 120,140 C160,120 200,90 250,85 C300,80 340,70 400,50 C440,40 500,30 560,25 L600,20 L600,200 L0,200 Z"
                  fill="url(#fillGrad)"
                />
                <path
                  d="M0,180 C50,175 80,160 120,140 C160,120 200,90 250,85 C300,80 340,70 400,50 C440,40 500,30 560,25 L600,20"
                  fill="none"
                  stroke="#1e5631"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              <div className="chart-labels">
                <span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span>
              </div>
            </div>
          </div>

          {/* Right sidebar: Impact + Badges */}
          <div className="dash-sidebar-col">
            {/* Your Impact */}
            <div className="impact-card">
              <h3>Your Impact</h3>
              <div className="impact-row">
                <span>Education</span>
                <span>60%</span>
              </div>
              <div className="impact-bar"><div className="impact-fill" style={{ width: '60%' }} /></div>

              <div className="impact-row">
                <span>Healthcare</span>
                <span>25%</span>
              </div>
              <div className="impact-bar"><div className="impact-fill" style={{ width: '25%' }} /></div>

              <div className="impact-row">
                <span>Environment</span>
                <span>15%</span>
              </div>
              <div className="impact-bar"><div className="impact-fill" style={{ width: '15%' }} /></div>

              <div className="impact-footer">↗ 3 communities impacted</div>
            </div>

            {/* Your Badges */}
            <div className="badges-card">
              <div className="badges-header">
                <h3>Your Badges</h3>
                <a href="/badges" className="view-all-link">View All →</a>
              </div>
              <div className="badges-grid">
                <div className="badge-item"><span>First Donation</span></div>
                <div className="badge-item"><span>Generous Heart</span></div>
                <div className="badge-item"><span>Education Champion</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Donations */}
        <div className="recent-section">
          <div className="recent-header">
            <h3>Recent Donations</h3>
            <a href="/my-donations" className="view-all-link">View All →</a>
          </div>

          {loading ? (
            <div className="loading-state">
              {[1, 2, 3].map((i) => (
                <div key={i} className="donation-row skeleton">
                  <div className="skel-avatar" />
                  <div className="skel-lines">
                    <div className="skel-line w60" />
                    <div className="skel-line w40" />
                  </div>
                </div>
              ))}
            </div>
          ) : donations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"></div>
              <p>No donations yet. Start making a difference!</p>
            </div>
          ) : (
            donations.slice(0, 5).map((donation, index) => (
              <div
                key={donation._id}
                className="donation-row"
                style={{ animationDelay: `${index * 0.06}s` }}
              >
                <div
                  className="donation-avatar"
                  style={{ background: getAvatarColor(donation.project?.ngo?.organizationName) }}
                >
                  {getInitial(donation.project?.ngo?.organizationName)}
                </div>

                <div className="donation-info">
                  <div className="donation-title">
                    {donation.project?.title || "(No project)"}
                  </div>
                  <div className="donation-ngo">
                    {donation.project?.ngo?.organizationName || "-"}
                  </div>
                </div>

                <div className="donation-right">
                  <div className="donation-amount">
                    NPR {donation.amount?.toLocaleString()}
                  </div>
                  <div className="donation-status completed">completed</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default DonorDashboard;