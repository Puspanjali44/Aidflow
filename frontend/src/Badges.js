import React from "react";
import DonorSidebar from "./components/DonorSidebar";
import "./Badges.css";

const earnedBadges = [
  { emoji: "", title: "First Donation", desc: "Made your first donation" },
  { emoji: "", title: "Generous Heart", desc: "Donated over NPR 10,000" },
  { emoji: "", title: "Education Champion", desc: "Supported 3 education projects" },
  { emoji: "", title: "Recurring Hero", desc: "Set up recurring donations" },
];

const lockedBadges = [
  { emoji: "", title: "Top Donor", desc: "Ranked in top 10 donors" },
  { emoji: "", title: "Community Builder", desc: "Donated to 5 different NGOs" },
];

function Badges() {
  const earned = earnedBadges.length;
  const total = earnedBadges.length + lockedBadges.length;
  const progressPercent = Math.round((earned / total) * 100);

  return (
    <div className="badges-wrapper">
      <DonorSidebar />

      <div className="badges-content">
        <h1 className="badges-title">Badges</h1>
        <p className="badges-subtitle">
          Earn badges by making donations and supporting projects.
        </p>

        {/* Progress Banner */}
        <div className="badges-progress-banner">
          <div className="progress-banner-top">
            <h3>Badge Progress</h3>
            <span>{earned} / {total} earned</span>
          </div>
          <div className="progress-banner-bar">
            <div
              className="progress-banner-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="progress-banner-hint">
            Keep donating to unlock more achievements!
          </p>
        </div>

        {/* Earned */}
        <h2 className="badges-section-title">Earned</h2>
        <div className="badges-grid">
          {earnedBadges.map((badge, i) => (
            <div
              key={i}
              className="badge-card earned"
              style={{ animation: "slideUp 0.4s ease both", animationDelay: `${i * 0.06}s` }}
            >
              <div className="badge-emoji">{badge.emoji}</div>
              <div className="badge-name">{badge.title}</div>
              <div className="badge-desc">{badge.desc}</div>
            </div>
          ))}
        </div>

        {/* Locked */}
        <h2 className="badges-section-title">Locked</h2>
        <div className="badges-grid">
          {lockedBadges.map((badge, i) => (
            <div
              key={i}
              className="badge-card locked"
              style={{ animation: "slideUp 0.4s ease both", animationDelay: `${(earnedBadges.length + i) * 0.06}s` }}
            >
              <div className="badge-emoji">{badge.emoji}</div>
              <div className="badge-name">{badge.title}</div>
              <div className="badge-desc">{badge.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Badges;