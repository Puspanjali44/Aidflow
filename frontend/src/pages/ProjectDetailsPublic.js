import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import DonorSidebar from "../components/DonorSidebar";
import DonateModal from "./DonateModal";
import "./ProjectDetailsPublic.css";

const BASE = "http://localhost:5000";
const API = `${BASE}/api`;

const fmt = (n) => Number(n || 0).toLocaleString("en-IN");
const imgUrl = (filename) => (filename ? `${BASE}/uploads/${filename}` : null);

const fmtDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const parseMoney = (value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "");
    return Number(cleaned || 0);
  }
  return 0;
};

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

const scoreLabel = (s) => {
  if (s >= 90) return "Excellent Transparency";
  if (s >= 70) return "Good Transparency";
  if (s >= 50) return "Fair Transparency";
  return "Low Transparency";
};

export default function ProjectDetailsPublic() {
  const { id } = useParams();

  const [project, setProject] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [donors, setDonors] = useState([]);
  const [wordsSupport, setWordsSupport] = useState([]);
  const [transparencyScore, setTransparencyScore] = useState(null);
  const [timeline, setTimeline] = useState([]);

  const [activeTab, setActiveTab] = useState("updates");
  const [imgModal, setImgModal] = useState(null);
  const [showDonate, setShowDonate] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProject = useCallback(async () => {
    try {
      const r = await fetch(`${API}/projects/${id}`);
      if (!r.ok) throw new Error();
      setProject(await r.json());
    } catch {
      setProject(null);
    }
  }, [id]);

  const fetchUpdates = useCallback(async () => {
    try {
      const r = await fetch(`${API}/updates/${id}`);
      if (!r.ok) return;
      const d = await r.json();
      setUpdates(Array.isArray(d) ? d : []);
    } catch {
      setUpdates([]);
    }
  }, [id]);

  const fetchDonors = useCallback(async () => {
    try {
      // fixed: same endpoint as NGO page
      const r = await fetch(`${API}/donations/project/${id}/donors`);
      if (!r.ok) return;
      const d = await r.json();
      setDonors(Array.isArray(d) ? d : []);
    } catch {
      setDonors([]);
    }
  }, [id]);

  const fetchWords = useCallback(async () => {
    try {
      // fixed: same endpoint as NGO page
      const r = await fetch(`${API}/donations/project/${id}/words-of-support`);
      if (!r.ok) return;
      const d = await r.json();
      setWordsSupport(Array.isArray(d) ? d : []);
    } catch {
      setWordsSupport([]);
    }
  }, [id]);

  const fetchTransparency = useCallback(async () => {
    try {
      const r = await fetch(`${API}/projects/${id}/transparency`);
      if (!r.ok) {
        setTransparencyScore(null);
        return;
      }
      setTransparencyScore(await r.json());
    } catch {
      setTransparencyScore(null);
    }
  }, [id]);

  const fetchTimeline = useCallback(async () => {
    try {
      const r = await fetch(`${API}/projects/${id}/timeline`);
      if (!r.ok) return;
      const d = await r.json();
      setTimeline(Array.isArray(d) ? d : []);
    } catch {
      setTimeline([]);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
    fetchUpdates();
    fetchDonors();
    fetchWords();
    fetchTransparency();
    fetchTimeline();
  }, [
    fetchProject,
    fetchUpdates,
    fetchDonors,
    fetchWords,
    fetchTransparency,
    fetchTimeline,
  ]);

  if (!project) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "#faf8f4" }}>
        <DonorSidebar />
        <div className="pdp-loading">
          <div className="pdp-spinner" />
          <span>Loading project…</span>
        </div>
      </div>
    );
  }

  const goalAmount = Number(project.goalAmount || 0);

  const donorRaisedAmount = donors.reduce(
    (sum, d) => sum + parseMoney(d.amountValue ?? d.amount ?? 0),
    0
  );

  const projectRaisedAmount = Number(project.raisedAmount || 0);

  const rawRaisedAmount =
    donorRaisedAmount > 0 ? donorRaisedAmount : projectRaisedAmount;

  const realRaisedAmount = clamp(rawRaisedAmount, 0, goalAmount);
  const remainingToGoal = Math.max(goalAmount - realRaisedAmount, 0);

  const realDonorCount =
    donors.length > 0 ? donors.length : Number(project.donorCount || 0);

  const lastDonationValue =
    donors.length > 0
      ? donors[0]?.ago || fmtDate(donors[0]?.createdAt)
      : project.lastDonation
      ? fmtDate(project.lastDonation)
      : "—";

  const progress =
    goalAmount > 0 ? clamp((realRaisedAmount / goalAmount) * 100, 0, 100) : 0;

  const totalExpenseUsedRaw = updates.reduce(
    (sum, u) => sum + Number(u.expenseUsed || 0),
    0
  );
  const totalExpenseUsed = clamp(totalExpenseUsedRaw, 0, realRaisedAmount);

  const proofPhotoCount = updates.reduce(
    (sum, u) => sum + (u.photos?.length || 0),
    0
  );

  const fundsUnused = Math.max(realRaisedAmount - totalExpenseUsed, 0);

  const computedTransparency = {
    raised: realRaisedAmount,
    used: totalExpenseUsed,
    remaining_to_goal: remainingToGoal,
    funds_unused: fundsUnused,
    donors: realDonorCount,
    updates_count: updates.length,
    proof_photos: proofPhotoCount,
    regular_updates: clamp(updates.length >= 5 ? 100 : updates.length * 20, 0, 100),
    expense_reports:
      realRaisedAmount > 0
        ? clamp(Math.round((totalExpenseUsed / realRaisedAmount) * 100), 0, 100)
        : 0,
    completion_reports:
      goalAmount > 0 ? clamp(Math.round(progress), 0, 100) : 0,
    donor_feedback:
      realDonorCount > 0
        ? clamp(Math.round((wordsSupport.length / realDonorCount) * 100), 0, 100)
        : 0,
  };

  const computedScore = Math.round(
    computedTransparency.regular_updates * 0.3 +
      computedTransparency.expense_reports * 0.3 +
      computedTransparency.completion_reports * 0.2 +
      computedTransparency.donor_feedback * 0.2
  );

  const ts = {
    ...computedTransparency,
    ...(transparencyScore || {}),
    score:
      transparencyScore?.score != null ? transparencyScore.score : computedScore,
    regular_updates:
      transparencyScore?.regular_updates != null
        ? transparencyScore.regular_updates
        : computedTransparency.regular_updates,
    expense_reports:
      transparencyScore?.expense_reports != null
        ? transparencyScore.expense_reports
        : computedTransparency.expense_reports,
    completion_reports:
      transparencyScore?.completion_reports != null
        ? transparencyScore.completion_reports
        : computedTransparency.completion_reports,
    donor_feedback:
      transparencyScore?.donor_feedback != null
        ? transparencyScore.donor_feedback
        : computedTransparency.donor_feedback,
    raised: computedTransparency.raised,
    used: computedTransparency.used,
    remaining_to_goal: computedTransparency.remaining_to_goal,
    funds_unused: computedTransparency.funds_unused,
    donors: computedTransparency.donors,
    updates_count: computedTransparency.updates_count,
    proof_photos: computedTransparency.proof_photos,
  };

  const heroSrc =
    (project.image ? imgUrl(project.image) : null) ||
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#faf8f4" }}>
      <DonorSidebar />

      <div className="pdp-root">
        {toast && <div className={`pdp-toast pdp-toast-${toast.type}`}>{toast.msg}</div>}

        <div className="pdp-hero-wrap">
          <img className="pdp-hero" src={heroSrc} alt={project.title} />
          <div className="pdp-hero-overlay" />

          <button
            className="pdp-hero-donate-btn"
            onClick={() => setShowDonate(true)}
            disabled={remainingToGoal <= 0}
            title={remainingToGoal <= 0 ? "Goal reached" : "Donate now"}
          >
            💜 {remainingToGoal <= 0 ? "Goal Reached" : "Donate Now"}
          </button>
        </div>

        <div className="pdp-body">
          <div className="pdp-left">
            <section className="pdp-card">
              <h1 className="pdp-title">{project.title}</h1>
              <p className="pdp-desc">{project.description}</p>

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

            <section className="pdp-card">
              <h2 className="pdp-section-title">Real-Time Fund Tracking</h2>

              <div className="pdp-fund-numbers">
                <span className="pdp-raised">NPR {fmt(realRaisedAmount)} raised</span>
                <span className="pdp-goal">NPR {fmt(goalAmount)} goal</span>
              </div>

              <div className="pdp-progress-track">
                <div className="pdp-progress-fill" style={{ width: `${progress}%` }} />
              </div>

              <p className="pdp-progress-pct">{Math.round(progress)}% Complete</p>

              <div className="pdp-stats-row">
                <StatChip icon="📈" label="Amount Raised" value={`NPR ${fmt(realRaisedAmount)}`} />
                <StatChip icon="🎯" label="Goal" value={`NPR ${fmt(goalAmount)}`} />
                <StatChip icon="💰" label="Remaining to Goal" value={`NPR ${fmt(remainingToGoal)}`} />
                <StatChip icon="👥" label="Donors" value={realDonorCount} />
              </div>
            </section>

            <div className="pdp-tabs">
              {[
                { key: "updates", label: "Project Updates", count: updates.length },
                { key: "timeline", label: "Project Timeline" },
                { key: "location", label: "Project Location" },
                { key: "words", label: "Words of Support", count: wordsSupport.length },
              ].map((t) => (
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

            {activeTab === "updates" && (
              <section className="pdp-tab-panel">
                {updates.length === 0 ? (
                  <p className="pdp-empty">No updates posted yet.</p>
                ) : (
                  updates.map((u) => (
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
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </section>
            )}

            {activeTab === "timeline" && (
              <section className="pdp-tab-panel">
                {timeline.length === 0 ? (
                  <p className="pdp-empty">No timeline events yet.</p>
                ) : (
                  <div className="pdp-timeline">
                    {timeline.map((t, i) => (
                      <div className={`pdp-tl-item ${t.done ? "done" : ""}`} key={i}>
                        <div className="pdp-tl-col">
                          <div className="pdp-tl-dot">{t.done ? "✓" : i + 1}</div>
                          {i < timeline.length - 1 && (
                            <div className={`pdp-tl-line ${t.done ? "done" : ""}`} />
                          )}
                        </div>
                        <div className="pdp-tl-content">
                          <span className="pdp-tl-label">{t.label}</span>
                          <span className="pdp-tl-date">{t.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeTab === "location" && (
              <section className="pdp-tab-panel">
                <div className="pdp-map-wrap">
                  {project.lat && project.lng ? (
                    <iframe
                      title="map"
                      className="pdp-map-iframe"
                      src={`https://maps.google.com/maps?q=${project.lat},${project.lng}&z=15&output=embed`}
                      allowFullScreen
                    />
                  ) : (
                    <div className="pdp-map-placeholder">📍 Location not set</div>
                  )}

                  <div className="pdp-map-footer">
                    <span>📍 {project.location || "Location not provided"}</span>
                    <button
                      className="pdp-btn-text"
                      onClick={() =>
                        window.open(
                          `https://maps.google.com/?q=${encodeURIComponent(project.location || "")}`,
                          "_blank"
                        )
                      }
                    >
                      Open in Maps ↗
                    </button>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "words" && (
              <section className="pdp-tab-panel">
                <p className="pdp-words-hint">Please donate to share words of support.</p>

                {wordsSupport.length === 0 ? (
                  <p className="pdp-empty">No words of support yet. Be the first!</p>
                ) : (
                  wordsSupport.map((w, i) => (
                    <div className="pdp-word-card" key={i}>
                      <div className="pdp-word-avatar">
                        {w.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="pdp-word-body">
                        <div className="pdp-word-meta">
                          <strong>{w.name}</strong>
                          <span>{w.amount} · {w.ago}</span>
                        </div>
                        <p>{w.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </section>
            )}
          </div>

          <aside className="pdp-sidebar">
            <div className="pdp-sidebar-card">
              <button
                className="pdp-btn-donate"
                onClick={() => setShowDonate(true)}
                disabled={remainingToGoal <= 0}
              >
                💜 {remainingToGoal <= 0 ? "Goal Reached" : "Donate Now"}
              </button>

              <button
                className="pdp-btn-share"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  showToast("Link copied!");
                }}
              >
                🔗 Share This Project
              </button>
            </div>

            <div className="pdp-sidebar-card">
              <h3 className="pdp-sidebar-title">Transparency Score</h3>

              <div className="pdp-ts-main">
                <ScoreRing score={ts.score || 0} />
                <div>
                  <strong className="pdp-ts-label">{scoreLabel(ts.score || 0)}</strong>
                  <p className="pdp-ts-sub">
                    Based on real donors, updates, expenses, and proof uploaded
                  </p>
                </div>
              </div>

              <div className="pdp-ts-bars">
                <TsBar label="Regular Updates" value={ts.regular_updates || 0} />
                <TsBar label="Expense Reports" value={ts.expense_reports || 0} />
                <TsBar label="Completion Reports" value={ts.completion_reports || 0} />
                <TsBar label="Donor Feedback" value={ts.donor_feedback || 0} />
              </div>

              <div className="pdp-ts-summary">
                <div className="pdp-ts-summary-row">
                  <span>Raised</span>
                  <strong>NPR {fmt(ts.raised)}</strong>
                </div>
                <div className="pdp-ts-summary-row">
                  <span>Used in Updates</span>
                  <strong>NPR {fmt(ts.used)}</strong>
                </div>
                <div className="pdp-ts-summary-row">
                  <span>Funds Unused</span>
                  <strong>NPR {fmt(ts.funds_unused)}</strong>
                </div>
                <div className="pdp-ts-summary-row">
                  <span>Remaining to Goal</span>
                  <strong>NPR {fmt(ts.remaining_to_goal)}</strong>
                </div>
                <div className="pdp-ts-summary-row">
                  <span>Total Donors</span>
                  <strong>{ts.donors}</strong>
                </div>
                <div className="pdp-ts-summary-row">
                  <span>Total Updates</span>
                  <strong>{ts.updates_count}</strong>
                </div>
                <div className="pdp-ts-summary-row">
                  <span>Proof Photos</span>
                  <strong>{ts.proof_photos}</strong>
                </div>
              </div>
            </div>

            <div className="pdp-sidebar-card">
              <div className="pdp-donors-header">
                <h3 className="pdp-sidebar-title">Recent Donors</h3>
                <span className="pdp-donors-count">💜 {realDonorCount} donations</span>
              </div>

              {donors.length === 0 ? (
                <p className="pdp-empty">No donors yet — be the first!</p>
              ) : (
                donors.slice(0, 5).map((d, i) => (
                  <div className="pdp-donor-row" key={i}>
                    <div className="pdp-donor-avatar">
                      {d.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="pdp-donor-name">{d.name}</p>
                      <p className="pdp-donor-amt">{d.amount} · {d.ago}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>

        {imgModal && (
          <div className="pdp-modal-backdrop" onClick={() => setImgModal(null)}>
            <div className="pdp-modal" onClick={(e) => e.stopPropagation()}>
              <button className="pdp-modal-close" onClick={() => setImgModal(null)}>
                ✕
              </button>

              <img
                className="pdp-modal-img"
                src={imgUrl(imgModal.photos[imgModal.idx])}
                alt=""
              />

              {imgModal.photos.length > 1 && (
                <div className="pdp-modal-nav">
                  <button
                    onClick={() =>
                      setImgModal((m) => ({
                        ...m,
                        idx: (m.idx - 1 + m.photos.length) % m.photos.length,
                      }))
                    }
                  >
                    ‹
                  </button>
                  <span>
                    {imgModal.idx + 1} / {imgModal.photos.length}
                  </span>
                  <button
                    onClick={() =>
                      setImgModal((m) => ({
                        ...m,
                        idx: (m.idx + 1) % m.photos.length,
                      }))
                    }
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {showDonate && project && (
          <DonateModal
            project={{
              ...project,
              raisedAmount: realRaisedAmount,
            }}
            onClose={() => {
              setShowDonate(false);
              fetchProject();
              fetchDonors();
              fetchWords();
              fetchTimeline();
              fetchTransparency();
              fetchUpdates();
            }}
          />
        )}
      </div>
    </div>
  );
}

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
  const safeScore = clamp(Number(score || 0), 0, 100);
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (safeScore / 100) * circ;

  return (
    <div className="pdp-score-ring">
      <svg width="96" height="96" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#e8f5e9"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#2e7d32"
          strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
      </svg>
      <span className="pdp-score-num">{safeScore}%</span>
    </div>
  );
}

function TsBar({ label, value }) {
  const safeValue = clamp(Number(value || 0), 0, 100);

  return (
    <div className="pdp-ts-bar-row">
      <span className="pdp-ts-bar-label">{label}</span>
      <span className="pdp-ts-bar-pct">{safeValue}%</span>
      <div className="pdp-ts-track">
        <div className="pdp-ts-fill" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}