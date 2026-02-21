import React, { useEffect, useState } from "react";

function AdminDashboard() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const token = localStorage.getItem("token");

    const res = await fetch(
      "http://localhost:5000/api/projects/admin/all",
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const data = await res.json();
    if (res.ok) setProjects(data);
  };

  const approveProject = async (id) => {
    const token = localStorage.getItem("token");

    await fetch(
      `http://localhost:5000/api/projects/${id}/approve`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    fetchProjects();
  };

  const rejectProject = async (id) => {
    const token = localStorage.getItem("token");

    await fetch(
      `http://localhost:5000/api/projects/${id}/reject`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    fetchProjects();
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Admin Dashboard</h1>

      {projects.map((project) => (
        <div
          key={project._id}
          style={{
            background: "#0f2b3d",
            padding: "20px",
            marginBottom: "20px",
            borderRadius: "10px"
          }}
        >
          <h3>{project.title}</h3>
          <p>{project.description}</p>
          <p>NGO: {project.ngo?.name}</p>
          <p>Status: {project.status}</p>

          {project.status === "under_review" && (
            <>
              <button onClick={() => approveProject(project._id)}>
                Approve
              </button>

              <button onClick={() => rejectProject(project._id)}>
                Reject
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default AdminDashboard;