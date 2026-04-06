import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./ProjectDetails.css";

const API_BASE = "http://localhost:5000";

function formatCurrency(value) {
  return `NPR ${Number(value || 0).toLocaleString("en-NP")}`;
}

function AdminProjectDetails() {
  const { id } = useParams();

  const [project, setProject] = useState(null);
  const [ngo, setNgo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/api/projects/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to load project details");
      }

      const data = await res.json();

      const projectData = data.project || data;
      setProject(projectData);
      setNgo(projectData.ngo || null);
    } catch (err) {
      console.error("Admin project details error:", err);
      setError("Could not load project details.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="project-details-page">
        <div className="project-main-card">
          <h2>Loading project details...</h2>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="project-details-page">
        <div className="project-main-card">
          <h2>{error || "Project not found"}</h2>
        </div>
      </div>
    );
  }

  const raised = Number(project.raisedAmount || 0);
  const goal = Number(project.goalAmount || 0);
  const percent = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;

  return (
    <div className="project-details-page">
      {project.image && (
        <div className="project-hero">
          <img
            src={`${API_BASE}/uploads/${project.image}`}
            alt={project.title}
            className="project-hero-image"
          />
        </div>
      )}

      <div className="project-details-grid">
        <div className="project-main-column">
          <div className="project-main-card">
            <p className="project-ngo-name">
              {ngo?.organizationName || ngo?.name || "NGO"}
            </p>

            <h1 className="project-title">{project.title}</h1>
            <p className="project-description">{project.description}</p>

            <hr className="project-divider" />

            <div className="project-ngo-box">
              <div className="project-ngo-avatar">
                {(ngo?.organizationName || ngo?.name || "N").charAt(0)}
              </div>

              <div>
                <h3>{ngo?.organizationName || ngo?.name || "NGO"}</h3>
                <p>{ngo?.category || "General"}</p>
              </div>

              <div className="verified-badge">
                {ngo?.verified ? "✓ Verified" : "Not Verified"}
              </div>
            </div>
          </div>

          <div className="project-main-card">
            <h2>Real-Time Fund Tracking</h2>

            <div className="fund-row">
              <strong>{formatCurrency(raised)} raised</strong>
              <span>{formatCurrency(goal)} goal</span>
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${percent}%` }}
              />
            </div>

            <p className="fund-percent">{percent.toFixed(0)}% Complete</p>
          </div>

          <div className="project-main-card">
            <h2>Admin View</h2>
            <div className="admin-info-grid">
              <div className="overview-item">
                <span>Status</span>
                <strong>{project.status || "draft"}</strong>
              </div>
              <div className="overview-item">
                <span>Fraud Score</span>
                <strong>{project.fraudScore || 0}</strong>
              </div>
              <div className="overview-item">
                <span>Flagged</span>
                <strong>{project.flagged ? "Yes" : "No"}</strong>
              </div>
              <div className="overview-item">
                <span>Donor Count</span>
                <strong>{project.donorCount || 0}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="project-side-column">
          <div className="project-side-card">
            <button className="donate-btn" disabled>
              Admin Portal View
            </button>
            <button className="share-btn" disabled>
              View Only
            </button>
          </div>

          <div className="project-side-card">
            <h3>Project Summary</h3>
            <div className="overview-item">
              <span>Raised Amount</span>
              <strong>{formatCurrency(raised)}</strong>
            </div>
            <div className="overview-item">
              <span>Goal Amount</span>
              <strong>{formatCurrency(goal)}</strong>
            </div>
            <div className="overview-item">
              <span>Status</span>
              <strong>{project.status || "draft"}</strong>
            </div>
            <div className="overview-item">
              <span>Flagged</span>
              <strong>{project.flagged ? "Yes" : "No"}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminProjectDetails;