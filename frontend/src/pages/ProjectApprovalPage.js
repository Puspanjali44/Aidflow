import React, { useEffect, useState } from "react";

function ProjectApprovalPage() {
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState("under_review");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [filter]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const url =
        filter === "all"
          ? "http://localhost:5000/api/projects/admin/all"
          : `http://localhost:5000/api/projects/admin/all?status=${filter}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setProjects(data);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Fetch projects error:", error);
      alert("Server error");
    } finally {
      setLoading(false);
    }
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
        alert(data.message);
        fetchProjects();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Update project status error:", error);
      alert("Server error");
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "draft":
        return "Draft";
      case "under_review":
        return "Under Review";
      case "active":
        return "Approved";
      case "paused":
        return "Paused";
      case "completed":
        return "Completed";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  return (
    <div className="admin-page">
      <h1>Project Approval</h1>
      <p className="admin-subtitle">
        Review NGO-submitted projects before they become visible to donors.
      </p>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        {["under_review", "active", "rejected", "draft", "all"].map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              cursor: "pointer",
              background: filter === item ? "#111827" : "#fff",
              color: filter === item ? "#fff" : "#111",
            }}
          >
            {item === "under_review"
              ? "Under Review"
              : item === "active"
              ? "Approved"
              : item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      <div className="table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Project Title</th>
              <th>NGO</th>
              <th>Goal</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5">Loading projects...</td>
              </tr>
            ) : projects.length > 0 ? (
              projects.map((project) => (
                <tr key={project._id}>
                  <td>{project.title}</td>
                  <td>{project.ngo?.name || "No NGO"}</td>
                  <td>Rs. {Number(project.goalAmount || 0).toLocaleString()}</td>
                  <td>
                    <span className={`status-badge ${project.status}`}>
                      {getStatusLabel(project.status)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {project.status === "under_review" && (
                        <>
                          <button
                            className="approve-btn"
                            onClick={() => updateStatus(project._id, "active")}
                          >
                            Approve
                          </button>
                          <button
                            className="reject-btn"
                            onClick={() => updateStatus(project._id, "rejected")}
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {project.status === "draft" && (
                        <span style={{ color: "#666" }}>Not submitted yet</span>
                      )}

                      {project.status === "active" && (
                        <span style={{ color: "green", fontWeight: "600" }}>
                          Approved
                        </span>
                      )}

                      {project.status === "rejected" && (
                        <span style={{ color: "red", fontWeight: "600" }}>
                          Rejected
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No projects found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProjectApprovalPage;