import React from "react";
import "./dashboard.css";

export default function Dashboard({ onNavigate }) {
  return (
    <div className="dashboard-container">

      {/* HEADER (ONLY NAME) */}
      <div className="dashboard-header">
        <h2>✈️ Makki Madni Travel</h2>
      </div>

      {/* CONTENT */}
      <div className="dashboard-content">

        {/* PACKAGES CARD (LEFT SIDE) */}
        <div className="dash-card green small">
          <div className="dash-icon">📦</div>
          <h4>Packages</h4>
          <p>Create & manage travel packages</p>
          <button onClick={() => onNavigate("packages")}>
            Open
          </button>
        </div>

      </div>
    </div>
  );
}
