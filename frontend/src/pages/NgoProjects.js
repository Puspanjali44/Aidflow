import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NgoLayout from "../components/NgoLayout";
import "./NGODashboard.css";

function NgoProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState(null);

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

      if (res.ok) setProjects(data);
    } catch (error) {
      console.error("Error fetching projects");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (id) => {
    const token = localStorage.getItem("token");

    const res = await fetch(`http://localhost:5000/api/projects/${id}/submit`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) fetchProjects();
    else alert("Failed to submit project");
  };

  const handlePause = async (id) => {
    const token = localStorage.getItem("token");

    const res = await fetch(`http://localhost:5000/api/projects/${id}/pause`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) fetchProjects();
    else alert("Failed to pause project");
  };

  const handleResume = async (id) => {
    const token = localStorage.getItem("token");

    const res = await fetch(`http://localhost:5000/api/projects/${id}/resume`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) fetchProjects();
    else alert("Failed to resume project");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this draft project?")) return;

    const token = localStorage.getItem("token");

    const res = await fetch(`http://localhost:5000/api/projects/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) fetchProjects();
    else alert("Only draft projects can be deleted");
  };

  const handleEdit = (project) => {
    setEditingProject({ ...project });
  };

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
      alert("Update failed");
    }
  };

  return (
    <NgoLayout>
      <h1 className="page-title">Projects</h1>

      {loading ? (
        <div style={{ color: "#7a7a7a", padding: "40px 0" }}>Loading...</div>
      ) : projects.length === 0 ? (
        <div className="empty-text">No projects created yet.</div>
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
                  {project.status.replace("_", " ")}
                </span>
              </div>

              <p>{project.description}</p>

              <p style={{ fontSize: "13px", color: "#7a7a7a" }}>
                Rs. {project.raisedAmount?.toLocaleString()} raised of Rs.{" "}
                {project.goalAmount?.toLocaleString()}
              </p>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>

              <div className="project-actions">
                {/* OPEN PROJECT PAGE */}
                <button
                  className="action-btn publish"
                  onClick={() => navigate(`/projects/${project._id}`)}
                >
                  View Page
                </button>

                {project.status === "draft" && (
                  <>
                    <button
                      className="action-btn publish"
                      onClick={() => handleSubmit(project._id)}
                    >
                      Submit
                    </button>

                    <button
                      className="action-btn delete"
                      onClick={() => handleDelete(project._id)}
                    >
                      Delete
                    </button>
                  </>
                )}

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

      {/* EDIT PROJECT MODAL */}
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
              <button onClick={() => setEditingProject(null)}>Cancel</button>

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

export default NgoProjects;