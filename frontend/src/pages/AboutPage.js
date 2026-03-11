import React from "react";
import { useNavigate } from "react-router-dom";
import "./AboutPage.css";

function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="about-container">

      {/* ═══════ NAVBAR ═══════ */}
      <nav className="navbar">
        <div className="nav-brand" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <div className="brand-circle" />
          <span className="logo-text">AidFlow</span>
        </div>

        <div className="nav-links">
          <button onClick={() => navigate("/")}>Home</button>
          <button className="active">About</button>
        </div>

        <div className="nav-buttons">
          <button className="login-btn" onClick={() => navigate("/login")}>
            Log In
          </button>
          <button className="getstarted-btn" onClick={() => navigate("/login")}>
            Get Started
          </button>
        </div>
      </nav>

      {/* ═══════ HERO ═══════ */}
      <section className="about-hero">
        <div className="about-badge">About AidFlow</div>
        <h1>Reimagining Philanthropy in Nepal</h1>
        <p>
          AidFlow was born from the belief that every act of generosity
          deserves transparency, trust, and impact. We bridge the gap between
          willing donors and verified organizations across Nepal.
        </p>
      </section>

      {/* ═══════ MISSION + PROBLEM ═══════ */}
      <section className="about-grid">
        <div className="about-card">
          <div className="card-icon">💡</div>
          <h3>Our Mission</h3>
          <p>
            To create a centralized, transparent donation management system
            that connects generous donors with verified NGOs across Nepal.
            We aim to restore confidence in charitable giving by providing
            real-time tracking, verified impact reports, and a community-driven
            platform.
          </p>
        </div>

        <div className="about-card">
          <div className="card-icon">♥</div>
          <h3>The Problem We Solve</h3>
          <p>
            Nepal's donation ecosystem is fragmented and lacks transparency.
            Donors struggle to find credible organizations, and NGOs lack tools
            to demonstrate their impact. AidFlow solves this by creating a
            unified platform with verification, tracking, and accountability
            built in.
          </p>
        </div>
      </section>

      {/* ═══════ VALUES ═══════ */}
      <section className="values-section">
        <h2>Our Values</h2>
        <p>The principles that guide everything we do.</p>

        <div className="values-grid">
          {[
            {
              icon: "🛡",
              title: "Trust & Verification",
              desc: "Every organization undergoes thorough verification before listing on our platform.",
            },
            {
              icon: "👁",
              title: "Full Transparency",
              desc: "Real-time tracking with receipts, photos, and progress reports for every donation.",
            },
            {
              icon: "👥",
              title: "Community First",
              desc: "We prioritize local communities and ensure donations reach those who need them most.",
            },
            {
              icon: "🎯",
              title: "Impact Focused",
              desc: "Every feature is designed to maximize the positive impact of your contributions.",
            },
          ].map((value, i) => (
            <div className="value-card" key={i}>
              <div className="value-icon">{value.icon}</div>
              <h4>{value.title}</h4>
              <p>{value.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ TECH ═══════ */}
      <section className="tech-section">
        <h2>Built With Modern Technology</h2>
        <p>
          AidFlow leverages cutting-edge technologies to deliver a fast,
          secure, and reliable platform.
        </p>

        <div className="tech-tags">
          <span>React.js</span>
          <span>Node.js</span>
          <span>MongoDB</span>
          <span>Express</span>
          <span>JWT Auth</span>
          <span>Cloud Hosting</span>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="footer">
        <div className="brand-circle small" />
        <p>© 2026 AidFlow. All rights reserved. Built with ❤ for Nepal.</p>
      </footer>

    </div>
  );
}

export default AboutPage;