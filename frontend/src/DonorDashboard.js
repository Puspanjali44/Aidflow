import React, { useEffect, useMemo, useState } from "react";
import DonorSidebar from "./components/DonorSidebar";
import "./Dashboard.css";
import axios from "axios";

const API = "http://localhost:5000/api";

function timeAgo(dateString) {
  if (!dateString) return "Recently";

  const now = new Date();
  const date = new Date(dateString);
  const diff = now - date;

  const mins = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function DonorDashboard() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [projectNotifications, setProjectNotifications] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setDonations([]);
        setProjectNotifications([]);
        setLoading(false);
        return;
      }

      const donationRes = await axios.get(`${API}/donations/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const donationData = donationRes.data || [];
      setDonations(donationData);

      const uniqueProjects = Array.from(
        new Map(
          donationData
            .filter((d) => d.project?._id)
            .map((d) => [d.project._id, d.project])
        ).values()
      );

      const notificationResults = await Promise.all(
        uniqueProjects.map(async (project) => {
          const projectId = project._id;

          const [updatesRes, impactRes] = await Promise.allSettled([
            axios.get(`${API}/updates/${projectId}`),
            axios.get(`${API}/projects/${projectId}/impact`),
          ]);

          const notifications = [];

          if (updatesRes.status === "fulfilled") {
            const updates = Array.isArray(updatesRes.value.data)
              ? updatesRes.value.data
              : [];

            updates.slice(0, 3).forEach((update) => {
              notifications.push({
                id: `update-${update._id}`,
                type: "update",
                projectId,
                projectTitle: project.title || "Project",
                ngoName: project.ngo?.organizationName || "NGO",
                text: `${project.ngo?.organizationName || "NGO"} posted a new update on ${project.title}`,
                subText: update.title || "New progress update added",
                createdAt: update.createdAt,
              });
            });
          }

          if (impactRes.status === "fulfilled") {
            const impact = impactRes.value.data;

            if (
              impact &&
              (
                impact.pdfUploaded ||
                (impact.photoCount && impact.photoCount > 0) ||
                impact.updatedAt ||
                impact.createdAt
              )
            ) {
              notifications.push({
                id: `evidence-${projectId}-${impact.updatedAt || impact.createdAt || "1"}`,
                type: "evidence",
                projectId,
                projectTitle: project.title || "Project",
                ngoName: project.ngo?.organizationName || "NGO",
                text: `${project.ngo?.organizationName || "NGO"} added new evidence for ${project.title}`,
                subText: impact.pdfUploaded
                  ? "Impact report PDF uploaded"
                  : `${impact.photoCount || 0} new proof photo(s) uploaded`,
                createdAt: impact.updatedAt || impact.createdAt || new Date().toISOString(),
              });
            }
          }

          return notifications;
        })
      );

      const flattened = notificationResults
        .filter((r) => r.status === "fulfilled")
        .flatMap((r) => r.value)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setProjectNotifications(flattened);
    } catch (error) {
      console.error("Error fetching donor dashboard data", error);
      setDonations([]);
      setProjectNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const totalDonated = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
  const projectsCount = new Set(donations.map((d) => d.project?._id)).size;

  const getInitial = (name) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = ["#1e5631", "#d4a843", "#2d6a4f", "#8B5E3C", "#3B82F6"];
    if (!name) return colors[0];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const notificationCount = projectNotifications.length;

  return (
    <div className="dashboard-wrapper">
      <DonorSidebar />

      <div className="dashboard-content">
        <div
          className="dash-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h1>Welcome Back, Donor! 👋</h1>
            <p className="dash-subtitle">
              Track your contributions and see your impact.
            </p>
          </div>

          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                width: "45px",
                height: "45px",
                borderRadius: "50%",
                border: "none",
                background: "#fff",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                fontSize: "20px",
                cursor: "pointer",
                position: "relative",
              }}
            >
              🔔
              {notificationCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-2px",
                    minWidth: "18px",
                    height: "18px",
                    borderRadius: "999px",
                    background: "#ef4444",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 5px",
                  }}
                >
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                style={{
                  position: "absolute",
                  top: "55px",
                  right: 0,
                  width: "320px",
                  maxHeight: "380px",
                  overflowY: "auto",
                  background: "#fff",
                  borderRadius: "12px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                  padding: "10px",
                  zIndex: 1000,
                }}
              >
                {projectNotifications.length === 0 ? (
                  <p style={{ textAlign: "center", margin: 0 }}>
                    No notifications
                  </p>
                ) : (
                  projectNotifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: "12px 10px",
                        borderBottom: "1px solid #eee",
                        fontSize: "14px",
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: "4px" }}>
                        {n.text}
                      </div>
                      <div style={{ color: "#666", fontSize: "12px", marginBottom: "4px" }}>
                        {n.subText}
                      </div>
                      <div style={{ color: "#999", fontSize: "11px" }}>
                        {timeAgo(n.createdAt)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-card-new">
            <div className="stat-icon-box green">♥</div>
            <div className="stat-value">
              NPR {totalDonated.toLocaleString()}
            </div>
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

        <div className="dash-grid">
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

          <div className="dash-sidebar-col">
            <div className="impact-card">
              <h3>Your Impact</h3>
              <div className="impact-row">
                <span>Education</span>
                <span>60%</span>
              </div>
              <div className="impact-bar"><div className="impact-fill" style={{ width: "60%" }} /></div>

              <div className="impact-row">
                <span>Healthcare</span>
                <span>25%</span>
              </div>
              <div className="impact-bar"><div className="impact-fill" style={{ width: "25%" }} /></div>

              <div className="impact-row">
                <span>Environment</span>
                <span>15%</span>
              </div>
              <div className="impact-bar"><div className="impact-fill" style={{ width: "15%" }} /></div>

              <div className="impact-footer">↗ 3 communities impacted</div>
            </div>

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