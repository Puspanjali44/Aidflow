import React from "react";

function NgoCard({ ngo }) {
  return (
    <div className="ngo-card">
      <h4>{ngo.name}</h4>
      <p>Verified NGO</p>
    </div>
  );
}

export default NgoCard;