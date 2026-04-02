import React, { useEffect, useMemo, useState } from "react";
import DonorSidebar from "./components/DonorSidebar";
import "./Badges.css";

const API = "http://localhost:5000/api";

function Badges() {
  const [donations, setDonations] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardError, setLeaderboardError] = useState("");

  useEffect(() => {
    fetch(`${API}/donations/my`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setDonations(Array.isArray(data) ? data : []))
      .catch(() => setDonations([]));
  }, []);

  useEffect(() => {
    fetch(`${API}/donations/leaderboard`)
      .then((res) => {
        if (!res.ok) throw new Error("Leaderboard unavailable");
        return res.json();
      })
      .then((data) => {
        setLeaderboard(Array.isArray(data) ? data : []);
        setLeaderboardError("");
      })
      .catch(() => {
        setLeaderboard([]);
        setLeaderboardError("Leaderboard not available yet.");
      });
  }, []);

  const stats = useMemo(() => {
    const totalDonated = donations.reduce((sum, d) => sum + Number(d.amount || 0), 0);
    const donationCount = donations.length;

    const uniqueProjects = new Set(
      donations.map((d) =>
        typeof d.project === "object" ? d.project?._id : d.project
      )
    ).size;

    const thisMonthTotal = donations
      .filter((d) => {
        const created = new Date(d.createdAt);
        const now = new Date();
        return (
          created.getMonth() === now.getMonth() &&
          created.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, d) => sum + Number(d.amount || 0), 0);

    const points =
      donationCount * 50 +
      Math.floor(totalDonated / 100) +
      uniqueProjects * 100;

    let level = "Bronze";
    if (points >= 5000) level = "Gold";
    else if (points >= 2000) level = "Silver";

    const nextLevelTarget =
      level === "Bronze" ? 2000 : level === "Silver" ? 5000 : points;

    const currentLevelBase =
      level === "Bronze" ? 0 : level === "Silver" ? 2000 : 5000;

    const levelProgress =
      level === "Gold"
        ? 100
        : Math.min(
            100,
            Math.round(
              ((points - currentLevelBase) / (nextLevelTarget - currentLevelBase)) * 100
            )
          );

    return {
      totalDonated,
      donationCount,
      uniqueProjects,
      thisMonthTotal,
      points,
      level,
      nextLevelTarget,
      levelProgress,
    };
  }, [donations]);

  const allBadges = [
    {
      emoji: "🎉",
      title: "First Donation",
      desc: "Made your first donation",
      condition: stats.donationCount >= 1,
    },
    {
      emoji: "💖",
      title: "Generous Heart",
      desc: `Donated NPR ${stats.totalDonated.toLocaleString("en-IN")} / 10,000`,
      condition: stats.totalDonated >= 10000,
    },
    {
      emoji: "📚",
      title: "Supporter",
      desc: `Supported ${stats.uniqueProjects} / 3 projects`,
      condition: stats.uniqueProjects >= 3,
    },
    {
      emoji: "🌍",
      title: "Community Builder",
      desc: `Supported ${stats.uniqueProjects} / 5 projects`,
      condition: stats.uniqueProjects >= 5,
    },
    {
      emoji: "🏆",
      title: "Top Donor",
      desc: `Donated NPR ${stats.totalDonated.toLocaleString("en-IN")} / 50,000`,
      condition: stats.totalDonated >= 50000,
    },
    {
      emoji: "⚡",
      title: "Active Giver",
      desc: `Made ${stats.donationCount} / 10 donations`,
      condition: stats.donationCount >= 10,
    },
  ];

  const earnedBadges = allBadges.filter((b) => b.condition);
  const lockedBadges = allBadges.filter((b) => !b.condition);

  const earned = earnedBadges.length;
  const total = allBadges.length;
  const badgeProgressPercent = Math.round((earned / total) * 100);

  return (
    <div className="badges-wrapper">
      <DonorSidebar />

      <div className="badges-content">
        <h1 className="badges-title">Badges & Rewards</h1>
        <p className="badges-subtitle">
          Earn badges, collect donor points, and climb the leaderboard.
        </p>

        <div className="badges-top-grid">
          <div className="badges-progress-banner">
            <div className="progress-banner-top">
              <h3>Badge Progress</h3>
              <span>
                {earned} / {total} earned
              </span>
            </div>
            <div className="progress-banner-bar">
              <div
                className="progress-banner-fill"
                style={{ width: `${badgeProgressPercent}%` }}
              />
            </div>
            <p className="progress-banner-hint">
              Keep donating to unlock more achievements!
            </p>
          </div>

          <div className="points-card">
            <div className="points-card-top">
              <h3>Your Donor Points</h3>
              <span className="level-badge">{stats.level}</span>
            </div>

            <div className="points-number">{stats.points.toLocaleString("en-IN")}</div>

            <div className="points-meta">
              <span>Total Donated: NPR {stats.totalDonated.toLocaleString("en-IN")}</span>
              <span>This Month: NPR {stats.thisMonthTotal.toLocaleString("en-IN")}</span>
            </div>

            <div className="level-track">
              <div
                className="level-fill"
                style={{ width: `${stats.levelProgress}%` }}
              />
            </div>

            <p className="level-hint">
              {stats.level === "Gold"
                ? "You’ve reached the highest donor level."
                : `Reach ${stats.nextLevelTarget.toLocaleString("en-IN")} points for the next level.`}
            </p>
          </div>
        </div>

        <div className="stats-mini-grid">
          <div className="mini-stat-card">
            <span className="mini-stat-label">Donations</span>
            <strong className="mini-stat-value">{stats.donationCount}</strong>
          </div>
          <div className="mini-stat-card">
            <span className="mini-stat-label">Projects Supported</span>
            <strong className="mini-stat-value">{stats.uniqueProjects}</strong>
          </div>
          <div className="mini-stat-card">
            <span className="mini-stat-label">Total Donated</span>
            <strong className="mini-stat-value">
              NPR {stats.totalDonated.toLocaleString("en-IN")}
            </strong>
          </div>
        </div>

        <h2 className="badges-section-title">Earned</h2>
        <div className="badges-grid">
          {earnedBadges.length === 0 ? (
            <div className="badges-empty">No badges earned yet.</div>
          ) : (
            earnedBadges.map((badge, i) => (
              <div
                key={badge.title}
                className="badge-card earned"
                style={{
                  animation: "slideUp 0.4s ease both",
                  animationDelay: `${i * 0.06}s`,
                }}
              >
                <div className="badge-emoji">{badge.emoji}</div>
                <div className="badge-name">{badge.title}</div>
                <div className="badge-desc">{badge.desc}</div>
              </div>
            ))
          )}
        </div>

        <h2 className="badges-section-title">Locked</h2>
        <div className="badges-grid">
          {lockedBadges.map((badge, i) => (
            <div
              key={badge.title}
              className="badge-card locked"
              style={{
                animation: "slideUp 0.4s ease both",
                animationDelay: `${(earned + i) * 0.06}s`,
              }}
            >
              <div className="badge-emoji">{badge.emoji}</div>
              <div className="badge-name">{badge.title}</div>
              <div className="badge-desc">{badge.desc}</div>
            </div>
          ))}
        </div>

        <h2 className="badges-section-title">Leaderboard</h2>
        <div className="leaderboard-card">
          {leaderboardError ? (
            <div className="badges-empty">{leaderboardError}</div>
          ) : leaderboard.length === 0 ? (
            <div className="badges-empty">No leaderboard data yet.</div>
          ) : (
            <div className="leaderboard-list">
              {leaderboard.map((user, index) => (
                <div className="leaderboard-row" key={user._id || index}>
                  <div className="leaderboard-left">
                    <span className="leaderboard-rank">#{index + 1}</span>
                    <div className="leaderboard-avatar">
                      {(user.name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="leaderboard-name">{user.name || "Anonymous Donor"}</div>
                      <div className="leaderboard-sub">
                        {user.donationCount || 0} donations
                      </div>
                    </div>
                  </div>

                  <div className="leaderboard-right">
                    <div className="leaderboard-points">
                      {(user.points || 0).toLocaleString("en-IN")} pts
                    </div>
                    <div className="leaderboard-amount">
                      NPR {(user.totalDonated || 0).toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Badges;