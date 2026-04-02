import React, { useEffect, useState } from "react";

const API = "http://localhost:5000/api";

export default function KhaltiReturn() {
  const [message, setMessage] = useState("Verifying payment...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pidx = params.get("pidx");
    const status = params.get("status");

    if (!pidx) {
      setMessage("Missing payment reference.");
      return;
    }

    const verify = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setMessage("Login token missing. Please log in again and verify payment.");
          return;
        }

        const res = await fetch(`${API}/payments/khalti/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ pidx }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Verification failed");
        }

        if (data.status === "Completed") {
          setMessage("Payment successful. Donation confirmed.");
        } else {
          setMessage(`Payment status: ${data.status || status || "Unknown"}`);
        }
      } catch (err) {
        setMessage(err.message || "Verification failed.");
      }
    };

    verify();
  }, []);

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h2>{message}</h2>
    </div>
  );
}