import React, { useEffect, useState, useMemo, useCallback } from "react";
import NgoLayout from "../components/NgoLayout";
import "./NgoSettings.css";

const API = "http://localhost:5000";

const DOCUMENTS = [
  { key: "registrationCertificate", label: "Registration Certificate", description: "Official NGO registration document from government authority" },
  { key: "panDocument",             label: "PAN Card / Document",       description: "Permanent Account Number document of the organization" },
  { key: "auditReport",             label: "Audit Report",              description: "Latest financial audit report (within last 2 years)" },
  { key: "taxClearance",            label: "Tax Clearance Certificate", description: "Tax clearance certificate from the revenue department" },
  { key: "boardMemberVerification", label: "Board Member Verification", description: "List and ID verification of all board members" },
  { key: "projectReport",           label: "Project Report",            description: "Summary of current or past projects undertaken by NGO" }
];

function NgoSettings() {
  const [data, setData]               = useState(null);
  const [saving, setSaving]           = useState(false);
  const [files, setFiles]             = useState({});
  const [uploading, setUploading]     = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [docMsg, setDocMsg]           = useState(null);

  // Profile image
  const [profileFile, setProfileFile]           = useState(null);
  const [profilePreview, setProfilePreview]     = useState(null);
  const [profileUploading, setProfileUploading] = useState(false);
  const [profileMsg, setProfileMsg]             = useState(null);

  const token   = localStorage.getItem("token");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchSettings = useCallback(async () => {
    try {
      const res    = await fetch(`${API}/api/ngo/profile`, { headers });
      const result = await res.json();
      if (res.ok) setData(result);
    } catch (error) {
      console.error("Settings fetch error:", error);
    }
  }, [headers]);

  useEffect(() => { 
    fetchSettings(); 
  }, [fetchSettings]);

  const handleChange = (field, value) => 
    setData(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    try {
      setSaving(true);
      await fetch(`${API}/api/ngo/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(data)
      });
      alert("Settings updated successfully");
      fetchSettings();
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handlePause = async () => {
    await fetch(`${API}/api/ngo/pause`, { method: "PUT", headers });
    alert("All projects paused");
    fetchSettings();
  };

  const handleDeactivate = async () => {
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    await fetch(`${API}/api/ngo/deactivate`, { method: "PUT", headers });
    alert("Account deactivated");
    fetchSettings();
  };

  // Profile Image Handlers
  const handleProfileFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfileFile(file);
    setProfilePreview(URL.createObjectURL(file));
    setProfileMsg(null);
  };

  const handleProfileUpload = async () => {
    if (!profileFile) return;
    setProfileUploading(true);
    setProfileMsg(null);
    try {
      const formData = new FormData();
      formData.append("profileImage", profileFile);
      const res = await fetch(`${API}/api/ngo/upload-profile-image`, {
        method: "POST",
        headers,
        body: formData
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Upload failed");
      
      setProfileMsg({ type: "success", text: "Profile picture updated successfully" });
      setProfileFile(null);
      setProfilePreview(null);
      fetchSettings();
    } catch (err) {
      setProfileMsg({ type: "error", text: err.message || "Upload failed" });
    } finally {
      setProfileUploading(false);
    }
  };

  // Document Handlers
  const handleFileChange = (key, file) => 
    setFiles(prev => ({ ...prev, [key]: file }));

  const handleUploadDocs = async () => {
    const selected = Object.keys(files).filter(k => files[k]);
    if (selected.length === 0) {
      setDocMsg({ type: "error", text: "Please select at least one file to upload" });
      return;
    }
    setUploading(true);
    setDocMsg(null);
    try {
      const formData = new FormData();
      selected.forEach(key => formData.append(key, files[key]));
      const res = await fetch(`${API}/api/ngo/upload-documents`, {
        method: "POST",
        headers,
        body: formData
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Upload failed");
      
      setDocMsg({ type: "success", text: "Documents saved successfully" });
      setFiles({});
      fetchSettings();
    } catch (err) {
      setDocMsg({ type: "error", text: err.message || "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitVerification = async () => {
    if (!window.confirm("Submit all documents for admin review? You cannot change them after submission.")) return;
    setSubmitting(true);
    setDocMsg(null);
    try {
      const res = await fetch(`${API}/api/ngo/submit-verification`, { 
        method: "PUT", 
        headers 
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Submission failed");
      
      setDocMsg({ type: "success", text: "Submitted for verification. Admin will review shortly." });
      fetchSettings();
    } catch (err) {
      setDocMsg({ type: "error", text: err.message || "Submission failed" });
    } finally {
      setSubmitting(false);
    }
  };

  // Computed Values
  const verStatus     = data?.verificationStatus || (data?.verified ? "approved" : "draft");
  const isApproved    = verStatus === "approved";
  const isPending     = verStatus === "pending";
  const isRejected    = verStatus === "rejected";
  const isLocked      = isPending || isApproved;
  const uploadedCount = data ? DOCUMENTS.filter(d => data.documents?.[d.key]?.fileUrl).length : 0;
  const allUploaded   = uploadedCount === 6;

  const STATUS_BADGE = {
    draft:    { label: "Not Submitted", bg: "#f1f3f5", color: "#495057" },
    pending:  { label: "Under Review",  bg: "#fff3cd", color: "#856404" },
    approved: { label: "Approved",      bg: "#d8f3dc", color: "#1b4332" },
    rejected: { label: "Rejected",      bg: "#ffe3e3", color: "#c0392b" }
  };
  const badge = STATUS_BADGE[verStatus] || STATUS_BADGE.draft;

  const currentImage = data?.profileImage ? `${API}/uploads/${data.profileImage}` : null;
  const initials = data?.name
    ? data.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "NG";

  return (
    <NgoLayout>
      <div className="settings-page">
        <h2 className="settings-title">Settings</h2>

        {/* Profile Picture */}
        <div className="settings-card">
          <h3 className="settings-section-title">PROFILE PICTURE</h3>
          <div className="profile-pic-row">
            <div className="profile-pic-wrap">
              {profilePreview || currentImage ? (
                <img
                  src={profilePreview || currentImage}
                  alt="NGO Profile"
                  className="profile-pic-img"
                />
              ) : (
                <div className="profile-pic-initials">{initials}</div>
              )}
              <label className="profile-pic-overlay" title="Change photo">
                <span>Edit</span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleProfileFileChange}
                  style={{ display: "none" }}
                />
              </label>
            </div>

            <div className="profile-pic-info">
              <p className="profile-pic-name">{data?.name || "Your NGO"}</p>
              <p className="profile-pic-hint">JPG or PNG - Recommended size 200x200 pixels</p>

              {profileFile ? (
                <div className="profile-pic-actions">
                  <span className="profile-pic-filename">Selected: {profileFile.name}</span>
                  <div className="profile-pic-action-buttons">
                    <button className="btn-save" onClick={handleProfileUpload} disabled={profileUploading}>
                      {profileUploading ? "Uploading..." : "Save Photo"}
                    </button>
                    <button 
                      className="btn-cancel" 
                      onClick={() => { 
                        setProfileFile(null); 
                        setProfilePreview(null); 
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <label className="btn-change-photo">
                  {currentImage ? "Change Photo" : "Upload Photo"}
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={handleProfileFileChange}
                    style={{ display: "none" }}
                  />
                </label>
              )}

              {profileMsg && (
                <p className={`profile-msg ${profileMsg.type}`}>
                  {profileMsg.text}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Organisation Profile */}
        <div className="settings-card">
          <h3 className="settings-section-title">ORGANISATION PROFILE</h3>
          <div className="settings-grid">
            <div className="form-group">
              <label>Organisation Name</label>
              <input 
                value={data?.name || ""} 
                onChange={e => handleChange("name", e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label>Registration Number</label>
              <input 
                value={data?.registrationNumber || ""} 
                onChange={e => handleChange("registrationNumber", e.target.value)} 
              />
            </div>
            <div className="form-group">
  <label>Main Niche</label>
  <select
    value={data?.mainNiche || ""}
    onChange={e => handleChange("mainNiche", e.target.value)}
  >
    <option value="">Select niche</option>
    <option value="Education">Education</option>
    <option value="Health">Health</option>
    <option value="Women Empowerment">Women Empowerment</option>
    <option value="Women Health">Women Health</option>
    <option value="Disaster Relief">Disaster Relief</option>
    <option value="Environment">Environment</option>
    <option value="Child Welfare">Child Welfare</option>
    <option value="Poverty Relief">Poverty Relief</option>
    <option value="Community Development">Community Development</option>
  </select>
</div>
            <div className="form-group">
              <label>Email</label>
              <input value={data?.user?.email || ""} disabled />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input 
                value={data?.location || ""} 
                onChange={e => handleChange("location", e.target.value)} 
              />
            </div>
            <div className="form-group full-width">
              <label>Mission Statement</label>
              <textarea 
                rows={3} 
                value={data?.mission || ""} 
                onChange={e => handleChange("mission", e.target.value)} 
              />
            </div>
          </div>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Bank Details */}
        <div className="settings-card">
          <h3 className="settings-section-title">BANK DETAILS</h3>
          <div className="settings-grid">
            <div className="form-group">
              <label>Bank Name</label>
              <input 
                value={data?.bankName || ""} 
                onChange={e => handleChange("bankName", e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label>Account Number</label>
              <input 
                value={data?.accountNumber || ""} 
                onChange={e => handleChange("accountNumber", e.target.value)} 
              />
            </div>
          </div>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Verification Documents */}
        <div className="settings-card">
          <div className="verify-header-row">
            <h3 className="settings-section-title">VERIFICATION DOCUMENTS</h3>
            <span 
              className="status-pill" 
              style={{ backgroundColor: badge.bg, color: badge.color }}
            >
              {badge.label}
            </span>
          </div>

          {isApproved && (
            <div className="doc-banner banner-success">
              Your NGO is verified and approved. You can now create projects and receive donations.
            </div>
          )}
          {isPending && (
            <div className="doc-banner banner-pending">
              Documents are under admin review. You cannot modify them during this period.
            </div>
          )}
          {isRejected && (
            <div className="doc-banner banner-rejected">
              Verification was rejected.
              {data?.adminRemark && <span> Reason: {data.adminRemark}</span>}
              Please re-upload the correct documents and resubmit.
            </div>
          )}

          <div className="doc-progress">
            <div className="doc-progress-label">
              <span>Documents uploaded</span>
              <span>{uploadedCount} / 6</span>
            </div>
            <div className="doc-progress-bar">
              <div 
                className="doc-progress-fill" 
                style={{ width: `${(uploadedCount / 6) * 100}%` }} 
              />
            </div>
          </div>

          {docMsg && (
            <div className={`doc-msg ${docMsg.type}`}>
              {docMsg.text}
            </div>
          )}

          <div className="doc-grid">
            {DOCUMENTS.map(doc => {
              const uploaded = data?.documents?.[doc.key]?.fileUrl;
              const newFile = files[doc.key];
              return (
                <div 
                  key={doc.key} 
                  className={`doc-card ${uploaded ? "doc-uploaded" : ""} ${isLocked ? "doc-locked" : ""}`}
                >
                  <div className="doc-card-top">
                    <div className="doc-card-info">
                      <strong>{doc.label}</strong>
                      <span>{doc.description}</span>
                    </div>
                    {uploaded && <span className="doc-badge">Uploaded</span>}
                  </div>

                  {!isLocked && (
                    <label className="doc-file-label">
                      <input 
                        type="file" 
                        accept=".pdf,.jpg,.jpeg,.png" 
                        onChange={e => handleFileChange(doc.key, e.target.files[0])} 
                      />
                      <span className="doc-file-btn">
                        {newFile ? `Selected: ${newFile.name}` : uploaded ? "Replace file" : "Choose file"}
                      </span>
                    </label>
                  )}

                  {uploaded && !newFile && (
                    <a 
                      href={`${API}/uploads/${uploaded}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="doc-view-link"
                    >
                      View file
                    </a>
                  )}

                  {isLocked && !uploaded && <p className="doc-not-uploaded">Not uploaded</p>}
                </div>
              );
            })}
          </div>

          {!isLocked && (
            <div className="doc-actions">
              <button 
                className="btn-save-docs" 
                onClick={handleUploadDocs}
                disabled={uploading || Object.keys(files).filter(k => files[k]).length === 0}
              >
                {uploading ? "Saving..." : "Save Documents"}
              </button>
              <button 
                className="btn-submit-verify" 
                onClick={handleSubmitVerification}
                disabled={!allUploaded || submitting}
              >
                {submitting ? "Submitting..." : "Submit for Verification"}
              </button>
            </div>
          )}

          {!allUploaded && !isLocked && (
            <p className="doc-hint">Please upload all 6 documents to enable submission.</p>
          )}
        </div>

        {/* Danger Zone */}
        <div className="settings-card danger-card">
          <h3 className="settings-section-title danger-title">DANGER ZONE</h3>
          <p className="danger-desc">
            These actions are permanent and cannot be undone.
          </p>
          <div className="danger-actions">
            <button className="btn-pause" onClick={handlePause}>
              Pause All Projects
            </button>
            <button className="btn-deactivate" onClick={handleDeactivate}>
              Deactivate Account
            </button>
          </div>
        </div>
      </div>
    </NgoLayout>
  );
}

export default NgoSettings;