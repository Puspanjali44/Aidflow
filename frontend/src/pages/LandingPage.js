import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

function LandingPage() {
  const navigate = useNavigate();
  const animateRefs = useRef([]);

  // Scroll reveal animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.15 }
    );

    animateRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const addRef = (el) => {
    if (el && !animateRefs.current.includes(el)) {
      animateRefs.current.push(el);
    }
  };

  return (
    <div className="landing-container">

      {/* ═══════ NAVBAR ═══════ */}
      <nav className="navbar">
        <div className="nav-brand">
          <div className="nav-brand-icon">♥</div>
          <span className="logo">AidFlow</span>
        </div>

        <div className="nav-links">
          <button className="active">Home</button>
          <button onClick={() => navigate("/about")}>About</button>
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
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            Transparent Giving for Nepal
            <span className="badge-flag">NP</span>
          </div>

          <h1>
            Every Donation
            <span>Tells a Story</span>
          </h1>

          <p className="hero-desc">
            AidFlow connects generous hearts with verified NGOs across Nepal.
            Track your impact in real-time and see exactly how your contribution
            changes lives.
          </p>

          <div className="hero-buttons">
            <button className="primary-cta" onClick={() => navigate("/login")}>
              Get Started →
            </button>
            <button className="secondary-cta" onClick={() => navigate("/about")}>
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* ═══════ STATS ═══════ */}
      <section className="stats-section" ref={addRef}>
        <div className="stat-box">
          <div className="stat-icon">🏛</div>
          <h2>30+</h2>
          <p>Verified NGOs</p>
        </div>
        <div className="stat-box">
          <div className="stat-icon">👥</div>
          <h2>1,500+</h2>
          <p>Donors</p>
        </div>
        <div className="stat-box">
          <div className="stat-icon">♥</div>
          <h2>50L+</h2>
          <p>Raised (NPR)</p>
        </div>
        <div className="stat-box">
          <div className="stat-icon">🌍</div>
          <h2>75+</h2>
          <p>Communities</p>
        </div>
      </section>

      {/* ═══════ WHY CHOOSE ═══════ */}
      <section className="why-section">
        <h2 ref={addRef} className="animate-on-scroll">Why Choose AidFlow?</h2>
        <p ref={addRef} className="animate-on-scroll">
          We bridge the trust gap in Nepal's philanthropic ecosystem with
          technology and transparency.
        </p>

        <div className="features-grid">
          {[
            {
              icon: "🛡",
              title: "Verified Organizations",
              desc: "Every NGO on our platform undergoes a thorough vetting process to ensure credibility and legitimacy.",
            },
            {
              icon: "📊",
              title: "Real-Time Tracking",
              desc: "Track exactly how your donation is being used with receipts, progress updates, and photo evidence.",
            },
            {
              icon: "📍",
              title: "Interactive Map",
              desc: "Discover verified NGOs and community projects near you through our interactive map interface.",
            },
            {
              icon: "🏆",
              title: "Gamification & Rewards",
              desc: "Earn badges, points, and climb the leaderboard as you contribute to making Nepal better.",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="feature-card animate-on-scroll"
              ref={addRef}
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section className="how-section">
        <h2 ref={addRef} className="animate-on-scroll">How It Works</h2>
        <p ref={addRef} className="animate-on-scroll">
          Three simple steps to make a meaningful impact.
        </p>

        <div className="steps-grid">
          {[
            {
              num: "01",
              title: "Explore",
              desc: "Browse verified NGOs and projects across Nepal by cause, location, or need.",
            },
            {
              num: "02",
              title: "Donate",
              desc: "Make secure one-time or recurring donations through trusted payment gateways.",
            },
            {
              num: "03",
              title: "Track",
              desc: "Follow your donation's journey with real-time updates, photos, and impact reports.",
            },
          ].map((step, i) => (
            <div
              key={i}
              className="step-item animate-on-scroll"
              ref={addRef}
              style={{ transitionDelay: `${i * 0.12}s` }}
            >
              <div className="step-number">{step.num}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ CTA BANNER ═══════ */}
      <section className="cta-banner" ref={addRef}>
        <h2>Ready to Make a Difference?</h2>
        <p>
          Join thousands of donors who are changing lives across Nepal with
          transparent, trustworthy giving.
        </p>
        <div className="cta-banner-buttons">
          <button className="cta-white-btn" onClick={() => navigate("/login")}>
            Start Donating
          </button>
          <button className="cta-outline-btn" onClick={() => navigate("/about")}>
            Learn More
          </button>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="logo">
              <span className="footer-heart">♥</span> AidFlow
            </div>
            <p>
              Transparent, trustworthy donation management for Nepal.
              Connecting generous hearts with verified causes.
            </p>
          </div>

          <div className="footer-col">
            <h4>Platform</h4>
            <a href="/">Home</a>
            <a href="/about">About Us</a>
            <a href="/">Get Started</a>
          </div>

          <div className="footer-col">
            <h4>Support</h4>
            <a href="/">FAQ</a>
            <a href="/">Contact Us</a>
            <a href="/">Privacy Policy</a>
          </div>

          <div className="footer-col">
            <h4>Connect</h4>
            <a href="/">Facebook</a>
            <a href="/">Twitter</a>
            <a href="/">Instagram</a>
          </div>
        </div>

        <div className="footer-bottom">
          © 2026 AidFlow. All rights reserved. Built with <span>❤</span> for Nepal.
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;