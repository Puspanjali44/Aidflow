import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DonorSidebar from "../components/DonorSidebar";
import "./MyDonation.css";

function MyDonations() {
  const [donations, setDonations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get("http://localhost:5000/api/donations/my", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDonations(res.data || []);
    } catch (error) {
      console.error("Error fetching donations", error);
    }
  };

  const totalDonated = donations.reduce(
    (sum, donation) => sum + donation.amount,
    0
  );

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "?");

  const getAvatarColor = (name) => {
    const colors = ["#1e5631", "#d4a843", "#2d6a4f", "#8B5E3C", "#3B82F6"];
    if (!name) return colors[0];
    return colors[name.charCodeAt(0) % colors.length];
  };

  return (
    <div className="mydon-wrapper">
      <DonorSidebar />

      <div className="mydon-content">
        <h1 className="mydon-title">My Donations</h1>
        <p className="mydon-subtitle">View and manage all your contributions.</p>

        {/* Total */}
        <div className="mydon-stats">
          <div className="mydon-stat green-stat">
            <div className="mydon-stat-label">TOTAL DONATED</div>
            <div className="mydon-stat-value white">
              NPR {totalDonated.toLocaleString()}
            </div>
            <div className="mydon-stat-sub white-sub">
              {donations.length} donation{donations.length !== 1 ? "s" : ""} total
            </div>
          </div>
        </div>

        {/* Donation List */}
        <div className="mydon-list-section">
          <h3>All Donations</h3>

          {donations.length === 0 ? (
            <div className="mydon-empty">
              <p>No donations yet.</p>
            </div>
          ) : (
            donations.map((donation, index) => (
              <div
                key={donation._id}
                className="mydon-row"
                onClick={() =>
                  navigate(`/project/${donation.project?._id}`)
                }
                style={{
                  cursor: "pointer",
                  animation: "slideUp 0.4s ease both",
                  animationDelay: `${index * 0.05}s`,
                }}
              >
                {/* Avatar */}
                <div
                  className="mydon-avatar"
                  style={{
                    background: getAvatarColor(
                      donation.project?.ngo?.organizationName
                    ),
                  }}
                >
                  {getInitial(donation.project?.ngo?.organizationName)}
                </div>

                {/* Info */}
                <div className="mydon-info">
                  <div className="mydon-info-title">
                    {donation.project?.title || "(No project)"}
                  </div>
                  <div className="mydon-info-ngo">
                    NGO: {donation.project?.ngo?.organizationName || "-"}
                  </div>
                </div>

                {/* Right */}
                <div className="mydon-right">
                  <div className="mydon-amount">
                    NPR {donation.amount?.toLocaleString()}
                  </div>
                  <div className="mydon-date-status">
                    <span className="mydon-date">
                      {new Date(donation.createdAt).toLocaleDateString()}
                    </span>
                    <span className="mydon-status completed">completed</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default MyDonations;