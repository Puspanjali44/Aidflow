import React from "react";

function DonationItem({ data }) {
  return (
    <div className="donation-item">
      <h4>{data.title}</h4>
      <p>${data.amount} donated • {data.date}</p>
    </div>
  );
}

export default DonationItem;