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

  const getNgoName = (project) =>
    project?.ngo?.organizationName ||
    project?.ngoName ||
    project?.organizationName ||
    "Organization";

  const getNgoCategory = (project) =>
    project?.ngo?.category ||
    project?.ngoCategory ||
    project?.category ||
    "Non-Profit";

  const getRaisedAmount = (project) => {
    const raised = Number(project?.raisedAmount || 0);
    const goal = Number(project?.goalAmount || 0);

    if (goal <= 0) return raised;
    return Math.min(raised, goal);
  };

  const getDonorCount = (project) => Number(project?.donorCount || 0);

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "?");

  const getAvatarColor = (name) => {
    const colors = ["#1e5631", "#d4a843", "#2d6a4f", "#8B5E3C", "#3B82F6"];
    if (!name) return colors[0];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;

    const ngoName = getNgoName(p).toLowerCase();
    const ngoCategory = getNgoCategory(p).toLowerCase();
    const projectTitle = (p.title || "").toLowerCase();
    const projectDesc = (p.description || "").toLowerCase();

    return (
      projectTitle.includes(q) ||
      projectDesc.includes(q) ||
      ngoName.includes(q) ||
      ngoCategory.includes(q)
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
              const raisedAmount = getRaisedAmount(project);
              const goalAmount = Number(project?.goalAmount || 0);
              const donorCount = getDonorCount(project);

              const progress =
                goalAmount > 0
                  ? Math.min(
                      Math.round((raisedAmount / goalAmount) * 100),
                      100
                    )
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
                  <div className="ngo-card-image">
                    <div
                      className="ngo-avatar"
                      style={{ background: getAvatarColor(ngoName) }}
                    >
                      {getInitial(ngoName)}
                    </div>
                  </div>

                  <div className="ngo-card-body">
                    <div className="ngo-meta-row">
                      <span className="ngo-category">{ngoCategory}</span>
                      <span className="verified-badge">✓ Verified</span>
                    </div>

                    <h3 className="ngo-name">{ngoName}</h3>

                    <p className="ngo-desc">{project.title || "Untitled Project"}</p>

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
                      <span className="ngo-donors">👥 {donorCount} donors</span>
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