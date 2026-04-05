import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import "./Adminngoverification.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const DOC_LABELS = {
  registrationCertificate: "Registration Certificate",
  panDocument: "PAN Document",
  auditReport: "Audit Report",
  taxClearance: "Tax Clearance",
  boardMemberVerification: "Board Member Verification",
  projectReport: "Project Report",
};

const STATUS_COLORS = {
  draft: { bg: "#f1f3f5", color: "#495057" },
  pending: { bg: "#fff3cd", color: "#856404" },
  approved: { bg: "#d8f3dc", color: "#1b4332" },
  rejected: { bg: "#ffe3e3", color: "#c0392b" },
};

export default function AdminNgoVerification() {
  const [ngos, setNgos] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [selected, setSelected] = useState(null);
  const [remark, setRemark] = useState("");
  const [flagReason, setFlagReason] = useState("");
  const [accountStatus, setAccountStatus] = useState("active");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [pageError, setPageError] = useState("");

  const token = localStorage.getItem("token");

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const fetchNgos = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      let url = `${API}/api/ngo/admin/all-ngos`;

      if (filter === "flagged") {
        url = `${API}/api/ngo/admin/flagged/list`;
      } else if (filter !== "all") {
        url = `${API}/api/ngo/admin/all-ngos?status=${filter}`;
      }

      const res = await axios.get(url, { headers });
      setNgos(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("FETCH NGO ERROR:", err);
      setPageError(err.response?.data?.message || "Failed to load NGOs.");
      setNgos([]);
    } finally {
      setLoading(false);
    }
  }, [filter, headers]);

  useEffect(() => {
    fetchNgos();
  }, [fetchNgos]);

  const openDetail = async (id) => {
    try {
      const res = await axios.get(`${API}/api/ngo/admin/${id}`, { headers });
      setSelected(res.data);
      setRemark(res.data.adminRemark || "");
      setFlagReason(res.data.flagReason || "");
      setAccountStatus(res.data.accountStatus || "active");
      setMessage(null);
    } catch (err) {
      console.error("OPEN DETAIL ERROR:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to load NGO details.",
      });
    }
  };

  const refreshSelected = async (id) => {
    const refreshed = await axios.get(`${API}/api/ngo/admin/${id}`, { headers });
    setSelected(refreshed.data);
    setRemark(refreshed.data.adminRemark || "");
    setFlagReason(refreshed.data.flagReason || "");
    setAccountStatus(refreshed.data.accountStatus || "active");
  };

  const handleAction = async (status) => {
    if (!selected) return;

    if (status === "rejected" && !remark.trim()) {
      setMessage({
        type: "error",
        text: "Please enter a remark before rejecting.",
      });
      return;
    }

    if (!window.confirm(`Are you sure you want to ${status} this NGO?`)) return;

    setActionLoading(true);

    try {
      await axios.put(
        `${API}/api/ngo/admin/${selected._id}/status`,
        { status, remark },
        { headers }
      );

      setMessage({
        type: "success",
        text: `NGO ${status} successfully.`,
      });

      await refreshSelected(selected._id);
      fetchNgos();
    } catch (err) {
      console.error("ACTION ERROR:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Action failed.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleFlagNgo = async () => {
    if (!selected) return;

    if (!flagReason.trim()) {
      setMessage({
        type: "error",
        text: "Please enter a reason before flagging this NGO.",
      });
      return;
    }

    setActionLoading(true);

    try {
      await axios.put(
        `${API}/api/ngo/admin/${selected._id}/flag`,
        { flagged: true, flagReason },
        { headers }
      );

      setMessage({
        type: "success",
        text: "NGO flagged for admin review.",
      });

      await refreshSelected(selected._id);
      fetchNgos();
    } catch (err) {
      console.error("FLAG NGO ERROR:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to flag NGO.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearFlag = async () => {
    if (!selected) return;

    setActionLoading(true);

    try {
      await axios.put(
        `${API}/api/ngo/admin/${selected._id}/flag`,
        { flagged: false, flagReason: "" },
        { headers }
      );

      setMessage({
        type: "success",
        text: "Flag removed successfully.",
      });

      await refreshSelected(selected._id);
      fetchNgos();
    } catch (err) {
      console.error("CLEAR FLAG ERROR:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to clear flag.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccountStatusUpdate = async () => {
    if (!selected) return;

    setActionLoading(true);

    try {
      await axios.put(
        `${API}/api/ngo/admin/${selected._id}/account-status`,
        { accountStatus },
        { headers }
      );

      setMessage({
        type: "success",
        text: `Account status updated to ${accountStatus}.`,
      });

      await refreshSelected(selected._id);
      fetchNgos();
    } catch (err) {
      console.error("ACCOUNT STATUS UPDATE ERROR:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update account status.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const docKeys = Object.keys(DOC_LABELS);

  return (
    <div className="admin-verify">
      <div className="admin-verify-header">
        <div>
          <h1>NGO Verification</h1>
          <p>Review submitted documents, approve or reject NGOs, and flag suspicious cases.</p>
        </div>

        <div className="filter-tabs">
          {["pending", "approved", "rejected", "flagged", "all"].map((s) => (
            <button
              key={s}
              className={`tab ${filter === s ? "active" : ""}`}
              onClick={() => setFilter(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {pageError && <div className="message error">{pageError}</div>}

      {loading ? (
        <div className="loading-state">Loading NGOs...</div>
      ) : ngos.length === 0 ? (
        <div className="empty-state">
          No NGOs found for <strong>{filter}</strong>.
        </div>
      ) : (
        <div className="ngo-list">
          {ngos.map((ngo) => {
            const sc = STATUS_COLORS[ngo.verificationStatus] || STATUS_COLORS.draft;
            const uploadedDocs = docKeys.filter((k) => ngo.documents?.[k]?.fileUrl).length;

            return (
              <div key={ngo._id} className="ngo-row">
                <div className="ngo-row-info">
                  <div className="ngo-avatar">
                    {ngo.name?.charAt(0)?.toUpperCase() || "N"}
                  </div>

                  <div>
                    <h3>{ngo.name}</h3>
                    <p>
                      {ngo.user?.email || "No email"} · {ngo.category || "No category"} ·{" "}
                      {ngo.location || "No location"}
                    </p>
                    <p className="doc-count">{uploadedDocs}/6 documents uploaded</p>

                    {ngo.flagged && (
                      <p className="flag-row">
                        🚩 Flagged {ngo.flagReason ? `· ${ngo.flagReason}` : ""}
                      </p>
                    )}
                  </div>
                </div>

                <div className="ngo-row-actions">
                  <span
                    className="status-badge"
                    style={{ background: sc.bg, color: sc.color }}
                  >
                    {ngo.verificationStatus}
                  </span>

                  {ngo.flagged && <span className="flag-badge">Flagged</span>}

                  <button className="btn-review" onClick={() => openDetail(ngo._id)}>
                    Review →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{selected.name}</h2>
                <p>
                  {selected.user?.email} · Reg. No: {selected.registrationNumber}
                </p>
              </div>

              <button className="modal-close" onClick={() => setSelected(null)}>
                ✕
              </button>
            </div>

            <div className="info-grid">
              {[
                ["Category", selected.category],
                ["Location", selected.location],
                ["Phone", selected.phone],
                ["Website", selected.website],
                ["Established", selected.establishedYear],
                ["Account Status", selected.accountStatus],
                ["Verification Status", selected.verificationStatus],
                ["Fraud Score", selected.fraudScore ?? 0],
              ].map(([label, val]) =>
                val !== undefined && val !== null && val !== "" ? (
                  <div key={label} className="info-item">
                    <span className="info-label">{label}</span>
                    <span className="info-val">{String(val)}</span>
                  </div>
                ) : null
              )}
            </div>

            {selected.description && (
              <div className="ngo-desc">
                <strong>About:</strong> {selected.description}
              </div>
            )}

            {selected.flagged && (
              <div className="flagged-panel">
                <strong>🚩 Flagged for Review</strong>
                <p>{selected.flagReason || "No reason provided."}</p>
              </div>
            )}

            {selected.riskReasons?.length > 0 && (
              <div className="prev-remark">
                <strong>Risk Reasons:</strong>
                <ul style={{ marginTop: "8px", paddingLeft: "18px" }}>
                  {selected.riskReasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}

            <h3 className="docs-heading">Submitted Documents</h3>
            <div className="docs-grid">
              {docKeys.map((key) => {
                const doc = selected.documents?.[key];
                const hasFile = doc?.fileUrl;

                return (
                  <div
                    key={key}
                    className={`doc-item ${hasFile ? "has-file" : "no-file"}`}
                  >
                    <div className="doc-name">{DOC_LABELS[key]}</div>

                    {hasFile ? (
                      <a
                        href={`${API}/uploads/${doc.fileUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="doc-view-btn"
                      >
                        👁 View File
                      </a>
                    ) : (
                      <span className="doc-missing">Not uploaded</span>
                    )}
                  </div>
                );
              })}
            </div>

            {selected.adminRemark && (
              <div className="prev-remark">
                <strong>Previous remark:</strong> {selected.adminRemark}
              </div>
            )}

            <div className="remark-area">
              <label>
                Admin Remark <span className="req">(required for rejection)</span>
              </label>
              <textarea
                rows={3}
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Add approval or rejection remark..."
              />
            </div>

            <div className="remark-area">
              <label>
                Flag Reason <span className="req">(required for flagging)</span>
              </label>
              <textarea
                rows={3}
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="Explain why this NGO looks suspicious..."
              />
            </div>

            <div className="remark-area">
              <label>Account Status</label>
              <select
                value={accountStatus}
                onChange={(e) => setAccountStatus(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d0d7de",
                  background: "#fff",
                }}
              >
                <option value="active">active</option>
                <option value="paused">paused</option>
                <option value="deactivated">deactivated</option>
              </select>

              <div style={{ marginTop: "10px" }}>
                <button
                  className="btn-review"
                  onClick={handleAccountStatusUpdate}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing..." : "Update Account Status"}
                </button>
              </div>
            </div>

            {message && (
              <div className={`message ${message.type === "error" ? "error" : "success"}`}>
                {message.text}
              </div>
            )}

            <div className="modal-actions">
              {!selected.flagged ? (
                <button
                  className="btn-flag"
                  onClick={handleFlagNgo}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing..." : "🚩 Flag NGO"}
                </button>
              ) : (
                <button
                  className="btn-clear-flag"
                  onClick={handleClearFlag}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing..." : "✓ Clear Flag"}
                </button>
              )}

              {selected.verificationStatus !== "approved" && (
                <button
                  className="btn-reject"
                  onClick={() => handleAction("rejected")}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing..." : "✕ Reject"}
                </button>
              )}

              {selected.verificationStatus !== "approved" && (
                <button
                  className="btn-approve"
                  onClick={() => handleAction("approved")}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing..." : "✓ Approve NGO"}
                </button>
              )}
            </div>

            {selected.verificationStatus === "approved" && (
              <div className="already-approved">✅ This NGO is already approved.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}