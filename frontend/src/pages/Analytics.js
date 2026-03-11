import React from "react";
import "./Analytics.css";

function Analytics() {
  return (
    <div className="analytics-container">

      <h1 className="analytics-title">Analytics</h1>

      {/* TOP CARDS */}
      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Donation Trends</h3>
          <div className="chart-placeholder line-chart"></div>
        </div>

        <div className="analytics-card">
          <h3>Donor Growth</h3>
          <div className="chart-placeholder bar-chart"></div>
        </div>
      </div>

      {/* PROJECT PERFORMANCE TABLE */}
      <div className="analytics-card table-card">
        <h3>Project Performance</h3>

        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Raised</th>
              <th>Goal</th>
              <th>Progress</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Build 5 Schools in Gorkha</td>
              <td>Rs. 750,000</td>
              <td>Rs. 1,000,000</td>
              <td>75%</td>
            </tr>

            <tr>
              <td>Teacher Training Program</td>
              <td>Rs. 500,000</td>
              <td>Rs. 800,000</td>
              <td>62%</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default Analytics;