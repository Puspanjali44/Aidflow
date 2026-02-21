import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import NgoLayout from "../components/NgoLayout";
import "./CreateProject.css";

function CreateProject() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (status) => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          goalAmount: Number(goalAmount),
          endDate,
          status,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        navigate("/ngo-dashboard");   // cleaner than window.location
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <NgoLayout>
      <div className="create-wrapper">
        <div className="create-card">
          <h1>Create New Project</h1>
          <p className="subtitle">
            Fill in the details — admin will review before publishing
          </p>

          <label>Project Title</label>
          <input
            type="text"
            placeholder="e.g. Rural School Rebuilding 2026"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label>Description</label>
          <textarea
            placeholder="Describe your project, goals and expected impact..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="create-row">
            <div>
              <label>Funding Goal (Rs.)</label>
              <input
                type="number"
                placeholder="e.g. 1200000"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
              />
            </div>

            <div>
              <label>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="create-button-group">
            <button
              className="draft-btn"
              disabled={loading}
              onClick={() => handleSubmit("draft")}
            >
              Save as Draft
            </button>

            <button
              className="publish-btn"
              disabled={loading}
              onClick={() => handleSubmit("active")}
            >
              {loading ? "Saving..." : "Publish Project →"}
            </button>
          </div>
        </div>
      </div>
    </NgoLayout>
  );
}

export default CreateProject;