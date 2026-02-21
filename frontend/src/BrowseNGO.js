import React from "react";
import { useNavigate } from "react-router-dom";
import "./BrowseNGO.css";

function BrowseNGO() {
  const navigate = useNavigate();

  const ngos = [
    {
      name: "Future Kids Nepal",
      category: "Education",
      description: "Providing access to rural education and learning support."
    },
    {
      name: "Hope Relief",
      category: "Disaster Relief",
      description: "Emergency response and shelter distribution."
    },
    {
      name: "Women Rise Nepal",
      category: "Women Empowerment",
      description: "Skills training and small-business development programs."
    }
  ];

  return (
    <div className="browse-page">

      {/* HEADER */}
      <div className="topbar">
        <h2>AidFlow</h2>
      </div>

      <div className="content">

        {/* BACK BUTTON */}
        <button
          className="back-btn"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <h1 className="title">Browse NGOs</h1>

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search NGOs, causes..."
          className="search"
        />

        {/* FILTER BUTTONS */}
        <div className="filters">
          <button className="active">All</button>
          <button>Education</button>
          <button>Health</button>
          <button>Women</button>
          <button>Disaster Relief</button>
        </div>

        {/* NGO CARDS */}
        <div className="ngo-grid">
          {ngos.map((ngo, index) => (
            <div key={index} className="ngo-card">

              <div className="image-placeholder"></div>

              <div className="ngo-body">
                <h3>{ngo.name}</h3>
                <p className="category">
                  {ngo.category} • <span>Verified</span>
                </p>
                <p className="desc">{ngo.description}</p>

                <button
                  className="view-btn"
                  onClick={() => navigate("/ngo-profile")}
                >
                  View Profile
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default BrowseNGO;