import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function KhaltiReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [message, setMessage] = useState("Verifying your payment...");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const pidx = searchParams.get("pidx");
        const status = searchParams.get("status");
        const txnId = searchParams.get("txnId");

        if (!pidx) {
          setMessage("❌ Missing payment ID");
          return;
        }

        if (status !== "Completed") {
          setMessage(`❌ Payment ${status || "failed"}`);
          return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
          setMessage("❌ Please log in again");
          return;
        }

        const res = await axios.post(
          "http://localhost:5000/api/payments/khalti/verify",
          { pidx },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const projectId = res.data?.projectId || searchParams.get("projectId");

        if (!projectId) {
          setMessage("✅ Payment successful, but project not found.");
          return;
        }

        setMessage("✅ Payment verified successfully!");
        setIsSuccess(true);

        // ✅ ALWAYS redirect to PUBLIC donor view after donation
        setTimeout(() => {
          navigate(`/project/${projectId}?payment=success&txnId=${txnId || ""}`, {
            replace: true,
          });
        }, 1400);
      } catch (error) {
        console.error(error);
        setMessage(error.response?.data?.message || "❌ Verification failed");
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  return (
    <div style={{ padding: "100px 20px", textAlign: "center" }}>
      <h2 style={{ color: isSuccess ? "#16a34a" : "#ef4444" }}>
        {message}
      </h2>
      {isSuccess && <p>Redirecting to project page...</p>}
    </div>
  );
}