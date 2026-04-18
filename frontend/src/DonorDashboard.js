import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [projectNotifications, setProjectNotifications] = useState([]);
  const [donorName, setDonorName] = useState("Donor");
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    const saved = localStorage.getItem("donorReadNotificationIds");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "null");
    if (savedUser?.name) {
      setDonorName(savedUser.name);
    }

    fetchDashboardData();

    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "donorReadNotificationIds",
      JSON.stringify(readNotificationIds)
    );
  }, [readNotificationIds]);

  const fetchDashboardData = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

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

      const donationData = Array.isArray(donationRes.data) ? donationRes.data : [];
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
                color: "#3b82f6",
                projectId,
                projectTitle: project.title || "Project",
                ngoName: project.ngo?.organizationName || "NGO",
                text: "Project update posted",
                subText: `${project.title || "Project"}${
                  update.title
                    ? ` was updated: ${update.title}`
                    : " has a new progress update."
                }`,
                createdAt: update.createdAt,
              });
            });
          }

          if (impactRes.status === "fulfilled") {
            const impact = impactRes.value.data;

            if (
              impact &&
              (impact.pdfUploaded ||
                (impact.photoCount && impact.photoCount > 0) ||
                impact.updatedAt ||
                impact.createdAt)
            ) {
              notifications.push({
                id: `evidence-${projectId}-${impact.updatedAt || impact.createdAt || "1"}`,
                type: "evidence",
                color: "#22c55e",
                projectId,
                projectTitle: project.title || "Project",
                ngoName: project.ngo?.organizationName || "NGO",
                text: "New evidence uploaded",
                subText: impact.pdfUploaded
                  ? `${project.title || "Project"} now has a new impact report PDF.`
                  : `${project.title || "Project"} now has ${impact.photoCount || 0} new proof photo(s).`,
                createdAt:
                  impact.updatedAt ||
                  impact.createdAt ||
                  new Date().toISOString(),
              });
            }
          }

          return notifications;
        })
      );

      const flattened = notificationResults
        .flat()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setProjectNotifications(flattened);
      setReadNotificationIds((prev) =>
        prev.filter((id) => flattened.some((n) => n.id === id))
      );
    } catch (error) {
      console.error("Error fetching donor dashboard data", error);
      setDonations([]);
      setProjectNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const totalDonated = donations.reduce(
    (sum, d) => sum + (Number(d.amount) || 0),
    0
  );

  const projectsCount = new Set(
    donations.map((d) => d.project?._id).filter(Boolean)
  ).size;

  const getInitial = (name) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = ["#1e5631", "#d4a843", "#2d6a4f", "#8B5E3C", "#3B82F6"];
    if (!name) return colors[0];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const totalDonatedAmount = donations.reduce(
    (sum, d) => sum + Number(d.amount || 0),
    0
  );

  const uniqueProjectsSupported = new Set(
    donations
      .map((d) =>
        typeof d.project === "object" ? d.project?._id : d.project
      )
      .filter(Boolean)
  ).size;

  const donationCount = donations.length;

  const stats = {
    donationCount,
    totalDonated: totalDonatedAmount,
    uniqueProjects: uniqueProjectsSupported,
  };

  const allBadges = [
    {
      emoji: "🎉",
      title: "First Donation",
      desc: "Made your first donation",
      condition: stats.donationCount >= 1,
    },
    {
      emoji: "💖",
      title: "Generous Heart",
      desc: `Donated NPR ${stats.totalDonated.toLocaleString("en-IN")} / 10,000`,
      condition: stats.totalDonated >= 10000,
    },
    {
      emoji: "📚",
      title: "Supporter",
      desc: `Supported ${stats.uniqueProjects} / 3 projects`,
      condition: stats.uniqueProjects >= 3,
    },
    {
      emoji: "🌍",
      title: "Community Builder",
      desc: `Supported ${stats.uniqueProjects} / 5 projects`,
      condition: stats.uniqueProjects >= 5,
    },
    {
      emoji: "🏆",
      title: "Top Donor",
      desc: `Donated NPR ${stats.totalDonated.toLocaleString("en-IN")} / 50,000`,
      condition: stats.totalDonated >= 50000,
    },
    {
      emoji: "⚡",
      title: "Active Giver",
      desc: `Made ${stats.donationCount} / 10 donations`,
      condition: stats.donationCount >= 10,
    },
  ];

  const earnedBadges = allBadges.filter((badge) => badge.condition);
  const previewBadges = earnedBadges.slice(0, 3);

  const unreadCount = projectNotifications.filter(
    (n) => !readNotificationIds.includes(n.id)
  ).length;

  const handleNotificationClick = (notification) => {
    setReadNotificationIds((prev) =>
      prev.includes(notification.id) ? prev : [...prev, notification.id]
    );

    setShowNotifications(false);

    if (notification.projectId) {
      navigate(`/project/${notification.projectId}`);
    }
  };

  const handleMarkAllAsRead = () => {
    setReadNotificationIds(projectNotifications.map((n) => n.id));
  };

  const trendData = useMemo(() => {
    const now = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleString("en-US", { month: "short" }),
        amount: 0,
      });
    }

    donations.forEach((donation) => {
      const donationDate = donation.createdAt
        ? new Date(donation.createdAt)
        : null;

      if (!donationDate || Number.isNaN(donationDate.getTime())) return;

      const key = `${donationDate.getFullYear()}-${donationDate.getMonth()}`;
      const monthItem = months.find((m) => m.key === key);

      if (monthItem) {
        monthItem.amount += Number(donation.amount) || 0;
      }
    });

    return months;
  }, [donations]);

  const maxTrendAmount = Math.max(...trendData.map((item) => item.amount), 0);

  const chartPath = useMemo(() => {
    const width = 600;
    const height = 200;
    const paddingX = 20;
    const paddingTop = 20;
    const paddingBottom = 20;

    if (!trendData.length) return "";

    const usableWidth = width - paddingX * 2;
    const usableHeight = height - paddingTop - paddingBottom;

    const points = trendData.map((item, index) => {
      const x =
        paddingX +
        (trendData.length === 1
          ? usableWidth / 2
          : (index * usableWidth) / (trendData.length - 1));

      const normalized =
        maxTrendAmount > 0 ? item.amount / maxTrendAmount : 0;

      const y = paddingTop + usableHeight - normalized * usableHeight;

      return { x, y };
    });

    return points
      .map((point, index) =>
        `${index === 0 ? "M" : "L"}${point.x},${point.y}`
      )
      .join(" ");
  }, [trendData, maxTrendAmount]);

  const areaPath = useMemo(() => {
    const width = 600;
    const height = 200;

    if (!chartPath || !trendData.length) return "";

    const lastX = 600 - 20;
    const firstX = 20;

    return `${chartPath} L${lastX},${height} L${firstX},${height} Z`;
  }, [chartPath, trendData]);

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
            <h1>Welcome Back, {donorName}! 👋</h1>
            <p className="dash-subtitle">
              Track your contributions and see your impact.
            </p>
          </div>

          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                border: "none",
                background: "#fff",
                boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                fontSize: "24px",
                cursor: "pointer",
                position: "relative",
              }}
            >
              🔔
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-2px",
                    minWidth: "22px",
                    height: "22px",
                    borderRadius: "999px",
                    background: "#ef4444",
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 6px",
                  }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                style={{
                  position: "absolute",
                  top: "62px",
                  right: 0,
                  width: "360px",
                  maxHeight: "500px",
                  overflowY: "auto",
                  background: "#fff",
                  borderRadius: "16px",
                  boxShadow: "0 18px 35px rgba(0,0,0,0.16)",
                  zIndex: 1000,
                  border: "1px solid #ececec",
                }}
              >
                <div
                  style={{
                    padding: "18px 16px",
                    borderBottom: "1px solid #ececec",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    position: "sticky",
                    top: 0,
                    background: "#fff",
                    zIndex: 2,
                  }}
                >
                  <h4
                    style={{
                      margin: 0,
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#1f2937",
                    }}
                  >
                    Notifications
                  </h4>

                  {projectNotifications.length > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#2563eb",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                {projectNotifications.length === 0 ? (
                  <p
                    style={{
                      textAlign: "center",
                      margin: 0,
                      padding: "24px",
                      color: "#6b7280",
                    }}
                  >
                    No notifications
                  </p>
                ) : (
                  projectNotifications.map((n) => {
                    const isRead = readNotificationIds.includes(n.id);

                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        style={{
                          padding: "18px 16px",
                          borderBottom: "1px solid #f0f0f0",
                          display: "flex",
                          gap: "12px",
                          cursor: "pointer",
                          background: isRead ? "#fff" : "#f9fbff",
                          transition: "0.2s ease",
                        }}
                      >
                        <div
                          style={{
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            background: n.color || "#3b82f6",
                            marginTop: "8px",
                            flexShrink: 0,
                          }}
                        />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: "15px",
                              color: "#374151",
                              marginBottom: "6px",
                            }}
                          >
                            {n.text}
                          </div>

                          <div
                            style={{
                              color: "#6b7280",
                              fontSize: "13px",
                              lineHeight: "1.5",
                              marginBottom: "10px",
                            }}
                          >
                            {n.subText}
                          </div>

                          <div
                            style={{
                              color: "#94a3b8",
                              fontSize: "12px",
                              fontWeight: 500,
                            }}
                          >
                            {timeAgo(n.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-card-new">
            <div className="stat-icon-box green">♥</div>
            <div className="stat-value">NPR {totalDonated.toLocaleString()}</div>
            <div className="stat-label">Total Donated</div>
          </div>

          <div className="stat-card-new">
            <div className="stat-icon-box amber">❤️</div>
            <div className="stat-value">{projectsCount}</div>
            <div className="stat-label">NGOs Supported</div>
          </div>

          <div className="stat-card-new">
            <div className="stat-icon-box teal">🏦</div>
            <div className="stat-value">{donations.length}</div>
            <div className="stat-label">Donations</div>
          </div>

          <div className="stat-card-new">
            <div className="stat-icon-box gold">🏆</div>
            <div className="stat-value">{earnedBadges.length}</div>
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
              {donationCount === 0 ? (
                <div
                  style={{
                    height: "200px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6b7280",
                    fontWeight: 500,
                  }}
                >
                  No donation data yet
                </div>
              ) : (
                <svg viewBox="0 0 600 200" className="trend-line">
                  <defs>
                    <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1e5631" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#1e5631" stopOpacity="0.01" />
                    </linearGradient>
                  </defs>

                  <path d={areaPath} fill="url(#fillGrad)" />
                  <path
                    d={chartPath}
                    fill="none"
                    stroke="#1e5631"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}

              <div className="chart-labels">
                {trendData.map((item) => (
                  <span key={item.key}>{item.label}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="dash-sidebar-col">
            <div className="impact-card">
              <h3>Your Impact</h3>

              <div className="impact-row">
                <span>Total Donated</span>
                <span>NPR {totalDonated.toLocaleString()}</span>
              </div>
              <div className="impact-bar">
                <div
                  className="impact-fill"
                  style={{
                    width: `${Math.min((donations.length / 10) * 100, 100)}%`,
                  }}
                />
              </div>

              <div className="impact-row">
                <span>Projects Supported</span>
                <span>{projectsCount}</span>
              </div>
              <div className="impact-bar">
                <div
                  className="impact-fill"
                  style={{
                    width: `${Math.min((projectsCount / 5) * 100, 100)}%`,
                  }}
                />
              </div>

              <div className="impact-row">
                <span>Total Donations</span>
                <span>{donations.length}</span>
              </div>
              <div className="impact-bar">
                <div
                  className="impact-fill"
                  style={{
                    width: `${Math.min((donations.length / 10) * 100, 100)}%`,
                  }}
                />
              </div>

              <div className="impact-footer">
                ↗ Supported {projectsCount} project{projectsCount !== 1 ? "s" : ""}
              </div>
            </div>

            <div className="badges-card">
              <div className="badges-header">
                <h3>Your Badges</h3>
                <a href="/badges" className="view-all-link">
                  View All →
                </a>
              </div>

              <div
                className="badges-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: "14px",
                  alignItems: "stretch",
                }}
              >
                {previewBadges.length === 0 ? (
                  <div
                    className="badge-item"
                    style={{
                      gridColumn: "1 / -1",
                      minHeight: "120px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "16px",
                      padding: "20px",
                      textAlign: "center",
                    }}
                  >
                    <span>No badges yet</span>
                  </div>
                ) : (
                  previewBadges.map((badge, index) => (
                    <div
                      key={index}
                      className="badge-item"
                      style={{
                        minHeight: "160px",
                        borderRadius: "18px",
                        padding: "18px 14px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        boxSizing: "border-box",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "34px",
                          lineHeight: 1,
                          marginBottom: "14px",
                        }}
                      >
                        {badge.emoji}
                      </div>

                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "15px",
                          lineHeight: "1.4",
                          color: "#1f2937",
                        }}
                      >
                        {badge.title}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="recent-section">
          <div className="recent-header">
            <h3>Recent Donations</h3>
            <a href="/my-donations" className="view-all-link">
              View All →
            </a>
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
                key={donation._id || index}
                className="donation-row"
                style={{ animationDelay: `${index * 0.06}s` }}
              >
                <div
                  className="donation-avatar"
                  style={{
                    background: getAvatarColor(
                      donation.project?.ngo?.organizationName
                    ),
                  }}
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
                    NPR {Number(donation.amount || 0).toLocaleString()}
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