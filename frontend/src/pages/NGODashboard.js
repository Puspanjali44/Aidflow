import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import NgoLayout from "../components/NgoLayout";
import "./NGODashboard.css";

const API = "http://localhost:5000";

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

function NGODashboard() {
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotifications, setReadNotifications] = useState([]);

  const navigate = useNavigate();
  const notificationRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API}/api/ngo/profile`, { headers }).then((r) => r.json()),
      fetch(`${API}/api/projects/my`, { headers }).then((r) => r.json()),
    ])
      .then(([profileData, projectData]) => {
        setProfile(profileData);
        setProjects(Array.isArray(projectData) ? projectData : []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalRaised = projects.reduce((s, p) => s + (p.raisedAmount || 0), 0);
  const totalGoal = projects.reduce((s, p) => s + (p.goalAmount || 0), 0);
  const totalDonors = projects.reduce((s, p) => s + (p.donorCount || 0), 0);
  const activeCount = projects.filter((p) => p.status === "active").length;
  const completedCount = projects.filter((p) => p.status === "completed").length;
  const avgDonation = totalDonors > 0 ? Math.round(totalRaised / totalDonors) : 0;
  const overallPct =
    totalGoal > 0 ? Math.min(100, Math.round((totalRaised / totalGoal) * 100)) : 0;

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "NG";

  const profileImg = profile?.profileImage
    ? `${API}/uploads/${profile.profileImage}`
    : null;

  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const topProjects = [...projects]
    .filter((p) => p.status === "active" || p.status === "completed")
    .sort((a, b) => (b.raisedAmount || 0) - (a.raisedAmount || 0))
    .slice(0, 3);

  const notifications = useMemo(() => {
    const items = [];

    if (profile?.flagged) {
      items.push({
        id: `ngo-flagged-${profile._id || "profile"}`,
        type: "warning",
        title: "NGO profile flagged for review",
        message: profile.flagReason || "Your NGO profile is under admin review.",
        time: profile.reviewedAt || profile.updatedAt || profile.createdAt,
        action: "/ngo/settings",
      });
    }

    projects.forEach((project) => {
      if (project.status === "under_review") {
        items.push({
          id: `project-review-${project._id}`,
          type: "info",
          title: "Project under review",
          message: `${project.title} is waiting for admin approval.`,
          time: project.updatedAt || project.createdAt,
          action: `/projects/${project._id}`,
        });
      }

      if (project.status === "rejected") {
        items.push({
          id: `project-rejected-${project._id}`,
          type: "danger",
          title: "Project rejected",
          message: `${project.title} was rejected by admin.`,
          time: project.updatedAt || project.createdAt,
          action: `/projects/${project._id}`,
        });
      }

      if (project.status === "paused") {
        items.push({
          id: `project-paused-${project._id}`,
          type: "warning",
          title: "Project paused",
          message: `${project.title} is currently paused.`,
          time: project.updatedAt || project.createdAt,
          action: `/projects/${project._id}`,
        });
      }

      if (project.status === "completed") {
        items.push({
          id: `project-completed-${project._id}`,
          type: "success",
          title: "Project completed",
          message: `${project.title} has reached its goal.`,
          time: project.updatedAt || project.createdAt,
          action: `/projects/${project._id}`,
        });
      }
    });

    return items.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
  }, [profile, projects]);

  const unreadCount = notifications.filter(
    (n) => !readNotifications.includes(n.id)
  ).length;

  const markAllAsRead = () => {
    setReadNotifications(notifications.map((n) => n.id));
  };

  const openNotification = (notification) => {
    if (!readNotifications.includes(notification.id)) {
      setReadNotifications((prev) => [...prev, notification.id]);
    }
    setShowNotifications(false);
    navigate(notification.action);
  };

  if (loading) {
    return (
      <NgoLayout>
        <div className="dash-loading">
          <div className="dash-spinner" />
          <p>Loading dashboard...</p>
        </div>
      </NgoLayout>
    );
  }

  return (
    <NgoLayout>
      <div className="dash-page">
        <div className="page-header page-header-flex">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back, {profile?.name || "Your NGO"}</p>
          </div>

          <div className="notification-wrap" ref={notificationRef}>
            <button
              className="notification-btn"
              onClick={() => setShowNotifications((prev) => !prev)}
            >
              🔔
              {unreadCount > 0 && (
                <span className="notification-badge">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="notification-panel">
                <div className="notification-header">
                  <h3>Notifications</h3>
                  {notifications.length > 0 && (
                    <button
                      className="mark-read-btn"
                      onClick={markAllAsRead}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="notification-empty">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((item) => {
                    const isRead = readNotifications.includes(item.id);

                    return (
                      <div
                        key={item.id}
                        className={`notification-item ${isRead ? "read" : "unread"} ${item.type}`}
                        onClick={() => openNotification(item)}
                      >
                        <div className="notification-dot" />
                        <div className="notification-content">
                          <strong>{item.title}</strong>
                          <p>{item.message}</p>
                          <span>{timeAgo(item.time)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {profile?.flagged && (
          <div
            style={{
              background: "#fff7ed",
              border: "1px solid #fdba74",
              color: "#9a3412",
              padding: "16px",
              borderRadius: "12px",
              marginBottom: "20px",
            }}
          >
            <h3 style={{ margin: "0 0 8px 0" }}>NGO Review Alert</h3>
            <p style={{ margin: "0 0 8px 0" }}>
              Your NGO profile has been flagged for admin review.
            </p>

            {profile.flagReason && (
              <p style={{ margin: "0 0 8px 0" }}>
                <strong>Reason:</strong> {profile.flagReason}
              </p>
            )}

            {profile.riskReasons?.length > 0 && (
              <div>
                <strong>Risk Notes:</strong>
                <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
                  {profile.riskReasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}

            <p style={{ margin: "8px 0 0 0" }}>
              <strong>Reviewed At:</strong>{" "}
              {profile.reviewedAt
                ? new Date(profile.reviewedAt).toLocaleString()
                : "Not available"}
            </p>

            <p style={{ margin: "8px 0 0 0" }}>
              <strong>Verification Status:</strong> {profile.verificationStatus || "—"}
            </p>

            <p style={{ margin: "8px 0 0 0" }}>
              <strong>Account Status:</strong> {profile.accountStatus || "—"}
            </p>
          </div>
        )}

        <div className="profile-hero">
          <div className="profile-hero-left">
            <div className="profile-avatar-wrap">
              {profileImg ? (
                <img src={profileImg} alt="NGO" className="profile-avatar-img" />
              ) : (
                <div
                  className="profile-avatar-initials"
                  style={{ background: "#1e5631" }}
                >
                  {initials}
                </div>
              )}
              {profile?.verificationStatus === "approved" && (
                <span className="verified-ring">✓</span>
              )}
            </div>

            <div className="profile-hero-info">
              <div className="profile-hero-name-row">
                <h2>{profile?.name || "Your NGO"}</h2>
                {profile?.verificationStatus === "approved" && (
                  <span className="ver-badge ver-approved">VERIFIED ✓</span>
                )}
                {profile?.flagged && (
                  <span
                    style={{
                      marginLeft: "10px",
                      background: "#fef3c7",
                      color: "#92400e",
                      padding: "6px 10px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    FLAGGED
                  </span>
                )}
              </div>

              <p className="profile-hero-sub">
                {profile?.category && <span>{profile.category}</span>}
                {profile?.location && <span>{profile.location}</span>}
                {profile?.phone && <span>{profile.phone}</span>}
              </p>

              {profile?.mission && (
                <p className="profile-hero-mission">"{profile.mission}"</p>
              )}
            </div>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon stat-icon-green">💰</div>
            <h4>TOTAL RAISED</h4>
            <p>Rs. {totalRaised.toLocaleString()}</p>
            <span className="stat-sub">{overallPct}% of all goals</span>
          </div>

          <div className="stat-card">
            <div className="stat-icon stat-icon-blue">📁</div>
            <h4>ACTIVE PROJECTS</h4>
            <p>{activeCount}</p>
            <span className="stat-sub">{completedCount} completed</span>
          </div>

          <div className="stat-card">
            <div className="stat-icon stat-icon-purple">🤝</div>
            <h4>TOTAL DONORS</h4>
            <p>{totalDonors}</p>
            <span className="stat-sub">across all projects</span>
          </div>

          <div className="stat-card">
            <div className="stat-icon stat-icon-gold">📊</div>
            <h4>AVG. DONATION</h4>
            <p>Rs. {avgDonation.toLocaleString()}</p>
            <span className="stat-sub">per donor</span>
          </div>
        </div>

        <div className="dash-columns">
          <div className="dash-col-wide">
            <div className="dash-section-header">
              <h2>Project Funding Overview</h2>
            </div>

            {recentProjects.length === 0 ? (
              <div className="dash-empty">
                <p>No projects created yet.</p>
                <button
                  className="hero-btn hero-btn-primary"
                  onClick={() => navigate("/ngo/projects/create")}
                >
                  Create Project
                </button>
              </div>
            ) : (
              recentProjects.map((project) => {
                const pct =
                  project.goalAmount > 0
                    ? Math.min(
                        100,
                        Math.round((project.raisedAmount / project.goalAmount) * 100)
                      )
                    : 0;

                return (
                  <div key={project._id} className="project-overview-card">
                    <div className="project-overview-header">
                      <div>
                        <h3>{project.title}</h3>
                        <span className={`status-badge ${project.status || "active"}`}>
                          {project.status === "under_review"
                            ? "Under Review"
                            : project.status === "active"
                            ? "Active"
                            : project.status === "paused"
                            ? "Paused"
                            : project.status === "rejected"
                            ? "Rejected"
                            : "Completed"}
                        </span>
                      </div>
                      <span className="pct-label">{pct}%</span>
                    </div>

                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>

                    <div className="project-meta-row">
                      <span>
                        Rs. {(project.raisedAmount || 0).toLocaleString()} raised of Rs.{" "}
                        {(project.goalAmount || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="project-meta-row" style={{ marginTop: 6 }}>
                      <span>{project.donorCount || 0} donors</span>
                      <span>
                        Ends{" "}
                        {project.endDate
                          ? new Date(project.endDate).toLocaleDateString("en-GB")
                          : "—"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="dash-col-narrow">
            <div className="info-card">
              <h3 className="info-card-title">Organisation Info</h3>
              <div className="info-rows">
                <div className="info-row">
                  <span className="info-label">Reg. Number</span>
                  <span className="info-val">{profile?.registrationNumber || "—"}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Established</span>
                  <span className="info-val">{profile?.establishedYear || "—"}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Website</span>
                  <span className="info-val">{profile?.website || "—"}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Bank</span>
                  <span className="info-val">{profile?.bankName || "—"}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Account</span>
                  <span className="info-val">
                    {profile?.accountNumber
                      ? `****${profile.accountNumber.slice(-4)}`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="info-card">
              <h3 className="info-card-title">Top Projects</h3>
              {topProjects.length > 0 ? (
                topProjects.map((p, i) => {
                  const pct =
                    p.goalAmount > 0
                      ? Math.min(
                          100,
                          Math.round((p.raisedAmount / p.goalAmount) * 100)
                        )
                      : 0;

                  return (
                    <div key={p._id} className="top-project-row">
                      <span className="top-rank">#{i + 1}</span>
                      <div className="top-info">
                        <span className="top-name">{p.title}</span>
                        <div className="top-bar-wrap">
                          <div className="top-bar">
                            <div className="top-bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="top-pct">{pct}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: "#888", fontSize: "13.5px" }}>No projects yet</p>
              )}
            </div>

            <div className="info-card">
              <h3 className="info-card-title">Account Status</h3>
              <div className="account-status-row">
                <div
                  className={`account-dot ${
                    profile?.accountStatus === "active" ? "dot-active" : "dot-inactive"
                  }`}
                />
                <span className="account-status-label">
                  {profile?.accountStatus === "active"
                    ? "Active — NGO is live"
                    : profile?.accountStatus === "paused"
                    ? "Paused"
                    : profile?.accountStatus === "deactivated"
                    ? "Deactivated"
                    : "Inactive"}
                </span>
              </div>
              <div className="account-meta">
                Member since{" "}
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                    })
                  : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </NgoLayout>
  );
}

export default NGODashboard;