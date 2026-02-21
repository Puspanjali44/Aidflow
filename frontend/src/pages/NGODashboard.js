import React, { useEffect, useState } from "react";
import NgoLayout from "../components/NgoLayout";
import "./NGODashboard.css";

function NGODashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  // ================= FETCH PROJECTS =================
  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/projects/my", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) setProjects(data);
    } catch (error) {
      console.error("Error fetching projects");
    } finally {
      setLoading(false);
    }
  };

  // ================= SUBMIT FOR REVIEW =================
  const handleSubmit = async (id) => {
    const token = localStorage.getItem("token");

    const res = await fetch(
      `http://localhost:5000/api/projects/${id}/submit`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (res.ok) fetchProjects();
    else alert("Failed to submit project");
  };

  // ================= PAUSE =================
  const handlePause = async (id) => {
    const token = localStorage.getItem("token");

    const res = await fetch(
      `http://localhost:5000/api/projects/${id}/pause`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (res.ok) fetchProjects();
    else alert("Failed to pause project");
  };

  // ================= RESUME =================
  const handleResume = async (id) => {
    const token = localStorage.getItem("token");

    const res = await fetch(
      `http://localhost:5000/api/projects/${id}/resume`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (res.ok) fetchProjects();
    else alert("Failed to resume project");
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this draft project?")) return;

    const token = localStorage.getItem("token");

    const res = await fetch(
      `http://localhost:5000/api/projects/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (res.ok) fetchProjects();
    else alert("Only draft projects can be deleted");
  };

  // ================= OPEN EDIT =================
  const handleEdit = (project) => {
    setEditingProject({ ...project });
  };

  // ================= UPDATE PROJECT =================
  const handleUpdateProject = async () => {
    const token = localStorage.getItem("token");

    const res = await fetch(
      `http://localhost:5000/api/projects/${editingProject._id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editingProject.title,
          description: editingProject.description,
          goalAmount: editingProject.goalAmount,
        }),
      }
    );

    if (res.ok) {
      setEditingProject(null);
      fetchProjects();
    } else {
      alert("Update failed (check goal rules)");
    }
  };

  // ================= STATS =================
  const totalDonations = projects.reduce(
    (sum, project) => sum + (project.raisedAmount || 0),
    0
  );

  const activeProjects = projects.filter(
    (project) => project.status === "active"
  ).length;

  return (
    <NgoLayout>
      <h1 className="page-title">NGO Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h4>Total Donations</h4>
          <p>Rs. {totalDonations}</p>
        </div>

        <div className="stat-card">
          <h4>Active Projects</h4>
          <p>{activeProjects}</p>
        </div>

        <div className="stat-card">
          <h4>Total Projects</h4>
          <p>{projects.length}</p>
        </div>
      </div>

      <div className="section">
        <h2>My Projects</h2>

        {loading ? (
          <p>Loading...</p>
        ) : projects.length === 0 ? (
          <p>No projects created yet.</p>
        ) : (
          projects.map((project) => {
            const progress =
              project.goalAmount > 0
                ? (project.raisedAmount / project.goalAmount) * 100
                : 0;

            return (
              <div key={project._id} className="project-card">
                <div className="project-header">
                  <h3>{project.title}</h3>
                  <span className={`status-badge ${project.status}`}>
                    {project.status}
                  </span>
                </div>

                {/* UNDER REVIEW MESSAGE */}
                {project.status === "under_review" && (
                  <p style={{ color: "orange", marginTop: "8px" }}>
                    Awaiting admin approval
                  </p>
                )}

                {/* REJECTED MESSAGE */}
                {project.status === "rejected" && (
                  <p style={{ color: "red", marginTop: "8px" }}>
                    Rejected by admin
                  </p>
                )}

                <p>{project.description}</p>

                <p>
                  Rs. {project.raisedAmount} raised of Rs.{" "}
                  {project.goalAmount}
                </p>

                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="project-actions">

                  {/* DRAFT */}
                  {project.status === "draft" && (
                    <>
                      <button
                        className="action-btn publish"
                        onClick={() => handleSubmit(project._id)}
                      >
                        Submit for Review
                      </button>

                      <button
                        className="action-btn delete"
                        onClick={() => handleDelete(project._id)}
                      >
                        Delete
                      </button>
                    </>
                  )}

                  {/* ACTIVE */}
                  {project.status === "active" && (
                    <>
                      <button
                        className="action-btn edit"
                        onClick={() => handleEdit(project)}
                      >
                        Edit
                      </button>

                      <button
                        className="action-btn pause"
                        onClick={() => handlePause(project._id)}
                      >
                        Pause
                      </button>
                    </>
                  )}

                  {/* PAUSED */}
                  {project.status === "paused" && (
                    <>
                      <button
                        className="action-btn edit"
                        onClick={() => handleEdit(project)}
                      >
                        Edit
                      </button>

                      <button
                        className="action-btn resume"
                        onClick={() => handleResume(project._id)}
                      >
                        Resume
                      </button>
                    </>
                  )}

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ================= EDIT MODAL ================= */}
      {editingProject && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit Project</h3>

            <input
              type="text"
              value={editingProject.title}
              onChange={(e) =>
                setEditingProject({
                  ...editingProject,
                  title: e.target.value,
                })
              }
            />

            <textarea
              value={editingProject.description}
              onChange={(e) =>
                setEditingProject({
                  ...editingProject,
                  description: e.target.value,
                })
              }
            />

            <input
              type="number"
              value={editingProject.goalAmount}
              onChange={(e) =>
                setEditingProject({
                  ...editingProject,
                  goalAmount: e.target.value,
                })
              }
            />

            <div className="modal-actions">
              <button onClick={() => setEditingProject(null)}>
                Cancel
              </button>

              <button
                className="action-btn publish"
                onClick={handleUpdateProject}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </NgoLayout>
  );
}

export default NGODashboard;