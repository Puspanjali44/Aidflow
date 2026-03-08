import React, { useEffect, useState } from "react";
import DonorSidebar from "./components/DonorSidebar";
import "./Dashboard.css";
import axios from "axios";

function DonorDashboard() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setDonations([]);
        setLoading(false);
        return;
      }

      const res = await axios.get("http://localhost:5000/api/donations/my", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDonations(res.data || []);
    } catch (error) {
      console.error("Error fetching donations", error);
      setDonations([]);
    } finally {
      setLoading(false);
    }
  };

  const totalDonated = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
  const projectsCount = new Set(donations.map((d) => d.project?._id)).size;

  return (
    <div className="dashboard-wrapper">
      <DonorSidebar />

      <div className="dashboard-content">
        <h1>Welcome Back, Donor!</h1>

        <div className="stats">
          <div className="card">
            Rs. {totalDonated.toLocaleString()}
            <br />
            Total Donations
          </div>

          <div className="card">
            {projectsCount}
            <br />
            Projects
          </div>

          <div className="card">
            {donations.length}
            <br />
            Donations
          </div>
        </div>

        <h2>Recent Donations</h2>

        {loading ? (
          <p>Loading...</p>
        ) : donations.length === 0 ? (
          <p>No donations yet.</p>
        ) : (
          donations.slice(0, 5).map((donation) => (
            <div key={donation._id} className="donation">
              <strong>{donation.project?.title || "(No project)"}</strong>
              <div>NGO: {donation.project?.ngo?.organizationName || "-"}</div>
              <div>Amount: Rs. {donation.amount}</div>
              <div>
                Date: {new Date(donation.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DonorDashboard;