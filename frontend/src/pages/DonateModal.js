import React, { useEffect, useMemo, useState } from "react";
import "./DonateModal.css";

const BASE = "http://localhost:5000";
const API = `${BASE}/api`;

const PRESET_AMOUNTS = [1000, 2500, 5000, 7500, 10000];

const formatNPR = (amount) =>
  `NPR ${Number(amount || 0).toLocaleString("en-NP")}`;

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

const splitName = (fullName = "") => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
};

export default function DonateModal({ project, onClose }) {
  const [step, setStep] = useState("amount");
  const [donationType, setDonationType] = useState("one-time");
  const [paymentMethod, setPaymentMethod] = useState("khalti");

  const [selectedAmt, setSelectedAmt] = useState(PRESET_AMOUNTS[0]);
  const [customAmt, setCustomAmt] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    receiptName: "",
    email: "",
    phone: "",
    message: "",
    anonymous: false,
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uiMessage, setUiMessage] = useState("");

  useEffect(() => {
    const fetchLoggedInUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${API}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) return;

        const user = await res.json();
        const fullName = user?.name || "";
        const { firstName, lastName } = splitName(fullName);

        setForm((prev) => ({
          ...prev,
          firstName: prev.firstName || firstName,
          lastName: prev.lastName || lastName,
          receiptName: prev.receiptName || fullName,
          email: prev.email || user?.email || "",
          phone: prev.phone || user?.phone || "9800000005",
        }));
      } catch (error) {
        console.error("Failed to fetch logged-in user:", error);
      }
    };

    fetchLoggedInUser();
  }, []);

  const goalAmount = Number(project?.goalAmount || 0);
  const raisedAmount = Number(project?.raisedAmount || 0);
  const remainingAmount = Math.max(goalAmount - raisedAmount, 0);

  const enteredAmount =
    customAmt !== "" ? Number(customAmt) : Number(selectedAmt || 0);

  const baseAmount =
    remainingAmount > 0 ? clamp(enteredAmount || 0, 0, remainingAmount) : 0;

  const totalAmount = useMemo(() => {
    return parseFloat(baseAmount.toFixed(2));
  }, [baseAmount]);

  const projectFull = remainingAmount <= 0;
  const exceedsRemaining = enteredAmount > remainingAmount;

  const validateDetails = () => {
    const e = {};

    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";

    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) {
      e.email = "Valid email required";
    }

    if (!/^\d{10}$/.test(form.phone.trim())) {
  e.phone = "Valid 10-digit phone required";
}
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinueToDetails = () => {
    setUiMessage("");

    if (projectFull) {
      setUiMessage("This project has already reached its goal.");
      return;
    }

    if (!enteredAmount || enteredAmount <= 0) {
      setUiMessage("Please enter a valid donation amount.");
      return;
    }

    if (exceedsRemaining) {
      setUiMessage(
        `You can donate up to ${formatNPR(remainingAmount)} only for this project.`
      );
      return;
    }

    setStep("details");
  };

  const getPayload = () => ({
    projectId: project?._id,
    amount: totalAmount,
    baseAmount,
    platformFee: 0,
    currency: "NPR",
    donationType,
    donorName: form.anonymous
      ? "Anonymous"
      : `${form.firstName} ${form.lastName}`.trim(),
    receiptName:
      form.receiptName.trim() || `${form.firstName} ${form.lastName}`.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    message: form.message.trim(),
    anonymous: form.anonymous,
  });

  const handleDonate = async () => {
    setUiMessage("");

    if (projectFull) {
      setUiMessage("This project has already reached its goal.");
      return;
    }

    if (!baseAmount || baseAmount <= 0) {
      setUiMessage("Invalid donation amount.");
      return;
    }

    if (baseAmount > remainingAmount) {
      setUiMessage(
        `You can donate up to ${formatNPR(remainingAmount)} only for this project.`
      );
      return;
    }

    if (paymentMethod !== "khalti") {
      setUiMessage("Please use Khalti for now.");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const payload = getPayload();

      const r = await fetch(`${API}/payments/khalti/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await r.json();

      if (!r.ok) {
        throw new Error(data?.message || "Failed to initiate payment");
      }

      if (!data?.payment_url) {
        throw new Error("Payment URL not received");
      }

      window.location.href = data.payment_url;
    } catch (e) {
      setUiMessage(e.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const stepIndex = { amount: 0, details: 1, confirm: 2 };
  const currentIdx = stepIndex[step] ?? 0;

  return (
    <div className="dm-backdrop" onClick={onClose}>
      <div className="dm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dm-header">
          {step !== "amount" && (
            <button
              type="button"
              className="dm-back"
              onClick={() => setStep(step === "confirm" ? "details" : "amount")}
            >
              ← Back
            </button>
          )}

          <button type="button" className="dm-close" onClick={onClose}>
            ✕
          </button>

          <div className="dm-steps">
            {[0, 1, 2].map((i) => (
              <React.Fragment key={i}>
                <div
                  className={`dm-dot ${i <= currentIdx ? "active" : ""} ${
                    i < currentIdx ? "done" : ""
                  }`}
                >
                  {i < currentIdx ? "✓" : i + 1}
                </div>
                {i < 2 && (
                  <div
                    className={`dm-step-line ${i < currentIdx ? "active" : ""}`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {uiMessage && (
          <div className="dm-limit-note" style={{ margin: "12px 24px 0 24px" }}>
            {uiMessage}
          </div>
        )}

        {step === "amount" && (
          <div className="dm-body">
            <div className="dm-toggle">
              <button
                type="button"
                className={`dm-toggle-btn ${
                  donationType === "one-time" ? "active" : ""
                }`}
                onClick={() => {
                  setDonationType("one-time");
                  setUiMessage("");
                }}
              >
                One-time
              </button>

              <button
                type="button"
                className={`dm-toggle-btn ${
                  donationType === "monthly" ? "active" : ""
                }`}
                onClick={() => {
                  setDonationType("monthly");
                  setUiMessage("");
                }}
              >
                Monthly
              </button>
            </div>

            <div className="dm-amounts-grid">
              {PRESET_AMOUNTS.map((amt) => {
                const disabled = amt > remainingAmount || projectFull;

                return (
                  <button
                    key={amt}
                    type="button"
                    disabled={disabled}
                    className={`dm-amount-btn ${
                      selectedAmt === amt && !customAmt ? "active" : ""
                    } ${disabled ? "disabled" : ""}`}
                    onClick={() => {
                      if (disabled) return;
                      setSelectedAmt(amt);
                      setCustomAmt("");
                      setUiMessage("");
                    }}
                  >
                    {formatNPR(amt)}
                  </button>
                );
              })}
            </div>

            <div className="dm-custom-wrap">
              <span className="dm-currency">रु</span>
              <input
                className="dm-custom-input"
                type="number"
                placeholder={
                  projectFull ? "Goal already reached" : "Enter custom amount"
                }
                value={customAmt}
                min="1"
                max={remainingAmount || undefined}
                disabled={projectFull}
                onChange={(e) => {
                  setCustomAmt(e.target.value);
                  setSelectedAmt(null);
                  setUiMessage("");
                }}
              />
            </div>

            <div className="dm-currency-row">
              <span>
                Donating in <strong>Nepalese Rupees (NPR)</strong>
              </span>
            </div>

            <div className="dm-currency-row">
              <span>
                Remaining to goal: <strong>{formatNPR(remainingAmount)}</strong>
              </span>
            </div>

            {donationType === "monthly" && !projectFull && (
              <div className="dm-limit-note">
                Monthly donations repeat every month until cancelled.
              </div>
            )}

            {exceedsRemaining && !projectFull && (
              <div className="dm-limit-note">
                You can donate up to {formatNPR(remainingAmount)} only.
              </div>
            )}

            {projectFull && (
              <div className="dm-limit-note">
                This project has already reached its goal.
              </div>
            )}

            <div className="dm-payment-icons">
              <button
                type="button"
                className={`dm-pay-chip khalti ${
                  paymentMethod === "khalti" ? "active" : ""
                }`}
                onClick={() => setPaymentMethod("khalti")}
              >
                Khalti
              </button>
            </div>

            <button
              type="button"
              className="dm-btn-primary dm-full dm-mt16"
              disabled={
                projectFull || !baseAmount || baseAmount <= 0 || exceedsRemaining
              }
              onClick={handleContinueToDetails}
            >
              {projectFull
                ? "Goal Reached"
                : `Continue — ${formatNPR(baseAmount || 0)}`}
            </button>
          </div>
        )}

        {step === "details" && (
          <div className="dm-body">
            <div className="dm-donating-badge">
              Donating {formatNPR(baseAmount)}
            </div>

            <h3 className="dm-section-heading">Your Details</h3>

            <div className="dm-field">
              <input
                className={`dm-input ${errors.firstName ? "error" : ""}`}
                placeholder="First Name *"
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
              />
              {errors.firstName && (
                <span className="dm-err">{errors.firstName}</span>
              )}
            </div>

            <div className="dm-field">
              <input
                className={`dm-input ${errors.lastName ? "error" : ""}`}
                placeholder="Last Name *"
                value={form.lastName}
                onChange={(e) =>
                  setForm({ ...form, lastName: e.target.value })
                }
              />
              {errors.lastName && (
                <span className="dm-err">{errors.lastName}</span>
              )}
            </div>

            <div className="dm-field">
              <input
                className="dm-input"
                placeholder="(optional) Different name for the Receipt"
                value={form.receiptName}
                onChange={(e) =>
                  setForm({ ...form, receiptName: e.target.value })
                }
              />
              <p className="dm-hint">
                (e.g. Company name, In Memory Of, on Behalf of)
              </p>
            </div>

            <div className="dm-field">
              <input
                className={`dm-input ${errors.email ? "error" : ""}`}
                type="email"
                placeholder="Email *"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {errors.email && <span className="dm-err">{errors.email}</span>}
            </div>

            <div className="dm-field">
              <input
                className={`dm-input ${errors.phone ? "error" : ""}`}
                type="text"
                placeholder="Phone Number *"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              {errors.phone && <span className="dm-err">{errors.phone}</span>}
            </div>

            <div className="dm-field">
              <textarea
                className="dm-input dm-textarea"
                placeholder="Your Message (optional)"
                rows={3}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>

            <label className="dm-checkbox-row">
              <input
                type="checkbox"
                checked={form.anonymous}
                onChange={(e) =>
                  setForm({ ...form, anonymous: e.target.checked })
                }
              />
              <span>Keep my donation anonymous from this project</span>
            </label>

            {form.anonymous && (
              <p className="dm-hint dm-anon-hint">
                ℹ️ If you give anonymously this project won't be able to thank
                you or keep you updated
              </p>
            )}

            <button
              type="button"
              className="dm-btn-primary dm-full dm-mt16"
              onClick={() => {
                if (validateDetails()) setStep("confirm");
              }}
            >
              Next
            </button>
          </div>
        )}

        {step === "confirm" && (
          <div className="dm-body">
            <h3 className="dm-section-heading">Review Your Donation</h3>

            <div className="dm-summary-card">
              <div className="dm-summary-row">
                <span>Project</span>
                <strong>{project?.title}</strong>
              </div>

              <div className="dm-summary-row">
                <span>Donor</span>
                <strong>
                  {form.anonymous
                    ? "Anonymous"
                    : `${form.firstName} ${form.lastName}`}
                </strong>
              </div>

              <div className="dm-summary-row">
                <span>Email</span>
                <strong>{form.email}</strong>
              </div>

              <div className="dm-summary-row">
                <span>Phone</span>
                <strong>{form.phone}</strong>
              </div>

              <div className="dm-summary-row">
                <span>Type</span>
                <strong style={{ textTransform: "capitalize" }}>
                  {donationType === "monthly" ? "Monthly recurring" : "One-time"}
                </strong>
              </div>

              <div className="dm-summary-row">
                <span>Payment</span>
                <strong style={{ textTransform: "capitalize" }}>
                  {paymentMethod}
                </strong>
              </div>

              {form.receiptName && (
                <div className="dm-summary-row">
                  <span>Receipt Name</span>
                  <strong>{form.receiptName}</strong>
                </div>
              )}

              {form.message && (
                <div className="dm-summary-row">
                  <span>Message</span>
                  <strong>"{form.message}"</strong>
                </div>
              )}
            </div>

            <div className="dm-amount-breakdown">
              <div className="dm-breakdown-main">{formatNPR(baseAmount)}</div>

              {donationType === "monthly" && (
                <div className="dm-breakdown-hint">
                  🔁 Monthly donations repeat every month until cancelled.
                </div>
              )}
            </div>

            <div className="dm-currency-row">
              <span>
                Remaining to goal after this donation:{" "}
                <strong>
                  {formatNPR(Math.max(remainingAmount - baseAmount, 0))}
                </strong>
              </span>
            </div>

            <button
              type="button"
              className="dm-btn-donate dm-full"
              disabled={submitting || projectFull || baseAmount <= 0}
              onClick={handleDonate}
            >
              {submitting
                ? "Processing…"
                : `Pay with Khalti ${formatNPR(totalAmount)}`}
            </button>

            <p className="dm-secure-note">🔒 Secure payment</p>
          </div>
        )}
      </div>
    </div>
  );
}