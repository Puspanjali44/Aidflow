import React, { useEffect, useState } from "react";

function NgoProjects() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      const token = localStorage.getItem("token");

      const res = await fetch(
        "http://localhost:5000/api/projects/my",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await res.json();
      setProjects(data);
    };

    fetchProjects();
  }, []);

  return (
    <div className="page-container">
      <h2>My Projects</h2>

      {projects.map((project) => {
        const progress =
          (project.raisedAmount / project.goalAmount) * 100;

        return (
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

            <p>
              Rs. {project.raisedAmount} / Rs. {project.goalAmount}
            </p>

            <div
              style={{
                background: "#123",
                height: "8px",
                borderRadius: "4px"
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  background: "#00c896",
                  height: "100%",
                  borderRadius: "4px"
                }}
              />
            </div>

            <p>Status: {project.status}</p>
          </div>
        );
      })}
    </div>
  );
}

export default NgoProjects;