import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import DonorSidebar from "./components/DonorSidebar";
import "./BrowseNGO.css";

function BrowseNGO() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/projects/public");
      setProjects(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
    }
  };

  // ✅ FIXED NGO NAME (NO MORE "Organization" OR "ffff")
  
  const getNgoName = (project) => {
  if (project?.ngo?.organizationName) return project.ngo.organizationName;

  // fallback ONLY if really missing
  if (project?.title) return project.title;

  return "Unknown Organization"; // no more "NGO"
};

  const getNgoCategory = (project) =>
    project?.ngo?.category ||
    project?.ngoCategory ||
    "Non-Profit";

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;

    return (
      (p.title || "").toLowerCase().includes(q) ||
      getNgoName(p).toLowerCase().includes(q) ||
      getNgoCategory(p).toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#faf8f4" }}>
      <DonorSidebar />

      <div className="browse-container">
        <h1 className="browse-title">Browse NGOs</h1>
        <p className="browse-subtitle">
          Discover verified organizations making a difference.
        </p>

        <div className="browse-search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search NGOs by name or cause..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="ngo-grid">
          {filtered.length === 0 ? (
            <div className="empty-browse">
              <div className="empty-icon">📭</div>
              <p>No active projects available.</p>
            </div>
          ) : (
            filtered.map((project, index) => {
              const ngoName = getNgoName(project);
              const ngoCategory = getNgoCategory(project);

              const raisedAmount = Number(project?.raisedAmount || 0);
              const goalAmount = Number(project?.goalAmount || 0);
              const donorCount = Number(project?.donorCount || 0);

              const progress =
                goalAmount > 0
                  ? Math.min(Math.round((raisedAmount / goalAmount) * 100), 100)
                  : 0;

              return (
                <div
                  key={project._id}
                  className="ngo-card"
                  style={{
                    animation: "slideUp 0.4s ease both",
                    animationDelay: `${index * 0.06}s`,
                  }}
                >
                  {/* ✅ COVER IMAGE */}
                  <div className="ngo-card-image">
                    <img
                      src={
                        project.image
                          ? `http://localhost:5000/uploads/${project.image}`
                          : "/default.jpg"
                      }
                      alt={project.title}
                      className="ngo-cover-img"
                      onError={(e) => {
                        e.target.src = "/default.jpg";
                      }}
                    />
                  </div>

                  <div className="ngo-card-body">
                    <div className="ngo-meta-row">
                      <span className="ngo-category">{ngoCategory}</span>
                      <span className="verified-badge">✓ Verified</span>
                    </div>

                   {ngoName && (
  <h2 className="ngo-main-name">{ngoName}</h2>
)}

                    {/* ✅ ONLY SHOW TITLE IF NOT GARBAGE */}
                    {project.title && project.title !== "ffff" && (
                      <p className="ngo-subtitle">{project.title}</p>
                    )}

                    {/* ✅ COMPLETED BADGE */}
                    {goalAmount > 0 && raisedAmount >= goalAmount && (
                      <div className="ngo-completed-badge">
                        🎉 Goal Completed
                      </div>
                    )}

                    {goalAmount > 0 && (
                      <div className="ngo-progress-section">
                        <div className="ngo-progress-row">
                          <span>
                            NPR {raisedAmount.toLocaleString("en-IN")} raised
                          </span>
                          <span>{progress}%</span>
                        </div>

                        <div className="ngo-progress-bar">
                          <div
                            className="ngo-progress-fill"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="ngo-card-footer">
                      <span className="ngo-donors">
                        👥 {donorCount} donors
                      </span>

                      <button
                        className="view-project-btn"
                        onClick={() => navigate(`/project/${project._id}`)}
                      >
                        View Project →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default BrowseNGO;