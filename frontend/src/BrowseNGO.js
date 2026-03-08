import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import DonorSidebar from "./components/DonorSidebar";
import "./BrowseNGO.css";

function BrowseNGO() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/projects/public"
      );
      setProjects(res.data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      
      {/* Sidebar */}
      <DonorSidebar />

      {/* Main Content */}
      <div style={{ flex: 1, padding: "40px" }}>
        <h1 className="title">Browse NGOs</h1>

        <div className="ngo-grid">
          {projects.length === 0 ? (
            <p>No active projects available.</p>
          ) : (
            projects.map((project) => (
              <div key={project._id} className="ngo-card">
                
                <div className="image-placeholder"></div>

                <div className="ngo-body">
                  <h3>{project.ngo?.organizationName}</h3>

                  <p className="category">
                    {project.ngo?.category} • <span>Verified</span>
                  </p>

                  <p className="desc">
                    {project.title}
                  </p>

                  <button
                    className="view-btn"
                    onClick={() =>
                      navigate(`/project/${project._id}`)
                    }
                  >
                    View Project
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default BrowseNGO;