import React, { useEffect, useState } from "react";
import NgoLayout from "../components/NgoLayout";
import "./Analytics.css";

const API = "http://localhost:5000";

function Analytics() {
  const [stats, setStats] = useState({
    totalRaised: 0,
    totalDonors: 0,
    avgDonation: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalGoal: 0,
    overallPct: 0,
  });

  const [donationTrends, setDonationTrends] = useState([]);
  const [donorGrowth, setDonorGrowth] = useState([]);
  const [projectPerformance, setProjectPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const monthLabel = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // same real endpoint used by NGO dashboard
      const projectsRes = await fetch(`${API}/api/projects/my`, { headers });
      if (!projectsRes.ok) throw new Error("Failed to fetch projects");

      const projectsData = await projectsRes.json();
      const projects = Array.isArray(projectsData) ? projectsData : [];

      const totalRaised = projects.reduce(
        (sum, p) => sum + Number(p.raisedAmount || 0),
        0
      );

      const totalGoal = projects.reduce(
        (sum, p) => sum + Number(p.goalAmount || 0),
        0
      );

      const totalDonors = projects.reduce(
        (sum, p) => sum + Number(p.donorCount || 0),
        0
      );

      const activeProjects = projects.filter((p) => p.status === "active").length;
      const completedProjects = projects.filter(
        (p) => p.status === "completed"
      ).length;

      const avgDonation =
        totalDonors > 0 ? Math.round(totalRaised / totalDonors) : 0;

      const overallPct =
        totalGoal > 0 ? Math.min(100, Math.round((totalRaised / totalGoal) * 100)) : 0;

      setStats({
        totalRaised,
        totalDonors,
        avgDonation,
        activeProjects,
        completedProjects,
        totalGoal,
        overallPct,
      });

      // project performance table uses real project data
      const performance = [...projects].sort(
        (a, b) => Number(b.raisedAmount || 0) - Number(a.raisedAmount || 0)
      );
      setProjectPerformance(performance);

      // build simple trend data from real project records
      // if you later add a dedicated donations table endpoint, replace this part
      const trendMap = {};
      const donorMap = {};

      projects.forEach((project) => {
        const key = monthLabel(project.createdAt || new Date());

        if (!trendMap[key]) trendMap[key] = 0;
        if (!donorMap[key]) donorMap[key] = 0;

        trendMap[key] += Number(project.raisedAmount || 0);
        donorMap[key] += Number(project.donorCount || 0);
      });

      const trendData = Object.entries(trendMap).map(([month, amount]) => ({
        month,
        amount,
      }));

      const growthData = Object.entries(donorMap).map(([month, count]) => ({
        month,
        count,
      }));

      setDonationTrends(trendData);
      setDonorGrowth(growthData);
    } catch (error) {
      console.error("Analytics error:", error);
      setStats({
        totalRaised: 0,
        totalDonors: 0,
        avgDonation: 0,
        activeProjects: 0,
        completedProjects: 0,
        totalGoal: 0,
        overallPct: 0,
      });
      setDonationTrends([]);
      setDonorGrowth([]);
      setProjectPerformance([]);
    } finally {
      setLoading(false);
    }
  };

  const maxTrendAmount = Math.max(
    ...donationTrends.map((item) => Number(item.amount || 0)),
    1
  );

  const maxGrowthCount = Math.max(
    ...donorGrowth.map((item) => Number(item.count || 0)),
    1
  );

  if (loading) {
    return (
      <NgoLayout>
        <div style={{ padding: "100px 0", textAlign: "center" }}>
          Loading analytics...
        </div>
      </NgoLayout>
    );
  }

  return (
    <NgoLayout>
      <div className="analytics-container">
        <h1 className="analytics-title">Analytics</h1>
        <p className="analytics-subtitle">
          Track your fundraising performance and donor engagement.
        </p>

        <div className="analytics-top-grid">
          <div className="analytics-card">
            <div className="card-icon">💰</div>
            <h3>TOTAL RAISED</h3>
            <p className="big-number">Rs. {stats.totalRaised.toLocaleString()}</p>
            <p className="growth neutral">{stats.overallPct}% of all goals</p>
          </div>

          <div className="analytics-card">
            <div className="card-icon">🤝</div>
            <h3>TOTAL DONORS</h3>
            <p className="big-number">{stats.totalDonors}</p>
            <p className="growth neutral">Across all projects</p>
          </div>

          <div className="analytics-card">
            <div className="card-icon">📊</div>
            <h3>AVG. DONATION</h3>
            <p className="big-number">Rs. {stats.avgDonation.toLocaleString()}</p>
            <p className="growth neutral">Per donor</p>
          </div>

          <div className="analytics-card">
            <div className="card-icon">📁</div>
            <h3>ACTIVE PROJECTS</h3>
            <p className="big-number">{stats.activeProjects}</p>
            <p className="growth neutral">{stats.completedProjects} completed</p>
          </div>
        </div>

        <div className="analytics-charts-grid">
          <div className="analytics-card">
            <h3>Donation Trends</h3>
            <div className="chart-placeholder">
              {donationTrends.length ? (
                <div className="bar-chart">
                  {donationTrends.map((item, i) => {
                    const amount = Number(item.amount || 0);
                    const height = `${(amount / maxTrendAmount) * 100}%`;

                    return (
                      <div key={i} className="bar-wrap">
                        <div
                          className="bar"
                          style={{ height }}
                          title={`Rs. ${amount.toLocaleString()}`}
                        />
                        <span>{item.month}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p>No trend data available</p>
              )}
            </div>
          </div>

          <div className="analytics-card">
            <h3>Donor Growth</h3>
            <div className="chart-placeholder">
              {donorGrowth.length ? (
                <div className="bar-chart">
                  {donorGrowth.map((item, i) => {
                    const count = Number(item.count || 0);
                    const height = `${(count / maxGrowthCount) * 100}%`;

                    return (
                      <div key={i} className="bar-wrap">
                        <div
                          className="bar"
                          style={{ height }}
                          title={`${count} donors`}
                        />
                        <span>{item.month}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p>No growth data available</p>
              )}
            </div>
          </div>
        </div>

        <div className="analytics-card table-card">
          <h3>Project Performance</h3>
          <table className="performance-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Raised</th>
                <th>Goal</th>
                <th>Donors</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {projectPerformance.length ? (
                projectPerformance.map((p) => {
                  const raisedAmount = Number(p.raisedAmount || 0);
                  const goalAmount = Number(p.goalAmount || 0);
                  const donorCount = Number(p.donorCount || 0);
                  const progress = goalAmount
                    ? Math.min(Math.round((raisedAmount / goalAmount) * 100), 100)
                    : 0;

                  return (
                    <tr key={p._id}>
                      <td>{p.title}</td>
                      <td>Rs. {raisedAmount.toLocaleString()}</td>
                      <td>Rs. {goalAmount.toLocaleString()}</td>
                      <td>{donorCount}</td>
                      <td>{progress}%</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>
                    No project performance data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </NgoLayout>
  );
}

export default Analytics;