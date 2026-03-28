import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import NgoLayout from "../components/NgoLayout";
import DonateModal from "./DonateModal";
import "./ProjectDetails.css";

const BASE = "http://localhost:5000";
const API = `${BASE}/api`;

const fmt = (n) => Number(n || 0).toLocaleString("en-IN");
const getToken = () => localStorage.getItem("token");
const getRole = () => localStorage.getItem("role");
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

export default function ProjectDetails() {
  const { id } = useParams();
  const isNGO = getRole() === "ngo";
  const heroRef = useRef();

  const [project, setProject] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [donors, setDonors] = useState([]);
  const [impactReport, setImpactReport] = useState(null);
  const [wordsSupport, setWordsSupport] = useState([]);
  const [transparencyScore, setTransparencyScore] = useState(null);

  const [activeTab, setActiveTab] = useState("updates");
  const [imgModal, setImgModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [showDonate, setShowDonate] = useState(false);

  const [editingProject, setEditingProject] = useState(false);
  const [projectEdit, setProjectEdit] = useState({
    title: "",
    description: "",
    goalAmount: "",
  });
  const [heroPreview, setHeroPreview] = useState(null);
  const [heroFile, setHeroFile] = useState(null);

  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [editingUpdateId, setEditingUpdateId] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    title: "",
    description: "",
    expenseUsed: "",
    expenseCategory: "",
    photos: [],
  });

  const [showTimelineForm, setShowTimelineForm] = useState(false);
  const [timelineForm, setTimelineForm] = useState({
    label: "",
    date: "",
    done: false,
  });

  const [locationForm, setLocationForm] = useState({
    location: "",
    lat: "",
    lng: "",
  });

  const [impactForm, setImpactForm] = useState({
    beneficiaries: "",
    testimonials: "",
    pdf: null,
    photos: [],
  });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const fetchProject = useCallback(async () => {
    try {
      const r = await fetch(`${API}/projects/${id}`);
      if (!r.ok) throw new Error();
      const d = await r.json();

      setProject(d);
      setProjectEdit({
        title: d.title,
        description: d.description,
        goalAmount: d.goalAmount,
      });
      setLocationForm({
        location: d.location || "",
        lat: d.lat || "",
        lng: d.lng || "",
      });
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

  const fetchDonors = useCallback(async () => {
    try {
      const r = await fetch(`${API}/donations/project/${id}/donors`);
      if (!r.ok) return;
      const d = await r.json();
      setDonors(Array.isArray(d) ? d : []);
    } catch {
      setDonors([]);
    }
  }, [id]);

  const fetchImpact = useCallback(async () => {
    try {
      const r = await fetch(`${API}/projects/${id}/impact`);
      if (!r.ok) return;
      setImpactReport(await r.json());
    } catch {
      setImpactReport(null);
    }
  }, [id]);

  const fetchWords = useCallback(async () => {
    try {
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

  useEffect(() => {
    fetchProject();
    fetchUpdates();
    fetchTimeline();
    fetchDonors();
    fetchImpact();
    fetchWords();
    fetchTransparency();
  }, [
    fetchProject,
    fetchUpdates,
    fetchTimeline,
    fetchDonors,
    fetchImpact,
    fetchWords,
    fetchTransparency,
  ]);

  const saveProjectEdit = async () => {
    try {
      const r = await fetch(`${API}/projects/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          title: projectEdit.title,
          description: projectEdit.description,
          goalAmount: Number(projectEdit.goalAmount),
        }),
      });

      if (!r.ok) throw new Error((await r.json()).message || "Failed");

      setEditingProject(false);
      fetchProject();
      showToast("Project updated!");
    } catch (e) {
      showToast(e.message || "Error saving project", "error");
    }
  };

  const handleHeroPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroFile(file);
    setHeroPreview(URL.createObjectURL(file));
  };

  const saveHeroOnly = async () => {
    if (!heroFile) return;

    try {
      const fd = new FormData();
      fd.append("image", heroFile);

      const r = await fetch(`${API}/projects/${id}/image`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });

      if (!r.ok) throw new Error((await r.json()).message || "Failed");

      setHeroFile(null);
      setHeroPreview(null);
      fetchProject();
      showToast("Cover photo updated!");
    } catch (e) {
      showToast(e.message || "Error updating cover photo", "error");
    }
  };

  const handleUpdateSubmit = async () => {
    if (!updateForm.title.trim()) {
      showToast("Title is required", "error");
      return;
    }

    try {
      const fd = new FormData();
      fd.append("projectId", id);
      fd.append("title", updateForm.title);
      fd.append("description", updateForm.description);
      fd.append("expenseUsed", updateForm.expenseUsed || 0);
      fd.append("expenseCategory", updateForm.expenseCategory);
      updateForm.photos.forEach((f) => fd.append("photos", f));

      const url = editingUpdateId
        ? `${API}/updates/${editingUpdateId}`
        : `${API}/updates/add`;
      const method = editingUpdateId ? "PUT" : "POST";

      const r = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });

      if (!r.ok) throw new Error((await r.json()).message || "Failed");

      resetUpdateForm();
      fetchUpdates();
      fetchTransparency();
      fetchImpact();
      showToast(editingUpdateId ? "Update saved!" : "Update posted!");
    } catch (e) {
      showToast(e.message || "Error submitting", "error");
    }
  };

  const handleTimelineSubmit = async () => {
    if (!timelineForm.label.trim()) {
      showToast("Timeline label is required", "error");
      return;
    }

    try {
      const r = await fetch(`${API}/projects/${id}/timeline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          label: timelineForm.label,
          date: timelineForm.date,
          done: timelineForm.done,
        }),
      });

      if (!r.ok) throw new Error((await r.json()).message || "Failed");

      setTimelineForm({ label: "", date: "", done: false });
      setShowTimelineForm(false);
      fetchTimeline();
      showToast("Timeline item added!");
    } catch (e) {
      showToast(e.message || "Error saving timeline", "error");
    }
  };

  const handleLocationSave = async () => {
    try {
      const r = await fetch(`${API}/projects/${id}/location`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          location: locationForm.location,
          lat: locationForm.lat !== "" ? Number(locationForm.lat) : null,
          lng: locationForm.lng !== "" ? Number(locationForm.lng) : null,
        }),
      });

      if (!r.ok) throw new Error((await r.json()).message || "Failed");

      fetchProject();
      showToast("Project location updated!");
    } catch (e) {
      showToast(e.message || "Error saving location", "error");
    }
  };

  const handleImpactSubmit = async () => {
    try {
      const fd = new FormData();
      fd.append("beneficiaries", impactForm.beneficiaries || "");
      fd.append("testimonials", impactForm.testimonials || "");

      if (impactForm.pdf) {
        fd.append("pdf", impactForm.pdf);
      }

      impactForm.photos.forEach((file) => fd.append("photos", file));

      const r = await fetch(`${API}/projects/${id}/impact`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: fd,
      });

      if (!r.ok) throw new Error((await r.json()).message || "Failed");

      setImpactForm({
        beneficiaries: "",
        testimonials: "",
        pdf: null,
        photos: [],
      });

      fetchImpact();
      fetchTransparency();
      showToast("Impact report uploaded!");
    } catch (e) {
      showToast(e.message || "Error uploading impact report", "error");
    }
  };

  const deleteUpdate = async (uid) => {
    if (!window.confirm("Delete this update? This cannot be undone.")) return;

    try {
      const r = await fetch(`${API}/updates/${uid}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (!r.ok) throw new Error((await r.json()).message || "Failed");

      fetchUpdates();
      fetchTransparency();
      showToast("Update deleted.");
    } catch (e) {
      showToast(e.message || "Error deleting", "error");
    }
  };

  const startEditUpdate = (u) => {
    setShowUpdateForm(true);
    setEditingUpdateId(u._id);
    setUpdateForm({
      title: u.title,
      description: u.description,
      expenseUsed: u.expenseUsed || "",
      expenseCategory: u.expenseCategory || "",
      photos: [],
    });

    setTimeout(() => {
      document
        .querySelector(".pd-update-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  const resetUpdateForm = () => {
    setShowUpdateForm(false);
    setEditingUpdateId(null);
    setUpdateForm({
      title: "",
      description: "",
      expenseUsed: "",
      expenseCategory: "",
      photos: [],
    });
  };

  if (!project) {
    return (
      <div className="pd-loading">
        <div className="pd-spinner" />
        <span>Loading project…</span>
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
    heroPreview ||
    (project.image ? imgUrl(project.image) : null) ||
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80";

  return (
    <NgoLayout>
      <div className="pd-root">
        {toast && (
          <div className={`pd-toast pd-toast-${toast.type}`}>{toast.msg}</div>
        )}

        <div className="pd-hero-wrap">
          <img className="pd-hero" src={heroSrc} alt={project.title} />
          <div className="pd-hero-overlay" />

          {isNGO && (
            <>
              <button
                className="pd-hero-change-btn"
                onClick={() => heroRef.current?.click()}
              >
                <CameraIcon /> Change Cover Photo
              </button>
              <input
                ref={heroRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleHeroPick}
              />
            </>
          )}

          {heroPreview && (
            <div className="pd-hero-save-bar">
              <span>New cover photo selected — save to apply</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="pd-hero-save-confirm"
                  onClick={saveHeroOnly}
                >
                  Save Photo
                </button>
                <button
                  className="pd-hero-save-cancel"
                  onClick={() => {
                    setHeroPreview(null);
                    setHeroFile(null);
                  }}
                >
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="pd-body">
          <div className="pd-left">
            <section className="pd-title-block">
              {editingProject ? (
                <div className="pd-edit-project-form">
                  <label>Project Title</label>
                  <input
                    value={projectEdit.title}
                    onChange={(e) =>
                      setProjectEdit({
                        ...projectEdit,
                        title: e.target.value,
                      })
                    }
                    placeholder="Project title"
                  />

                  <label>Description</label>
                  <textarea
                    rows={4}
                    value={projectEdit.description}
                    onChange={(e) =>
                      setProjectEdit({
                        ...projectEdit,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe the project…"
                  />

                  <label>Goal Amount (₹)</label>
                  <input
                    type="number"
                    value={projectEdit.goalAmount}
                    onChange={(e) =>
                      setProjectEdit({
                        ...projectEdit,
                        goalAmount: e.target.value,
                      })
                    }
                  />

                  <div className="pd-edit-actions">
                    <button className="pd-btn-primary" onClick={saveProjectEdit}>
                      💾 Save Changes
                    </button>
                    <button
                      className="pd-btn-ghost"
                      onClick={() => {
                        setEditingProject(false);
                        setHeroPreview(null);
                        setHeroFile(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="pd-title">{project.title}</h1>
                  <p className="pd-desc">{project.description}</p>
                  {isNGO && (
                    <button
                      className="pd-btn-outline"
                      onClick={() => setEditingProject(true)}
                    >
                      ✏️ Edit Project
                    </button>
                  )}
                </>
              )}
            </section>

            {(project.adminVerified ||
              project.docsApproved ||
              project.bankVerified) && (
              <div className="pd-verified">
                <div className="pd-verified-top">
                  <span>🛡️</span>
                  <strong className="pd-verified-text">
                    ✓ Verified Organization
                  </strong>
                </div>
                <div className="pd-badges">
                  {project.adminVerified && (
                    <span className="pd-badge">✅ Admin Verified</span>
                  )}
                  {project.docsApproved && (
                    <span className="pd-badge">✅ Documents Approved</span>
                  )}
                  {project.bankVerified && (
                    <span className="pd-badge">🏦 Bank Account Verified</span>
                  )}
                </div>
              </div>
            )}

            <section className="pd-fund-card">
              <h2 className="pd-section-title">Real-Time Fund Tracking</h2>

              <div className="pd-fund-numbers">
                <span className="pd-raised">₹{fmt(realRaisedAmount)} raised</span>
                <span className="pd-goal">₹{fmt(goalAmount)} goal</span>
              </div>

              <div className="pd-progress-track">
                <div
                  className="pd-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="pd-progress-pct">{Math.round(progress)}% Complete</p>

              <div className="pd-stats-row">
                <StatChip
                  icon="📈"
                  label="Amount Raised"
                  value={`₹${fmt(realRaisedAmount)}`}
                />
                <StatChip
                  icon="🎯"
                  label="Goal"
                  value={`₹${fmt(goalAmount)}`}
                />
                <StatChip
                  icon="💰"
                  label="Remaining to Goal"
                  value={`₹${fmt(remainingToGoal)}`}
                />
                <StatChip
                  icon="👥"
                  label="Donors"
                  value={realDonorCount}
                />
              </div>
            </section>

            <section className="pd-approval-card">
              <h2 className="pd-section-title">Admin Approval Status</h2>
              <ApprovalStepper
                status={project.status || "draft"}
                message={project.statusMessage}
              />
            </section>

            <div className="pd-tabs">
              {[
                { key: "updates", label: "Project Updates", count: updates.length },
                { key: "timeline", label: "Project Timeline" },
                { key: "location", label: "Project Location" },
                { key: "impact", label: "Impact Report" },
                {
                  key: "words",
                  label: "Words of Support",
                  count: wordsSupport.length,
                },
              ].map((t) => (
                <button
                  key={t.key}
                  className={`pd-tab ${activeTab === t.key ? "active" : ""}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.label}
                  {t.count > 0 && <span className="pd-tab-badge">{t.count}</span>}
                </button>
              ))}
            </div>

            {activeTab === "updates" && (
              <section className="pd-tab-panel">
                {isNGO && !showUpdateForm && (
                  <button
                    className="pd-btn-primary pd-mb16"
                    onClick={() => {
                      resetUpdateForm();
                      setShowUpdateForm(true);
                    }}
                  >
                    + Add Update
                  </button>
                )}

                {showUpdateForm && (
                  <div className="pd-update-form">
                    <h3>{editingUpdateId ? "✏️ Edit Update" : "📝 New Update"}</h3>

                    <label>Title *</label>
                    <input
                      placeholder="e.g. Foundation Completed"
                      value={updateForm.title}
                      onChange={(e) =>
                        setUpdateForm({ ...updateForm, title: e.target.value })
                      }
                    />

                    <label>Description</label>
                    <textarea
                      rows={4}
                      placeholder="What was accomplished…"
                      value={updateForm.description}
                      onChange={(e) =>
                        setUpdateForm({
                          ...updateForm,
                          description: e.target.value,
                        })
                      }
                    />

                    <div className="pd-form-row">
                      <div>
                        <label>Expense Used (₹)</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={updateForm.expenseUsed}
                          onChange={(e) =>
                            setUpdateForm({
                              ...updateForm,
                              expenseUsed: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <label>Category</label>
                        <select
                          value={updateForm.expenseCategory}
                          onChange={(e) =>
                            setUpdateForm({
                              ...updateForm,
                              expenseCategory: e.target.value,
                            })
                          }
                        >
                          <option value="">Select Category</option>
                          <option>Materials</option>
                          <option>Labor</option>
                          <option>Transport</option>
                          <option>Equipment</option>
                          <option>Medical</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>

                    <label>Photos (up to 5)</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) =>
                        setUpdateForm({
                          ...updateForm,
                          photos: Array.from(e.target.files || []),
                        })
                      }
                    />

                    {updateForm.photos.length > 0 && (
                      <div className="pd-photo-preview-row">
                        {updateForm.photos.map((f, i) => (
                          <img
                            key={i}
                            src={URL.createObjectURL(f)}
                            alt=""
                            className="pd-photo-thumb"
                          />
                        ))}
                      </div>
                    )}

                    <div className="pd-form-actions">
                      <button
                        className="pd-btn-primary"
                        onClick={handleUpdateSubmit}
                      >
                        {editingUpdateId ? "💾 Save Changes" : "🚀 Submit Update"}
                      </button>
                      <button className="pd-btn-ghost" onClick={resetUpdateForm}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="pd-updates-list">
                  {updates.length === 0 && (
                    <p className="pd-empty">No updates posted yet.</p>
                  )}
                  {updates.map((u) => (
                    <UpdateCard
                      key={u._id}
                      update={u}
                      isNGO={isNGO}
                      onEdit={startEditUpdate}
                      onDelete={deleteUpdate}
                      onOpenPhoto={(photos, idx) => setImgModal({ photos, idx })}
                    />
                  ))}
                </div>
              </section>
            )}

            {activeTab === "timeline" && (
              <section className="pd-tab-panel">
                {isNGO && !showTimelineForm && (
                  <button
                    className="pd-btn-primary pd-mb16"
                    onClick={() => setShowTimelineForm(true)}
                  >
                    + Add Timeline
                  </button>
                )}

                {isNGO && showTimelineForm && (
                  <div className="pd-update-form">
                    <h3>🗓️ New Timeline Item</h3>

                    <label>Label *</label>
                    <input
                      placeholder="e.g. Materials Purchased"
                      value={timelineForm.label}
                      onChange={(e) =>
                        setTimelineForm({ ...timelineForm, label: e.target.value })
                      }
                    />

                    <label>Date</label>
                    <input
                      type="date"
                      value={timelineForm.date}
                      onChange={(e) =>
                        setTimelineForm({ ...timelineForm, date: e.target.value })
                      }
                    />

                    <label className="pd-checkbox-row">
                      <input
                        type="checkbox"
                        checked={timelineForm.done}
                        onChange={(e) =>
                          setTimelineForm({
                            ...timelineForm,
                            done: e.target.checked,
                          })
                        }
                      />
                      <span>Mark as completed</span>
                    </label>

                    <div className="pd-form-actions">
                      <button
                        className="pd-btn-primary"
                        onClick={handleTimelineSubmit}
                      >
                        Save Timeline
                      </button>
                      <button
                        className="pd-btn-ghost"
                        onClick={() => {
                          setShowTimelineForm(false);
                          setTimelineForm({ label: "", date: "", done: false });
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="pd-timeline">
                  {timeline.length === 0 ? (
                    <p className="pd-empty">No timeline events yet.</p>
                  ) : (
                    timeline.map((t, i) => (
                      <div
                        className={`pd-tl-item ${t.done ? "done" : "pending"}`}
                        key={i}
                      >
                        <div className="pd-tl-col">
                          <div className="pd-tl-dot">
                            {t.done ? <CheckIcon /> : <CircleIcon />}
                          </div>
                          {i < timeline.length - 1 && (
                            <div className={`pd-tl-line ${t.done ? "done" : ""}`} />
                          )}
                        </div>
                        <div className="pd-tl-content">
                          <span className="pd-tl-label">{t.label}</span>
                          <span className="pd-tl-date">{t.date}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}

            {activeTab === "location" && (
              <section className="pd-tab-panel">
                {isNGO && (
                  <div className="pd-update-form pd-mb16">
                    <h3>📍 Project Location</h3>

                    <label>Location Name / Address</label>
                    <input
                      placeholder="e.g. Kathmandu, Nepal"
                      value={locationForm.location}
                      onChange={(e) =>
                        setLocationForm({
                          ...locationForm,
                          location: e.target.value,
                        })
                      }
                    />

                    <div className="pd-form-row">
                      <div>
                        <label>Latitude</label>
                        <input
                          type="number"
                          step="any"
                          placeholder="e.g. 27.7172"
                          value={locationForm.lat}
                          onChange={(e) =>
                            setLocationForm({ ...locationForm, lat: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <label>Longitude</label>
                        <input
                          type="number"
                          step="any"
                          placeholder="e.g. 85.3240"
                          value={locationForm.lng}
                          onChange={(e) =>
                            setLocationForm({ ...locationForm, lng: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="pd-form-actions">
                      <button className="pd-btn-primary" onClick={handleLocationSave}>
                        Save Location
                      </button>
                    </div>
                  </div>
                )}

                <div className="pd-map-wrap">
                  <div className="pd-map-topbar">
                    <button
                      className="pd-btn-map-open"
                      onClick={() =>
                        window.open(
                          `https://maps.google.com/?q=${encodeURIComponent(
                            project.location || ""
                          )}`,
                          "_blank"
                        )
                      }
                    >
                      🔗 Open in Maps
                    </button>
                  </div>

                  {project.lat && project.lng ? (
                    <iframe
                      title="map"
                      className="pd-map-iframe"
                      src={`https://maps.google.com/maps?q=${project.lat},${project.lng}&z=15&output=embed`}
                      allowFullScreen
                    />
                  ) : (
                    <div className="pd-map-placeholder">
                      📍 Location coordinates not set
                    </div>
                  )}

                  <div className="pd-map-footer">
                    <span>📍 {project.location || "Location not provided"}</span>
                    <button
                      className="pd-btn-text"
                      onClick={() =>
                        window.open(
                          `https://maps.google.com/?q=${encodeURIComponent(
                            project.location || ""
                          )}`,
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

            {activeTab === "impact" && (
              <section className="pd-tab-panel">
                {isNGO && (
                  <div className="pd-update-form pd-mb16">
                    <h3>📊 Upload Impact Report</h3>

                    <div className="pd-form-row">
                      <div>
                        <label>Beneficiaries Reached</label>
                        <input
                          type="number"
                          placeholder="e.g. 120"
                          value={impactForm.beneficiaries}
                          onChange={(e) =>
                            setImpactForm({
                              ...impactForm,
                              beneficiaries: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <label>Testimonials Count</label>
                        <input
                          type="number"
                          placeholder="e.g. 8"
                          value={impactForm.testimonials}
                          onChange={(e) =>
                            setImpactForm({
                              ...impactForm,
                              testimonials: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <label>Impact Report PDF</label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) =>
                        setImpactForm({
                          ...impactForm,
                          pdf: e.target.files?.[0] || null,
                        })
                      }
                    />

                    <label>Before / After Photos</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) =>
                        setImpactForm({
                          ...impactForm,
                          photos: Array.from(e.target.files || []),
                        })
                      }
                    />

                    {impactForm.photos.length > 0 && (
                      <div className="pd-photo-preview-row">
                        {impactForm.photos.map((f, i) => (
                          <img
                            key={i}
                            src={URL.createObjectURL(f)}
                            alt=""
                            className="pd-photo-thumb"
                          />
                        ))}
                      </div>
                    )}

                    <div className="pd-form-actions">
                      <button className="pd-btn-primary" onClick={handleImpactSubmit}>
                        Upload Impact Report
                      </button>
                    </div>
                  </div>
                )}

                {impactReport ? (
                  <div className="pd-impact-grid">
                    <ImpactCard
                      icon="📄"
                      label="PDF Impact Report"
                      sub={impactReport.pdfUploaded ? "Uploaded" : "Not uploaded"}
                      color={impactReport.pdfUploaded ? "green" : "gray"}
                    />
                    <ImpactCard
                      icon="🖼️"
                      label="Before/After Photos"
                      sub={
                        impactReport.photoCount
                          ? `${impactReport.photoCount} Photos`
                          : "No photos"
                      }
                      color="blue"
                    />
                    <ImpactCard
                      icon="👥"
                      label="Beneficiaries Reached"
                      sub={impactReport.beneficiaries || "—"}
                      color="purple"
                    />
                    <ImpactCard
                      icon="💬"
                      label="Testimonials Collected"
                      sub={
                        impactReport.testimonials
                          ? `${impactReport.testimonials} Stories`
                          : "—"
                      }
                      color="amber"
                    />
                  </div>
                ) : (
                  <p className="pd-empty">No impact report available yet.</p>
                )}
              </section>
            )}

            {activeTab === "words" && (
              <section className="pd-tab-panel">
                <p className="pd-words-hint">
                  Please donate to share words of support.
                </p>

                {wordsSupport.length === 0 ? (
                  <p className="pd-empty">No words of support yet.</p>
                ) : (
                  wordsSupport.map((w, i) => (
                    <div className="pd-word-card" key={i}>
                      <div className="pd-word-avatar">
                        {w.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="pd-word-body">
                        <div className="pd-word-meta">
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

          <aside className="pd-sidebar">
            <div className="pd-sidebar-card">
              <button
                className="pd-btn-donate-big"
                onClick={() => setShowDonate(true)}
                disabled={remainingToGoal <= 0}
                title={remainingToGoal <= 0 ? "Goal reached" : "Donate now"}
              >
                <HeartIcon /> {remainingToGoal <= 0 ? "Goal Reached" : "Donate Now"}
              </button>

              <button
                className="pd-btn-share-full"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  showToast("Link copied!");
                }}
              >
                <ShareIcon /> Share This Project
              </button>
            </div>

            <div className="pd-sidebar-card">
              <h3 className="pd-sidebar-title">Transparency Score</h3>

              <div className="pd-ts-main">
                <ScoreRing score={ts.score || 0} />
                <div>
                  <strong className="pd-ts-label">
                    {scoreLabel(ts.score || 0)}
                  </strong>
                  <p className="pd-ts-sub">
                    Based on real donors, updates, expenses, and proof uploaded
                  </p>
                </div>
              </div>

              <div className="pd-ts-bars">
                <TsBar label="Regular Updates" value={ts.regular_updates || 0} />
                <TsBar label="Expense Reports" value={ts.expense_reports || 0} />
                <TsBar
                  label="Completion Reports"
                  value={ts.completion_reports || 0}
                />
                <TsBar label="Donor Feedback" value={ts.donor_feedback || 0} />
              </div>

              <div className="pd-ts-summary">
                <div className="pd-ts-summary-row">
                  <span>Raised</span>
                  <strong>₹{fmt(ts.raised)}</strong>
                </div>
                <div className="pd-ts-summary-row">
                  <span>Used in Updates</span>
                  <strong>₹{fmt(ts.used)}</strong>
                </div>
                <div className="pd-ts-summary-row">
                  <span>Funds Unused</span>
                  <strong>₹{fmt(ts.funds_unused)}</strong>
                </div>
                <div className="pd-ts-summary-row">
                  <span>Remaining to Goal</span>
                  <strong>₹{fmt(ts.remaining_to_goal)}</strong>
                </div>
                <div className="pd-ts-summary-row">
                  <span>Total Donors</span>
                  <strong>{ts.donors}</strong>
                </div>
                <div className="pd-ts-summary-row">
                  <span>Total Updates</span>
                  <strong>{ts.updates_count}</strong>
                </div>
                <div className="pd-ts-summary-row">
                  <span>Proof Photos</span>
                  <strong>{ts.proof_photos}</strong>
                </div>
              </div>
            </div>

            <div className="pd-sidebar-card">
              <div className="pd-donors-header">
                <h3 className="pd-sidebar-title">Recent Donors</h3>
                <span className="pd-donors-count">💜 {realDonorCount} donations</span>
              </div>

              {donors.length === 0 ? (
                <p className="pd-empty">No donors yet.</p>
              ) : (
                donors.slice(0, 5).map((d, i) => (
                  <div className="pd-donor-row" key={i}>
                    <div className="pd-donor-avatar">
                      {d.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="pd-donor-name">{d.name}</p>
                      <p className="pd-donor-amt">{d.amount} · {d.ago}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>

        {imgModal && (
          <div className="pd-modal-backdrop" onClick={() => setImgModal(null)}>
            <div className="pd-modal" onClick={(e) => e.stopPropagation()}>
              <button
                className="pd-modal-close"
                onClick={() => setImgModal(null)}
              >
                ✕
              </button>
              <img
                className="pd-modal-img"
                src={imgUrl(imgModal.photos[imgModal.idx])}
                alt=""
              />

              {imgModal.photos.length > 1 && (
                <div className="pd-modal-nav">
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
              fetchImpact();
              fetchTransparency();
              fetchUpdates();
            }}
          />
        )}
      </div>
    </NgoLayout>
  );
}

function UpdateCard({ update: u, isNGO, onEdit, onDelete, onOpenPhoto }) {
  return (
    <div className="pd-update-card">
      <div className="pd-update-header">
        <div>
          <h3 className="pd-update-title">{u.title}</h3>
          <span className="pd-update-meta">Organizer</span>
        </div>
        <span className="pd-update-date">📅 {fmtDate(u.createdAt)}</span>
      </div>

      <p className="pd-update-body">{u.description}</p>

      {Number(u.expenseUsed) > 0 && (
        <div className="pd-expense-tag">
          🔥 ₹{fmt(u.expenseUsed)} used for {u.expenseCategory}
        </div>
      )}

      {u.photos?.length > 0 && (
        <div className="pd-photo-grid">
          {u.photos.map((p, i) => (
            <img
              key={p}
              alt={`photo-${i + 1}`}
              src={imgUrl(p)}
              className="pd-photo-thumb clickable"
              onClick={() => onOpenPhoto(u.photos, i)}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ))}
        </div>
      )}

      {isNGO && (
        <div className="pd-update-actions">
          <button className="pd-action-btn edit" onClick={() => onEdit(u)}>
            ✏️ Edit
          </button>
          <button
            className="pd-action-btn delete"
            onClick={() => onDelete(u._id)}
          >
            🗑️ Delete
          </button>
        </div>
      )}
    </div>
  );
}

function ApprovalStepper({ status, message }) {
  const normalizedStatus = status === "active" ? "approved" : status;

  const approvedFlow = ["draft", "under_review", "approved"];
  const rejectedFlow = ["draft", "under_review", "rejected"];
  const steps = normalizedStatus === "rejected" ? rejectedFlow : approvedFlow;

  const labels = {
    draft: "Draft",
    under_review: "Under Review",
    approved: "Approved",
    rejected: "Rejected",
  };

  const curr = steps.indexOf(normalizedStatus);

  return (
    <div className="pd-approval">
      <div className="pd-approval-steps">
        {steps.map((s, i) => {
          const isCurrent = i === curr;
          const isApproved = s === "approved" && normalizedStatus === "approved";
          const isRejected = s === "rejected" && normalizedStatus === "rejected";

          return (
            <React.Fragment key={s}>
              <div
                className={[
                  "pd-approval-step",
                  isCurrent ? "active" : "",
                  isApproved ? "approved" : "",
                  isRejected ? "rejected" : "",
                ].join(" ")}
              >
                {isApproved ? <CheckIcon /> : isRejected ? "✕" : labels[s]}
              </div>

              {i < steps.length - 1 && (
                <div className={`pd-approval-line ${i < curr ? "active" : ""}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {message && (
        <p className="pd-approval-msg">
          {normalizedStatus === "approved"
            ? "✅"
            : normalizedStatus === "rejected"
            ? "❌"
            : "ℹ️"}{" "}
          {message}
        </p>
      )}
    </div>
  );
}

function StatChip({ icon, label, value }) {
  return (
    <div className="pd-stat-chip">
      <span className="pd-stat-icon">{icon}</span>
      <span className="pd-stat-label">{label}</span>
      <strong className="pd-stat-value">{value}</strong>
    </div>
  );
}

function ScoreRing({ score }) {
  const safeScore = clamp(Number(score || 0), 0, 100);
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (safeScore / 100) * circ;

  return (
    <div className="pd-score-ring">
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
      <span className="pd-score-num">{safeScore}%</span>
    </div>
  );
}

function TsBar({ label, value }) {
  const safeValue = clamp(Number(value || 0), 0, 100);

  return (
    <div className="pd-ts-bar-row">
      <span className="pd-ts-bar-label">{label}</span>
      <span className="pd-ts-bar-pct">{safeValue}%</span>
      <div className="pd-ts-track">
        <div className="pd-ts-fill" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

function ImpactCard({ icon, label, sub, color }) {
  return (
    <div className="pd-impact-card">
      <span className="pd-impact-icon">{icon}</span>
      <span className="pd-impact-label">{label}</span>
      <span className={`pd-impact-sub color-${color}`}>{sub}</span>
    </div>
  );
}

const ShareIcon = () => (
  <svg
    width="15"
    height="15"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const HeartIcon = () => (
  <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const CheckIcon = () => (
  <svg
    width="13"
    height="13"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    viewBox="0 0 24 24"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CircleIcon = () => (
  <svg
    width="13"
    height="13"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const CameraIcon = () => (
  <svg
    width="15"
    height="15"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);