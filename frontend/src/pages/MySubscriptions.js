import React, { useEffect, useState } from "react";
import axios from "axios";
import DonorSidebar from "../components/DonorSidebar";
import "./MySubscriptions.css";

function MySubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:5000/api/recurring-donations/my",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSubscriptions(res.data || []);
    } catch (error) {
      console.error("Error fetching subscriptions", error);
    }
  };

  const totalMonthly = subscriptions
    .filter((sub) => sub.status === "ACTIVE" || sub.status === "PAUSED")
    .reduce((sum, sub) => sum + Number(sub.baseAmount || sub.amount || 0), 0);

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "?");

  const getAvatarColor = (name) => {
    const colors = ["#1e5631", "#d4a843", "#2d6a4f", "#8B5E3C", "#3B82F6"];
    if (!name) return colors[0];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  const handlePause = async (id) => {
    try {
      const token = localStorage.getItem("token");

      await axios.patch(
        `http://localhost:5000/api/recurring-donations/${id}/pause`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchSubscriptions();
    } catch (error) {
      console.error("Error pausing subscription", error);
    }
  };

  const handleCancel = async (id) => {
    try {
      const token = localStorage.getItem("token");

      await axios.patch(
        `http://localhost:5000/api/recurring-donations/${id}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchSubscriptions();
    } catch (error) {
      console.error("Error cancelling subscription", error);
    }
  };

  return (
    <div className="mysub-wrapper">
      <DonorSidebar />

      <div className="mysub-content">
        <h1 className="mysub-title">My Subscriptions</h1>
        <p className="mysub-subtitle">
          View and manage your monthly recurring donations.
        </p>

        <div className="mysub-stats">
          <div className="mysub-stat green-stat">
            <div className="mysub-stat-label">MONTHLY COMMITMENT</div>
            <div className="mysub-stat-value white">
              NPR {totalMonthly.toLocaleString()}
            </div>
            <div className="mysub-stat-sub white-sub">
              {subscriptions.length} subscription
              {subscriptions.length !== 1 ? "s" : ""} total
            </div>
          </div>
        </div>

        <div className="mysub-list-section">
          <h3>All Subscriptions</h3>

          {subscriptions.length === 0 ? (
            <div className="mysub-empty">
              <p>No recurring subscriptions yet.</p>
            </div>
          ) : (
            subscriptions.map((sub, index) => (
              <div
                key={sub._id}
                className="mysub-row"
                style={{
                  animation: "slideUp 0.4s ease both",
                  animationDelay: `${index * 0.05}s`,
                }}
              >
                <div
                  className="mysub-avatar"
                  style={{
                    background: getAvatarColor(sub.project?.title),
                  }}
                >
                  {getInitial(sub.project?.title)}
                </div>

                <div className="mysub-info">
                  <div className="mysub-info-title">
                    {sub.project?.title || "(No project)"}
                  </div>
                  <div className="mysub-info-meta">
                    Monthly: NPR{" "}
                    {Number(sub.baseAmount || sub.amount || 0).toLocaleString()}
                  </div>
                  <div className="mysub-info-meta">
                    Next Billing: {formatDate(sub.nextBillingDate)}
                  </div>
                </div>

                <div className="mysub-right">
                  <div
                    className={`mysub-status ${String(sub.status || "").toLowerCase()}`}
                  >
                    {sub.status}
                  </div>

                  <div className="mysub-date">
                    Started: {formatDate(sub.startDate)}
                  </div>

                  <div className="mysub-actions">
                    {sub.status === "ACTIVE" && (
                      <>
                        <button
                          className="mysub-btn pause"
                          onClick={() => handlePause(sub._id)}
                        >
                          Pause
                        </button>
                        <button
                          className="mysub-btn cancel"
                          onClick={() => handleCancel(sub._id)}
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {sub.status === "PAUSED" && (
                      <button
                        className="mysub-btn cancel"
                        onClick={() => handleCancel(sub._id)}
                      >
                        Cancel
                      </button>
                    )}
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

export default MySubscriptions;