import React, { useCallback, useEffect, useState } from "react";

function ProjectApprovalPage() {
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState("under_review");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedProject, setSelectedProject] = useState(null); // For preview modal

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login as admin first.");
        return;
      }

      const url = filter === "all"
        ? "http://localhost:5000/api/projects/admin/all"
        : `http://localhost:5000/api/projects/admin/all?status=${filter}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (res.ok) {
        setProjects(Array.isArray(data) ? data : []);
      } else {
        if (res.status === 403) {
          setError("Access denied: You need admin permissions.");
        } else {
          setError(data.message || "Failed to fetch projects");
        }
      }
    } catch (err) {
      console.error(err);
      setError("Server error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Open full project details in modal
  const openPreview = (project) => {
    setSelectedProject(project);
  };

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/projects/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message || `Project ${status === "active" ? "Approved" : "Rejected"}!`);
        setSelectedProject(null);
        fetchProjects();
      } else {
        alert(data.message || "Failed to update status");
      }
    } catch (err) {
      alert("Server error");
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "draft": return "Draft";
      case "under_review": return "Under Review";
      case "active": return "Approved";
      case "rejected": return "Rejected";
      default: return status;
    }
  };

  return (
    <div style={{ padding: "32px", fontFamily: "Arial, sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      <h1 style={{ margin: "0 0 8px 0" }}>Project Approval</h1>
      <p style={{ color: "#475569", marginBottom: "24px" }}>
        Review NGO-submitted projects before they become visible to donors.
      </p>

      {/* Filter Tabs - Matching your screenshot */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
        {["under_review", "active", "rejected", "draft", "all"].map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            style={{
              padding: "10px 20px",
              borderRadius: "999px",
              border: "none",
              background: filter === item ? "#111827" : "#e2e8f0",
              color: filter === item ? "#fff" : "#334155",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            {item === "under_review" ? "Under Review" :
             item === "active" ? "Approved" : 
             item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: "#fee2e2", color: "#991b1b", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      <div style={{ background: "white", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <th style={{ padding: "16px", textAlign: "left" }}>Project Title</th>
              <th style={{ padding: "16px", textAlign: "left" }}>NGO</th>
              <th style={{ padding: "16px", textAlign: "left" }}>Goal</th>
              <th style={{ padding: "16px", textAlign: "left" }}>Status</th>
              <th style={{ padding: "16px", textAlign: "left" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: "center", padding: "60px" }}>Loading...</td></tr>
            ) : projects.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: "center", padding: "60px", color: "#666" }}>No projects found</td></tr>
            ) : (
              projects.map((project) => (
                <tr key={project._id} style={{ borderTop: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "16px", fontWeight: "500" }}>{project.title}</td>
                  <td style={{ padding: "16px" }}>
                    {project.ngo?.name || project.ngoName || "No NGO"}
                  </td>
                  <td style={{ padding: "16px" }}>Rs. {Number(project.goalAmount || 0).toLocaleString()}</td>
                  <td style={{ padding: "16px" }}>
                    <span style={{
                      padding: "6px 14px",
                      borderRadius: "999px",
                      fontSize: "13px",
                      background: project.status === "under_review" ? "#fef3c7" : "#e2e8f0",
                      color: project.status === "under_review" ? "#92400e" : "#334155"
                    }}>
                      {getStatusLabel(project.status)}
                    </span>
                  </td>
                  <td style={{ padding: "16px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {project.status === "under_review" && (
                        <>
                          <button
                            onClick={() => updateStatus(project._id, "active")}
                            style={{ background: "#16a34a", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateStatus(project._id, "rejected")}
                            style={{ background: "#dc2626", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => openPreview(project)}
                        style={{ background: "#3b82f6", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}
                      >
                        Preview Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Preview Modal - Shows full details sent by NGO */}
      {selectedProject && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            background: "white", borderRadius: "16px", width: "90%", maxWidth: "650px",
            maxHeight: "90vh", overflow: "auto", boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
          }}>
            <div style={{ padding: "24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between" }}>
              <h2>Project Details Preview</h2>
              <button onClick={() => setSelectedProject(null)} style={{ fontSize: "28px", background: "none", border: "none", cursor: "pointer" }}>×</button>
            </div>

            <div style={{ padding: "24px" }}>
              <h3 style={{ margin: "0 0 16px 0" }}>{selectedProject.title}</h3>
              <p style={{ lineHeight: "1.7", color: "#334155", whiteSpace: "pre-wrap" }}>
                {selectedProject.description || "No description provided."}
              </p>

              <div style={{ marginTop: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <strong>Funding Goal</strong>
                  <p>Rs. {Number(selectedProject.goalAmount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <strong>End Date</strong>
                  <p>{selectedProject.endDate ? new Date(selectedProject.endDate).toLocaleDateString() : "Not set"}</p>
                </div>
              </div>

              {selectedProject.status === "under_review" && (
                <div style={{ marginTop: "32px", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                  <button onClick={() => updateStatus(selectedProject._id, "active")} style={{ background: "#16a34a", color: "white", padding: "12px 24px", border: "none", borderRadius: "8px" }}>
                    Approve Project
                  </button>
                  <button onClick={() => updateStatus(selectedProject._id, "rejected")} style={{ background: "#dc2626", color: "white", padding: "12px 24px", border: "none", borderRadius: "8px" }}>
                    Reject Project
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectApprovalPage;