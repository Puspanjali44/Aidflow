import React, { useEffect, useState } from "react";
import NgoLayout from "../components/NgoLayout";
import "./NGODashboard.css";

function NGODashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        "http://localhost:5000/api/projects/my",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (res.ok) setProjects(data);
    } catch (error) {
      console.error("Error fetching projects");
    } finally {
      setLoading(false);
    }
  };

  // ================= REAL CALCULATED STATS =================

  const totalRaised = projects.reduce(
    (sum, project) => sum + (project.raisedAmount || 0),
    0
  );

  const totalDonors = projects.reduce(
    (sum, project) => sum + (project.donorCount || 0),
    0
  );

  const activeProjects = projects.filter(
    (project) => project.status === "active"
  ).length;

  const avgDonation =
    totalDonors > 0 ? Math.round(totalRaised / totalDonors) : 0;

  return (
    <NgoLayout>
      <h1 className="page-title">NGO Dashboard</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {/* ================= STAT CARDS ================= */}
          <div className="stats-grid">

            <div className="stat-card">
              <h4>Total Raised</h4>
              <p>Rs. {totalRaised.toLocaleString()}</p>
            </div>

            <div className="stat-card">
              <h4>Active Projects</h4>
              <p>{activeProjects}</p>
            </div>

            <div className="stat-card">
              <h4>Total Donors</h4>
              <p>{totalDonors}</p>
            </div>

            <div className="stat-card">
              <h4>Avg. Donation</h4>
              <p>Rs. {avgDonation.toLocaleString()}</p>
            </div>

          </div>

          {/* ================= PROJECT FUNDING OVERVIEW ================= */}
          <div className="section">
            <h2>Project Funding Overview</h2>

            {projects.map((project) => {
              const progress =
                project.goalAmount > 0
                  ? (project.raisedAmount / project.goalAmount) * 100
                  : 0;

              return (
                <div key={project._id} className="project-overview-card">
                  <div className="project-overview-header">
                    <h3>{project.title}</h3>
                    <span>{Math.round(progress)}%</span>
                  </div>

                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <p>
                    Rs. {project.raisedAmount.toLocaleString()} raised of Rs.{" "}
                    {project.goalAmount.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </NgoLayout>
  );
}

export default NGODashboard;