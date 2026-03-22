import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import DonorSidebar from "../components/DonorSidebar";
import DonateModal from "./DonateModal";
import "./ProjectDetailsPublic.css";

const BASE = "http://localhost:5000";
const API  = `${BASE}/api`;

const fmt    = (n)        => Number(n || 0).toLocaleString("en-IN");
const imgUrl = (filename) => filename ? `${BASE}/uploads/${filename}` : null;
const fmtDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};
const scoreLabel = (s) => {
  if (s >= 90) return "Excellent Transparency";
  if (s >= 70) return "Good Transparency";
  if (s >= 50) return "Fair Transparency";
  return "Low Transparency";
};

export default function ProjectDetailsPublic() {
  const { id } = useParams();

  const [project,           setProject]           = useState(null);
  const [updates,           setUpdates]           = useState([]);
  const [donors,            setDonors]            = useState([]);
  const [wordsSupport,      setWordsSupport]      = useState([]);
  const [transparencyScore, setTransparencyScore] = useState(null);
  const [timeline,          setTimeline]          = useState([]);

  const [activeTab,    setActiveTab]    = useState("updates");
  const [imgModal,     setImgModal]     = useState(null);
  const [showDonate,   setShowDonate]   = useState(false);
  const [toast,        setToast]        = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProject = useCallback(async () => {
    try {
      const r = await fetch(`${API}/projects/${id}`);
      if (!r.ok) throw new Error();
      setProject(await r.json());
    } catch { }
  }, [id]);

  const fetchUpdates = useCallback(async () => {
    try {
      const r = await fetch(`${API}/updates/${id}`);
      if (!r.ok) return;
      const d = await r.json();
      setUpdates(Array.isArray(d) ? d : []);
    } catch { setUpdates([]); }
  }, [id]);

  const fetchDonors = useCallback(async () => {
    try {
      const r = await fetch(`${API}/projects/${id}/donors`);
      if (!r.ok) return;
      setDonors(await r.json());
    } catch { setDonors([]); }
  }, [id]);

  const fetchWords = useCallback(async () => {
    try {
      const r = await fetch(`${API}/projects/${id}/words-of-support`);
      if (!r.ok) return;
      setWordsSupport(await r.json());
    } catch { setWordsSupport([]); }
  }, [id]);

  const fetchTransparency = useCallback(async () => {
    try {
      const r = await fetch(`${API}/projects/${id}/transparency`);
      if (!r.ok) return;
      setTransparencyScore(await r.json());
    } catch { setTransparencyScore(null); }
  }, [id]);

  const fetchTimeline = useCallback(async () => {
    try {
      const r = await fetch(`${API}/projects/${id}/timeline`);
      if (!r.ok) return;
      setTimeline(await r.json());
    } catch { setTimeline([]); }
  }, [id]);

  useEffect(() => {
    fetchProject();
    fetchUpdates();
    fetchDonors();
    fetchWords();
    fetchTransparency();
    fetchTimeline();
  }, [fetchProject, fetchUpdates, fetchDonors, fetchWords, fetchTransparency, fetchTimeline]);

  if (!project) return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#faf8f4" }}>
      <DonorSidebar />
      <div className="pdp-loading"><div className="pdp-spinner" /><span>Loading project…</span></div>
    </div>
  );

  const progress = Math.min(100, ((project.raisedAmount || 0) / (project.goalAmount || 1)) * 100);
  const ts = transparencyScore || { score: 92, regular_updates: 95, expense_reports: 90, completion_reports: 88, donor_feedback: 94 };
  const heroSrc = (project.image ? imgUrl(project.image) : null)
    || "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#faf8f4" }}>
      <DonorSidebar />

      <div className="pdp-root">

        {toast && <div className={`pdp-toast pdp-toast-${toast.type}`}>{toast.msg}</div>}

        {/* HERO */}
        <div className="pdp-hero-wrap">
          <img className="pdp-hero" src={heroSrc} alt={project.title} />
          <div className="pdp-hero-overlay" />

          {/* Floating donate button on hero */}
          <button className="pdp-hero-donate-btn" onClick={() => setShowDonate(true)}>
            💜 Donate Now
          </button>
        </div>

        {/* BODY */}
        <div className="pdp-body">

          {/* LEFT */}
          <div className="pdp-left">

            {/* TITLE */}
            <section className="pdp-card">
              <h1 className="pdp-title">{project.title}</h1>
              <p className="pdp-desc">{project.description}</p>
              {/* NGO info */}
              {project.ngo && (
                <div className="pdp-ngo-row">
                  <div className="pdp-ngo-avatar">
                    {project.ngo.organizationName?.[0]?.toUpperCase() || "N"}
                  </div>
                  <div>
                    <p className="pdp-ngo-name">{project.ngo.organizationName}</p>
                    <p className="pdp-ngo-cat">{project.ngo.category || "Non-Profit"}</p>
                  </div>
                  <span className="pdp-verified-badge">✓ Verified</span>
                </div>
              )}
            </section>

            {/* FUND TRACKING */}
            <section className="pdp-card">
              <h2 className="pdp-section-title">Real-Time Fund Tracking</h2>
              <div className="pdp-fund-numbers">
                <span className="pdp-raised">NPR {fmt(project.raisedAmount)} raised</span>
                <span className="pdp-goal">NPR {fmt(project.goalAmount)} goal</span>
              </div>
              <div className="pdp-progress-track">
                <div className="pdp-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <p className="pdp-progress-pct">{Math.round(progress)}% Complete</p>
              <div className="pdp-stats-row">
                <StatChip icon="📈" label="Amount Raised" value={`NPR ${fmt(project.raisedAmount)}`} />
                <StatChip icon="🎯" label="Goal"          value={`NPR ${fmt(project.goalAmount)}`} />
                <StatChip icon="👥" label="Donors"        value={project.donorCount || 0} />
                <StatChip icon="🕐" label="Last Donation" value={project.lastDonation || "—"} />
              </div>
            </section>

            {/* TABS */}
            <div className="pdp-tabs">
              {[
                { key: "updates",  label: "Project Updates",  count: updates.length },
                { key: "timeline", label: "Project Timeline" },
                { key: "location", label: "Project Location" },
                { key: "words",    label: "Words of Support", count: wordsSupport.length },
              ].map(t => (
                <button
                  key={t.key}
                  className={`pdp-tab ${activeTab === t.key ? "active" : ""}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.label}
                  {t.count > 0 && <span className="pdp-tab-badge">{t.count}</span>}
                </button>
              ))}
            </div>

            {/* UPDATES */}
            {activeTab === "updates" && (
              <section className="pdp-tab-panel">
                {updates.length === 0
                  ? <p className="pdp-empty">No updates posted yet.</p>
                  : updates.map(u => (
                    <div className="pdp-update-card" key={u._id}>
                      <div className="pdp-update-header">
                        <div>
                          <h3 className="pdp-update-title">{u.title}</h3>
                          <span className="pdp-update-meta">Organizer</span>
                        </div>
                        <span className="pdp-update-date">📅 {fmtDate(u.createdAt)}</span>
                      </div>
                      <p className="pdp-update-body">{u.description}</p>
                      {Number(u.expenseUsed) > 0 && (
                        <div className="pdp-expense-tag">
                          🔥 NPR {fmt(u.expenseUsed)} used for {u.expenseCategory}
                        </div>
                      )}
                      {u.photos?.length > 0 && (
                        <div className="pdp-photo-grid">
                          {u.photos.map((p, i) => (
                            <img
                              key={p}
                              src={imgUrl(p)}
                              alt={`photo-${i + 1}`}
                              className="pdp-photo-thumb"
                              onClick={() => setImgModal({ photos: u.photos, idx: i })}
                              onError={e => { e.target.style.display = "none"; }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                }
              </section>
            )}

            {/* TIMELINE */}
            {activeTab === "timeline" && (
              <section className="pdp-tab-panel">
                {timeline.length === 0
                  ? <p className="pdp-empty">No timeline events yet.</p>
                  : <div className="pdp-timeline">
                      {timeline.map((t, i) => (
                        <div className={`pdp-tl-item ${t.done ? "done" : ""}`} key={i}>
                          <div className="pdp-tl-col">
                            <div className="pdp-tl-dot">{t.done ? "✓" : i + 1}</div>
                            {i < timeline.length - 1 && <div className={`pdp-tl-line ${t.done ? "done" : ""}`} />}
                          </div>
                          <div className="pdp-tl-content">
                            <span className="pdp-tl-label">{t.label}</span>
                            <span className="pdp-tl-date">{t.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                }
              </section>
            )}

            {/* LOCATION */}
            {activeTab === "location" && (
              <section className="pdp-tab-panel">
                <div className="pdp-map-wrap">
                  {project.lat && project.lng
                    ? <iframe
                        title="map"
                        className="pdp-map-iframe"
                        src={`https://maps.google.com/maps?q=${project.lat},${project.lng}&z=15&output=embed`}
                        allowFullScreen
                      />
                    : <div className="pdp-map-placeholder">📍 Location not set</div>
                  }
                  <div className="pdp-map-footer">
                    <span>📍 {project.location || "Location not provided"}</span>
                    <button
                      className="pdp-btn-text"
                      onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(project.location || "")}`, "_blank")}
                    >
                      Open in Maps ↗
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* WORDS OF SUPPORT */}
            {activeTab === "words" && (
              <section className="pdp-tab-panel">
                <p className="pdp-words-hint">Please donate to share words of support.</p>
                {wordsSupport.length === 0
                  ? <p className="pdp-empty">No words of support yet. Be the first!</p>
                  : wordsSupport.map((w, i) => (
                    <div className="pdp-word-card" key={i}>
                      <div className="pdp-word-avatar">{w.name?.[0]?.toUpperCase() || "?"}</div>
                      <div className="pdp-word-body">
                        <div className="pdp-word-meta">
                          <strong>{w.name}</strong>
                          <span>{w.amount} · {w.ago}</span>
                        </div>
                        <p>{w.message}</p>
                      </div>
                    </div>
                  ))
                }
              </section>
            )}

          </div>{/* /left */}

          {/* SIDEBAR */}
          <aside className="pdp-sidebar">

            {/* DONATE CARD */}
            <div className="pdp-sidebar-card">
              <button className="pdp-btn-donate" onClick={() => setShowDonate(true)}>
                💜 Donate Now
              </button>
              <button
                className="pdp-btn-share"
                onClick={() => { navigator.clipboard.writeText(window.location.href); showToast("Link copied!"); }}
              >
                🔗 Share This Project
              </button>
            </div>

            {/* TRANSPARENCY */}
            <div className="pdp-sidebar-card">
              <h3 className="pdp-sidebar-title">Transparency Score</h3>
              <div className="pdp-ts-main">
                <ScoreRing score={ts.score} />
                <div>
                  <strong className="pdp-ts-label">{scoreLabel(ts.score)}</strong>
                  <p className="pdp-ts-sub">This project scores high on all transparency metrics</p>
                </div>
              </div>
              <div className="pdp-ts-bars">
                <TsBar label="Regular Updates"    value={ts.regular_updates    || 0} />
                <TsBar label="Expense Reports"    value={ts.expense_reports    || 0} />
                <TsBar label="Completion Reports" value={ts.completion_reports || 0} />
                <TsBar label="Donor Feedback"     value={ts.donor_feedback     || 0} />
              </div>
            </div>

            {/* RECENT DONORS */}
            <div className="pdp-sidebar-card">
              <div className="pdp-donors-header">
                <h3 className="pdp-sidebar-title">Recent Donors</h3>
                <span className="pdp-donors-count">💜 {donors.length} donations</span>
              </div>
              {donors.length === 0
                ? <p className="pdp-empty">No donors yet — be the first!</p>
                : donors.slice(0, 5).map((d, i) => (
                  <div className="pdp-donor-row" key={i}>
                    <div className="pdp-donor-avatar">{d.name?.[0]?.toUpperCase() || "?"}</div>
                    <div>
                      <p className="pdp-donor-name">{d.name}</p>
                      <p className="pdp-donor-amt">{d.amount} · {d.ago}</p>
                    </div>
                  </div>
                ))
              }
            </div>

          </aside>
        </div>{/* /body */}

        {/* LIGHTBOX */}
        {imgModal && (
          <div className="pdp-modal-backdrop" onClick={() => setImgModal(null)}>
            <div className="pdp-modal" onClick={e => e.stopPropagation()}>
              <button className="pdp-modal-close" onClick={() => setImgModal(null)}>✕</button>
              <img className="pdp-modal-img" src={imgUrl(imgModal.photos[imgModal.idx])} alt="" />
              {imgModal.photos.length > 1 && (
                <div className="pdp-modal-nav">
                  <button onClick={() => setImgModal(m => ({ ...m, idx: (m.idx - 1 + m.photos.length) % m.photos.length }))}>‹</button>
                  <span>{imgModal.idx + 1} / {imgModal.photos.length}</span>
                  <button onClick={() => setImgModal(m => ({ ...m, idx: (m.idx + 1) % m.photos.length }))}>›</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DONATE MODAL */}
        {showDonate && project && (
          <DonateModal
            project={project}
            onClose={() => {
              setShowDonate(false);
              fetchProject();
              fetchDonors();
            }}
          />
        )}

      </div>{/* /pdp-root */}
    </div>
  );
}

/* ── Sub-components ── */
function StatChip({ icon, label, value }) {
  return (
    <div className="pdp-stat-chip">
      <span className="pdp-stat-icon">{icon}</span>
      <span className="pdp-stat-label">{label}</span>
      <strong className="pdp-stat-value">{value}</strong>
    </div>
  );
}

function ScoreRing({ score }) {
  const r = 36, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="pdp-score-ring">
      <svg width="96" height="96" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e8f5e9" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="#2e7d32" strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 50 50)" />
      </svg>
      <span className="pdp-score-num">{score}%</span>
    </div>
  );
}

function TsBar({ label, value }) {
  return (
    <div className="pdp-ts-bar-row">
      <span className="pdp-ts-bar-label">{label}</span>
      <span className="pdp-ts-bar-pct">{value}%</span>
      <div className="pdp-ts-track"><div className="pdp-ts-fill" style={{ width: `${value}%` }} /></div>
    </div>
  );
}
