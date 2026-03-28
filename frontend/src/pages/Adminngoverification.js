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
  projectReport: "Project Report"
};

const STATUS_COLORS = {
  draft: { bg: "#f1f3f5", color: "#495057" },
  pending: { bg: "#fff3cd", color: "#856404" },
  approved: { bg: "#d8f3dc", color: "#1b4332" },
  rejected: { bg: "#ffe3e3", color: "#c0392b" }
};

export default function AdminNgoVerification() {
  const [ngos, setNgos] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [selected, setSelected] = useState(null);
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [pageError, setPageError] = useState("");

  const token = localStorage.getItem("token");

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`
    }),
    [token]
  );

  const fetchNgos = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const url =
        filter === "all"
          ? `${API}/api/ngo/admin/all-ngos`
          : `${API}/api/ngo/admin/all-ngos?status=${filter}`;

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
      setMessage(null);
    } catch (err) {
      console.error("OPEN DETAIL ERROR:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to load NGO details."
      });
    }
  };

  const handleAction = async (status) => {
    if (!selected) return;

    if (status === "rejected" && !remark.trim()) {
      setMessage({
        type: "error",
        text: "Please enter a remark before rejecting."
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
        text: `NGO ${status} successfully!`
      });

      setSelected(null);
      fetchNgos();
    } catch (err) {
      console.error("ACTION ERROR:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Action failed."
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
          <p>Review submitted documents and approve or reject NGO applications.</p>
        </div>

        <div className="filter-tabs">
          {["pending", "approved", "rejected", "all"].map((s) => (
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
          No NGOs with status <strong>{filter}</strong>.
        </div>
      ) : (
        <div className="ngo-list">
          {ngos.map((ngo) => {
            const sc = STATUS_COLORS[ngo.verificationStatus] || STATUS_COLORS.draft;
            const uploadedDocs = docKeys.filter(
              (k) => ngo.documents?.[k]?.fileUrl
            ).length;

            return (
              <div key={ngo._id} className="ngo-row">
                <div className="ngo-row-info">
                  <div className="ngo-avatar">
                    {ngo.name?.charAt(0)?.toUpperCase() || "N"}
                  </div>

                  <div>
                    <h3>{ngo.name}</h3>
                    <p>
                      {ngo.user?.email || "No email"} &nbsp;·&nbsp;{" "}
                      {ngo.category || "No category"} &nbsp;·&nbsp;{" "}
                      {ngo.location || "No location"}
                    </p>
                    <p className="doc-count">{uploadedDocs}/6 documents uploaded</p>
                  </div>
                </div>

                <div className="ngo-row-actions">
                  <span
                    className="status-badge"
                    style={{ background: sc.bg, color: sc.color }}
                  >
                    {ngo.verificationStatus}
                  </span>

                  <button
                    className="btn-review"
                    onClick={() => openDetail(ngo._id)}
                  >
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
                  {selected.user?.email} &nbsp;·&nbsp; Reg. No:{" "}
                  {selected.registrationNumber}
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() => setSelected(null)}
              >
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
                ["Account Status", selected.accountStatus]
              ].map(([label, val]) =>
                val ? (
                  <div key={label} className="info-item">
                    <span className="info-label">{label}</span>
                    <span className="info-val">{val}</span>
                  </div>
                ) : null
              )}
            </div>

            {selected.description && (
              <div className="ngo-desc">
                <strong>About:</strong> {selected.description}
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

            {selected.verificationStatus !== "approved" && (
              <>
                <div className="remark-area">
                  <label>
                    Admin Remark <span className="req">(required for rejection)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="Add a remark or feedback for the NGO..."
                  />
                </div>

                {message && (
                  <div
                    className={`message ${
                      message.type === "error" ? "error" : "success"
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                <div className="modal-actions">
                  <button
                    className="btn-reject"
                    onClick={() => handleAction("rejected")}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Processing..." : "✕ Reject"}
                  </button>

                  <button
                    className="btn-approve"
                    onClick={() => handleAction("approved")}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Processing..." : "✓ Approve NGO"}
                  </button>
                </div>
              </>
            )}

            {selected.verificationStatus === "approved" && (
              <div className="already-approved">
                ✅ This NGO is already approved.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}