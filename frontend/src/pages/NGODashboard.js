import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NgoLayout from "../components/NgoLayout";
import "./NGODashboard.css";

const API = "http://localhost:5000";

function NGODashboard() {
  const [profile,  setProfile]  = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API}/api/ngo/profile`,   { headers }).then(r => r.json()),
      fetch(`${API}/api/projects/my`,   { headers }).then(r => r.json()),
    ]).then(([profileData, projectData]) => {
      setProfile(profileData);
      setProjects(Array.isArray(projectData) ? projectData : []);
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // ── derived stats ──
  const totalRaised   = projects.reduce((s, p) => s + (p.raisedAmount || 0), 0);
  const totalGoal     = projects.reduce((s, p) => s + (p.goalAmount   || 0), 0);
  const totalDonors   = projects.reduce((s, p) => s + (p.donorCount   || 0), 0);
  const activeCount   = projects.filter(p => p.status === "active").length;
  const completedCount= projects.filter(p => p.status === "completed").length;
  const avgDonation   = totalDonors > 0 ? Math.round(totalRaised / totalDonors) : 0;
  const overallPct    = totalGoal  > 0 ? Math.min(100, Math.round((totalRaised / totalGoal) * 100)) : 0;

  const verStatus = profile?.verificationStatus || "draft";
  const VER_MAP = {
    draft:    { label: "Not Verified",  cls: "ver-draft"    },
    pending:  { label: "Under Review",  cls: "ver-pending"  },
    approved: { label: "Verified ✓",    cls: "ver-approved" },
    rejected: { label: "Rejected",      cls: "ver-rejected" },
  };
  const ver = VER_MAP[verStatus] || VER_MAP.draft;

  const initials = profile?.name
    ? profile.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "NG";

  const profileImg = profile?.profileImage
    ? `${API}/uploads/${profile.profileImage}`
    : null;

  // top 3 active projects by raised amount
  const topProjects = [...projects]
    .filter(p => p.status === "active")
    .sort((a, b) => (b.raisedAmount || 0) - (a.raisedAmount || 0))
    .slice(0, 3);

  // all projects for the overview list
  const recentProjects = [...projects].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  ).slice(0, 5);

  if (loading) {
    return (
      <NgoLayout>
        <div className="dash-loading">
          <div className="dash-spinner" />
          <p>Loading dashboard…</p>
        </div>
      </NgoLayout>
    );
  }

  return (
    <NgoLayout>
      <div className="dash-page">

        {/* ══════════════════════════════════════════
            PROFILE HERO CARD
        ══════════════════════════════════════════ */}
        <div className="profile-hero">
          <div className="profile-hero-left">
            <div className="profile-avatar-wrap">
              {profileImg ? (
                <img src={profileImg} alt="NGO" className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-initials">{initials}</div>
              )}
              {verStatus === "approved" && <span className="verified-ring" title="Verified" />}
            </div>

            <div className="profile-hero-info">
              <div className="profile-hero-name-row">
                <h1 className="profile-hero-name">{profile?.name || "Your NGO"}</h1>
                <span className={`ver-badge ${ver.cls}`}>{ver.label}</span>
              </div>
              <p className="profile-hero-sub">
                {profile?.category && <span>📂 {profile.category}</span>}
                {profile?.location  && <span>📍 {profile.location}</span>}
                {profile?.phone     && <span>📞 {profile.phone}</span>}
              </p>
              {profile?.mission && (
                <p className="profile-hero-mission">"{profile.mission}"</p>
              )}
            </div>
          </div>

          {/* Quick action buttons */}
          <div className="profile-hero-actions">
            {verStatus !== "approved" && (
              <button
                className="hero-btn hero-btn-verify"
                onClick={() => navigate("/ngo/settings")}
              >
                {verStatus === "pending" ? "⏳ Verification Pending" : "🚀 Get Verified"}
              </button>
            )}
            <button className="hero-btn hero-btn-outline" onClick={() => navigate("/ngo/projects/create")}>
              + New Project
            </button>
            <button className="hero-btn hero-btn-ghost" onClick={() => navigate("/ngo/settings")}>
              ⚙ Settings
            </button>
          </div>
        </div>

        {/* Verification alert if not approved */}
        {verStatus === "draft" && (
          <div className="dash-alert dash-alert-warn">
            ⚠ Your NGO is not yet verified. Complete document submission in{" "}
            <span className="dash-alert-link" onClick={() => navigate("/ngo/settings")}>
              Settings → Verification Documents
            </span>{" "}
            to go live.
          </div>
        )}
        {verStatus === "rejected" && (
          <div className="dash-alert dash-alert-danger">
            ❌ Verification was rejected.
            {profile?.adminRemark && <strong> Reason: {profile.adminRemark}</strong>}
            &nbsp;
            <span className="dash-alert-link" onClick={() => navigate("/ngo/settings")}>
              Re-upload documents →
            </span>
          </div>
        )}

        {/* ══════════════════════════════════════════
            STAT CARDS
        ══════════════════════════════════════════ */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon stat-icon-green">💰</div>
            <h4>Total Raised</h4>
            <p>Rs. {totalRaised.toLocaleString()}</p>
            <span className="stat-sub">{overallPct}% of all goals</span>
          </div>

          <div className="stat-card">
            <div className="stat-icon stat-icon-blue">📁</div>
            <h4>Active Projects</h4>
            <p>{activeCount}</p>
            <span className="stat-sub">{completedCount} completed</span>
          </div>

          <div className="stat-card">
            <div className="stat-icon stat-icon-purple">🤝</div>
            <h4>Total Donors</h4>
            <p>{totalDonors}</p>
            <span className="stat-sub">across all projects</span>
          </div>

          <div className="stat-card">
            <div className="stat-icon stat-icon-gold">📊</div>
            <h4>Avg. Donation</h4>
            <p>Rs. {avgDonation.toLocaleString()}</p>
            <span className="stat-sub">per donor</span>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            TWO COLUMN LAYOUT
        ══════════════════════════════════════════ */}
        <div className="dash-columns">

          {/* LEFT — Funding overview */}
          <div className="dash-col-wide">
            <div className="dash-section-header">
              <h2>Project Funding Overview</h2>
              <button className="see-all-btn" onClick={() => navigate("/ngo/projects")}>
                See all →
              </button>
            </div>

            {recentProjects.length === 0 ? (
              <div className="dash-empty">
                <span>📭</span>
                <p>No projects yet.</p>
                <button className="hero-btn hero-btn-verify" onClick={() => navigate("/ngo/projects/create")}>
                  Create your first project
                </button>
              </div>
            ) : (
              recentProjects.map(project => {
                const pct = project.goalAmount > 0
                  ? Math.min(100, Math.round((project.raisedAmount / project.goalAmount) * 100))
                  : 0;
                return (
                  <div key={project._id} className="project-overview-card">
                    <div className="project-overview-header">
                      <div>
                        <h3>{project.title}</h3>
                        <span className={`status-badge ${project.status}`}>
                          {project.status === "under_review" ? "Under Review" : project.status}
                        </span>
                      </div>
                      <span className="pct-label">{pct}%</span>
                    </div>

                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>

                    <div className="project-meta-row">
                      <span>Rs. {(project.raisedAmount || 0).toLocaleString()} raised</span>
                      <span>of Rs. {(project.goalAmount || 0).toLocaleString()}</span>
                    </div>

                    <div className="project-meta-row" style={{ marginTop: 4 }}>
                      <span>👥 {project.donorCount || 0} donors</span>
                      <span>🗓 Ends {new Date(project.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT — NGO Info + top projects */}
          <div className="dash-col-narrow">

            {/* NGO details card */}
            <div className="info-card">
              <h3 className="info-card-title">Organisation Info</h3>
              <div className="info-rows">
                {[
                  ["Reg. Number",  profile?.registrationNumber],
                  ["Established",  profile?.establishedYear],
                  ["Website",      profile?.website],
                  ["Bank",         profile?.bankName],
                  ["Account",      profile?.accountNumber ? `****${profile.accountNumber.slice(-4)}` : null],
                ].map(([label, val]) => val ? (
                  <div key={label} className="info-row">
                    <span className="info-label">{label}</span>
                    <span className="info-val">{val}</span>
                  </div>
                ) : null)}
              </div>
            </div>

            {/* Top performing projects */}
            {topProjects.length > 0 && (
              <div className="info-card" style={{ marginTop: 16 }}>
                <h3 className="info-card-title">🏆 Top Projects</h3>
                {topProjects.map((p, i) => {
                  const pct = p.goalAmount > 0
                    ? Math.min(100, Math.round((p.raisedAmount / p.goalAmount) * 100))
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
                })}
              </div>
            )}

            {/* Account status card */}
            <div className="info-card" style={{ marginTop: 16 }}>
              <h3 className="info-card-title">Account Status</h3>
              <div className="account-status-row">
                <div className={`account-dot ${profile?.accountStatus === "active" ? "dot-active" : "dot-inactive"}`} />
                <span className="account-status-label">
                  {profile?.accountStatus === "active"
                    ? "Active — NGO is live"
                    : profile?.accountStatus === "paused"
                    ? "Paused — Projects hidden"
                    : "Deactivated"}
                </span>
              </div>
              <div className="account-meta">
                <span>Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" }) : "—"}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </NgoLayout>
  );
}

export default NGODashboard;