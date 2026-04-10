import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import DonorSidebar from "./components/DonorSidebar";
import "./BrowseNGO.css";

function BrowseNGO() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedNiche, setSelectedNiche] = useState("All");

  const nicheOptions = [
    "All",
    "Education",
    "Health",
    "Women Empowerment",
    "Women Health",
    "Disaster Relief",
    "Environment",
    "Child Welfare",
    "Poverty Relief",
    "Community Development",
  ];

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

  const getNgoName = (project) => {
    if (project?.ngo?.organizationName) return project.ngo.organizationName;
    if (project?.ngo?.name) return project.ngo.name;
    if (project?.title) return project.title;
    return "Unknown Organization";
  };

  const getNgoCategory = (project) =>
    project?.ngo?.mainNiche ||
    project?.ngo?.category ||
    project?.ngoCategory ||
    "Non-Profit";

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    const searchedProjects = projects.filter((p) => {
      const ngoName = getNgoName(p).toLowerCase();
      const category = getNgoCategory(p).toLowerCase();
      const title = (p.title || "").toLowerCase();
      const description = (p.description || "").toLowerCase();

      const matchesSearch =
        !q ||
        ngoName.includes(q) ||
        title.includes(q) ||
        category.includes(q) ||
        description.includes(q);

      const matchesNiche =
        selectedNiche === "All" ||
        getNgoCategory(p).toLowerCase() === selectedNiche.toLowerCase();

      return matchesSearch && matchesNiche;
    });

    return [...searchedProjects].sort((a, b) => {
      const aRaised = Number(a?.raisedAmount || 0);
      const aGoal = Number(a?.goalAmount || 0);
      const bRaised = Number(b?.raisedAmount || 0);
      const bGoal = Number(b?.goalAmount || 0);

      const aCompleted = aGoal > 0 && aRaised >= aGoal;
      const bCompleted = bGoal > 0 && bRaised >= bGoal;

      if (aCompleted !== bCompleted) {
        return aCompleted ? 1 : -1;
      }

      return getNgoName(a).localeCompare(getNgoName(b));
    });
  }, [projects, search, selectedNiche]);

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

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            marginBottom: "22px",
          }}
        >
          {nicheOptions.map((niche) => (
            <button
              key={niche}
              onClick={() => setSelectedNiche(niche)}
              style={{
                padding: "10px 16px",
                borderRadius: "999px",
                border:
                  selectedNiche === niche
                    ? "1px solid #1e5631"
                    : "1px solid #d9e2d5",
                background:
                  selectedNiche === niche ? "#1e5631" : "#ffffff",
                color: selectedNiche === niche ? "#ffffff" : "#1e5631",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {niche}
            </button>
          ))}
        </div>

        <div className="ngo-grid">
          {filtered.length === 0 ? (
            <div className="empty-browse">
              <div className="empty-icon">📭</div>
              <p>No projects found.</p>
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

              const isCompleted = goalAmount > 0 && raisedAmount >= goalAmount;

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
                    <img
                      src={
                        project.image
                          ? `http://localhost:5000/uploads/${project.image}`
                          : "/default.jpg"
                      }
                      alt={project.title || ngoName}
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

                    {ngoName && <h2 className="ngo-main-name">{ngoName}</h2>}

                    {project.title &&
                      project.title !== ngoName &&
                      project.title !== "ffff" && (
                        <p className="ngo-subtitle">{project.title}</p>
                      )}

                    {isCompleted && (
                      <div className="ngo-completed-badge">🎉 Goal Completed</div>
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