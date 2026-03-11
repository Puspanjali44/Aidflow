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
      setProjects(res.data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "?");

  const getAvatarColor = (name) => {
    const colors = ["#1e5631", "#d4a843", "#2d6a4f", "#8B5E3C", "#3B82F6"];
    if (!name) return colors[0];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (p.title || "").toLowerCase().includes(q) ||
      (p.ngo?.organizationName || "").toLowerCase().includes(q) ||
      (p.ngo?.category || "").toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#faf8f4" }}>
      <DonorSidebar />

      <div className="browse-container">
        <h1 className="browse-title">Browse NGOs</h1>
        <p className="browse-subtitle">Discover verified organizations making a difference.</p>

        {/* Search */}
        <div className="browse-search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search NGOs by name or cause..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Cards */}
        <div className="ngo-grid">
          {filtered.length === 0 ? (
            <div className="empty-browse">
              <div className="empty-icon">📭</div>
              <p>No active projects available.</p>
            </div>
          ) : (
            filtered.map((project, index) => {
              const ngoName = project.ngo?.organizationName || "NGO";
              const progress =
                project.goalAmount > 0
                  ? Math.min(
                      Math.round(
                        ((project.raisedAmount || 0) / project.goalAmount) * 100
                      ),
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
                  {/* Card image area with avatar */}
                  <div className="ngo-card-image">
                    <div
                      className="ngo-avatar"
                      style={{ background: getAvatarColor(ngoName) }}
                    >
                      {getInitial(ngoName)}
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="ngo-card-body">
                    <div className="ngo-meta-row">
                      <span className="ngo-category">
                        {project.ngo?.category || "Non-Profit"}
                      </span>
                      <span className="verified-badge">✓ Verified</span>
                    </div>

                    <h3 className="ngo-name">{ngoName}</h3>

                    <p className="ngo-desc">{project.title}</p>

                    {/* Progress */}
                    {project.goalAmount > 0 && (
                      <div className="ngo-progress-section">
                        <div className="ngo-progress-row">
                          <span>
                            NPR {(project.raisedAmount || 0).toLocaleString()}{" "}
                            raised
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

                    {/* Footer */}
                    <div className="ngo-card-footer">
                      <span className="ngo-donors">
                        👥 {project.donorCount || 0} donors
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