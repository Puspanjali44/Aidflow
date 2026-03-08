import React, { useEffect, useState } from "react";
import axios from "axios";
import DonorSidebar from "../components/DonorSidebar";
import "../App.css";

function MyDonations() {
  const [donations, setDonations] = useState([]);

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:5000/api/donations/my",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("DONATIONS:", res.data);
      setDonations(res.data);
    } catch (error) {
      console.error("Error fetching donations", error);
    }
  };

  const totalDonated = donations.reduce(
    (sum, donation) => sum + donation.amount,
    0
  );

  return (
    <div className="dashboard-wrapper">
      <DonorSidebar />

      <div className="dashboard-content">
        <h1>My Donations</h1>

        <h3>Total Donated: Rs. {totalDonated}</h3>

        {donations.length === 0 ? (
          <p>No donations yet.</p>
        ) : (
          donations.map((donation) => (
            <div key={donation._id} className="donation-card">
              <h3>{donation.project?.title}</h3>

              <p>
                NGO: {donation.project?.ngo?.organizationName}
              </p>

              <p>
                Amount: <strong>Rs. {donation.amount}</strong>
              </p>

              <p>
                Date:{" "}
                {new Date(donation.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MyDonations;