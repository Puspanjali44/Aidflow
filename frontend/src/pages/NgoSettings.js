import React, { useEffect, useState } from "react";
import NgoLayout from "../components/NgoLayout";
import "./NgoSettings.css";

function NgoSettings() {
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        "http://localhost:5000/api/ngo/profile",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = await res.json();
      if (res.ok) setData(result);
    } catch (error) {
      console.error("Settings fetch error:", error);
    }
  };

  const handleChange = (field, value) => {
    setData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const token = localStorage.getItem("token");

      await fetch("http://localhost:5000/api/ngo/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      alert("Settings updated successfully");
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handlePause = async () => {
    const token = localStorage.getItem("token");
    await fetch("http://localhost:5000/api/ngo/pause", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    alert("All projects paused");
  };

  const handleDeactivate = async () => {
    const confirm = window.confirm(
      "Are you sure? This cannot be undone."
    );
    if (!confirm) return;

    const token = localStorage.getItem("token");
    await fetch("http://localhost:5000/api/ngo/deactivate", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });

    alert("Account deactivated");
  };

  if (!data) {
    return (
      <NgoLayout>
        <div className="settings-container">
          <p>Loading...</p>
        </div>
      </NgoLayout>
    );
  }

  return (
    <NgoLayout>
      <div className="settings-container">

        <h1 className="settings-title">Settings</h1>

        {/* ================= PROFILE ================= */}
        <div className="settings-section">
          <h3>Organisation Profile</h3>

          <div className="form-grid">

            <div className="form-group">
              <label>Organisation Name</label>
              <input
                value={data.name || ""}
                onChange={(e) =>
                  handleChange("name", e.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label>Registration Number</label>
              <input
                value={data.registrationNumber || ""}
                onChange={(e) =>
                  handleChange("registrationNumber", e.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input value={data.user?.email || ""} disabled />
            </div>

            <div className="form-group">
              <label>Location</label>
              <input
                value={data.location || ""}
                onChange={(e) =>
                  handleChange("location", e.target.value)
                }
              />
            </div>

            <div className="form-group full-width">
              <label>Mission</label>
              <textarea
                value={data.mission || ""}
                onChange={(e) =>
                  handleChange("mission", e.target.value)
                }
              />
            </div>

          </div>
        </div>

        {/* ================= BANK DETAILS ================= */}
        <div className="settings-section">
          <h3>Bank Details</h3>

          <div className="form-grid">
            <div className="form-group">
              <label>Bank Name</label>
              <input
                value={data.bankName || ""}
                onChange={(e) =>
                  handleChange("bankName", e.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label>Account Number</label>
              <input
                value={data.accountNumber || ""}
                onChange={(e) =>
                  handleChange("accountNumber", e.target.value)
                }
              />
            </div>
          </div>

          <button
            className="save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* ================= VERIFICATION DOCUMENTS ================= */}
        <div className="settings-section">
          <h3>Verification Documents</h3>

          {data.documents?.map((doc) => (
            <div key={doc._id} className="document-card">
              <div>
                <strong>{doc.name}</strong>
                <p>
                  Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                </p>
              </div>

              <span
                className={`status-badge ${doc.status}`}
              >
                {doc.status}
              </span>
            </div>
          ))}

          <div className="upload-box">
            <p>Drop or browse</p>
            <small>PDF, JPG, PNG · max 5MB</small>
          </div>
        </div>

        {/* ================= DANGER ZONE ================= */}
        <div className="settings-section danger-zone">
          <h3>Danger Zone</h3>
          <p>These actions are permanent and cannot be undone.</p>

          <div className="danger-buttons">
            <button className="pause-btn" onClick={handlePause}>
              Pause All Projects
            </button>

            <button
              className="deactivate-btn"
              onClick={handleDeactivate}
            >
              Deactivate Account
            </button>
          </div>
        </div>

      </div>
    </NgoLayout>
  );
}

export default NgoSettings;