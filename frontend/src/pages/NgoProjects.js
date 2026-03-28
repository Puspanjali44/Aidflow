import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NgoLayout from "../components/NgoLayout";

function NgoProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/projects/my", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setProjects(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPage = (id) => {
    navigate(`/projects/${id}`);
  };

  const handleEdit = (id) => {
    navigate(`/ngo/projects/edit/${id}`);
  };

  // New function: Send project for admin approval
  const handleSendForApproval = async (id) => {
    if (!window.confirm("Send this project for admin approval?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/projects/${id}/submit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "under_review" }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Project submitted for approval successfully!");
        fetchProjects(); // Refresh the list
      } else {
        alert(data.message || "Failed to submit project");
      }
    } catch (error) {
      console.error("Error submitting project:", error);
      alert("Server error. Please try again.");
    }
  };

  const handlePause = async (id) => {
    if (!window.confirm("Pause this project?")) return;
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:5000/api/projects/${id}/pause`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchProjects();
  };

  const handleResume = async (id) => {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:5000/api/projects/${id}/resume`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchProjects();
  };

  if (loading) {
    return (
      <NgoLayout>
        <div style={{ padding: "80px 0", textAlign: "center", color: "#777" }}>
          Loading projects...
        </div>
      </NgoLayout>
    );
  }

  return (
    <NgoLayout>
      <div className="projects-page">
        <div style={{ marginBottom: "32px" }}>
          <h1 className="page-title">My Projects</h1>
          <p style={{ color: "#666", marginTop: "6px" }}>
            Manage your fundraising projects and track progress.
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="dash-empty" style={{ marginTop: "40px" }}>
            <p>No projects created yet.</p>
          </div>
        ) : (
          projects.map((project) => {
            const progress = project.goalAmount > 0
              ? Math.min(100, Math.round((project.raisedAmount / project.goalAmount) * 100))
              : 0;

            return (
              <div key={project._id} className="project-item">
                <div className="project-header">
                  <div>
                    <h3>{project.title}</h3>
                    <span className={`status-badge ${project.status || "draft"}`}>
                      {project.status === "active" ? "Active" :
                       project.status === "completed" ? "Completed" :
                       project.status === "under_review" ? "Under Review" :
                       project.status === "draft" ? "Draft" :
                       project.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="project-actions">
                    {/* Send for Approval Button - Only show for Draft projects */}
                    {project.status === "draft" && (
                      <button 
                        className="action-btn send-approval-btn"
                        onClick={() => handleSendForApproval(project._id)}
                        style={{
                          background: "#15803d",
                          color: "white",
                          border: "none",
                          padding: "10px 18px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: "600"
                        }}
                      >
                        Send for Approval →
                      </button>
                    )}

                    <button 
                      className="action-btn"
                      onClick={() => handleViewPage(project._id)}
                    >
                      View Page
                    </button>

                    {(project.status === "active" || project.status === "paused") && (
                      <>
                        <button 
                          className="action-btn"
                          onClick={() => handleEdit(project._id)}
                        >
                          Edit
                        </button>

                        {project.status === "active" ? (
                          <button 
                            className="action-btn pause-btn"
                            onClick={() => handlePause(project._id)}
                          >
                            Pause
                          </button>
                        ) : (
                          <button 
                            className="action-btn"
                            onClick={() => handleResume(project._id)}
                          >
                            Resume
                          </button>
                        )}
                      </>
                    )}

                    {project.status === "completed" && (
                      <button 
                        className="action-btn"
                        onClick={() => handleViewPage(project._id)}
                      >
                        View Page
                      </button>
                    )}
                  </div>
                </div>

                <p className="project-description">{project.description}</p>

                <div className="project-funding">
                  <span>
                    Rs. {project.raisedAmount?.toLocaleString() || 0} raised of Rs.{" "}
                    {project.goalAmount?.toLocaleString() || 0}
                  </span>
                  <span className="progress-percentage">{progress}%</span>
                </div>

                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="project-meta">
                  <span>{project.donorCount || 0} donors</span>
                  <span>Ends {new Date(project.endDate).toLocaleDateString('en-GB')}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </NgoLayout>
  );
}

export default NgoProjects;