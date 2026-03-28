import React, { useMemo, useState } from "react";
import "./DonateModal.css";

const BASE = "http://localhost:5000";
const API = `${BASE}/api`;

const PRESET_AMOUNTS = [1000, 2500, 5000, 7500, 10000];
const PLATFORM_FEE_RATE = 0.0845; // 8.45% platform fee

const formatNPR = (amount) =>
  `NPR ${Number(amount || 0).toLocaleString("en-NP")}`;

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

export default function DonateModal({ project, onClose }) {
  const [step, setStep] = useState("amount");
  const [donationType, setDonationType] = useState("one-time");

  const [selectedAmt, setSelectedAmt] = useState(PRESET_AMOUNTS[0]);
  const [customAmt, setCustomAmt] = useState("");
  const [coverFee, setCoverFee] = useState(true);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    receiptName: "",
    email: "",
    message: "",
    anonymous: false,
    address: "",
    city: "",
    country: "Nepal",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const goalAmount = Number(project?.goalAmount || 0);
  const raisedAmount = Number(project?.raisedAmount || 0);
  const remainingAmount = Math.max(goalAmount - raisedAmount, 0);

  const validPresetAmounts = useMemo(
    () => PRESET_AMOUNTS.filter((amt) => amt <= remainingAmount),
    [remainingAmount]
  );

  const enteredAmount = customAmt !== "" ? Number(customAmt) : Number(selectedAmt || 0);

  const baseAmount =
    remainingAmount > 0 ? clamp(enteredAmount || 0, 0, remainingAmount) : 0;

  const platformFee = coverFee
    ? parseFloat((baseAmount * PLATFORM_FEE_RATE).toFixed(2))
    : 0;

  const totalAmount = parseFloat((baseAmount + platformFee).toFixed(2));

  const projectFull = remainingAmount <= 0;
  const exceedsRemaining = enteredAmount > remainingAmount;

  const validateDetails = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) {
      e.email = "Valid email required";
    }
    if (!form.address.trim()) e.address = "Required";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinueToDetails = () => {
    if (projectFull) {
      alert("This project has already reached its goal.");
      return;
    }

    if (!enteredAmount || enteredAmount <= 0) {
      alert("Please enter a valid donation amount.");
      return;
    }

    if (exceedsRemaining) {
      alert(
        `You can donate up to ${formatNPR(remainingAmount)} only for this project.`
      );
      return;
    }

    setStep("details");
  };

  const handleDonate = async () => {
    if (projectFull) {
      alert("This project has already reached its goal.");
      return;
    }

    if (!baseAmount || baseAmount <= 0) {
      alert("Invalid donation amount.");
      return;
    }

    if (baseAmount > remainingAmount) {
      alert(
        `You can donate up to ${formatNPR(remainingAmount)} only for this project.`
      );
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      const payload = {
        projectId: project._id,
        amount: totalAmount,
        baseAmount,
        platformFee,
        currency: "NPR",
        donationType,
        donorName: form.anonymous
          ? "Anonymous"
          : `${form.firstName} ${form.lastName}`,
        receiptName:
          form.receiptName || `${form.firstName} ${form.lastName}`,
        email: form.email,
        message: form.message,
        anonymous: form.anonymous,
        address: form.address,
        city: form.city,
        country: form.country,
      };

      const r = await fetch(`${API}/donations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        throw new Error((await r.json()).message || "Donation failed");
      }

      setStep("success");
    } catch (e) {
      alert(e.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const stepIndex = { amount: 0, details: 1, confirm: 2 };
  const currentIdx = stepIndex[step] ?? 0;

  return (
    <div className="dm-backdrop" onClick={onClose}>
      <div className="dm-modal" onClick={(e) => e.stopPropagation()}>
        {step === "success" && (
          <div className="dm-success">
            <div className="dm-success-icon">💜</div>
            <h2>Thank you!</h2>
            <p>
              Your donation of <strong>{formatNPR(totalAmount)}</strong> to{" "}
              <strong>{project.title}</strong> was received.
            </p>
            <p className="dm-success-sub">
              A receipt will be sent to {form.email}
            </p>
            <button className="dm-btn-primary dm-full" onClick={onClose}>
              Close
            </button>
          </div>
        )}

        {step !== "success" && (
          <>
            <div className="dm-header">
              {step !== "amount" && (
                <button
                  className="dm-back"
                  onClick={() =>
                    setStep(step === "confirm" ? "details" : "amount")
                  }
                >
                  ← Back
                </button>
              )}

              <button className="dm-close" onClick={onClose}>
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
                        className={`dm-step-line ${
                          i < currentIdx ? "active" : ""
                        }`}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {step === "amount" && (
              <div className="dm-body">
                <div className="dm-toggle">
                  <button
                    className={`dm-toggle-btn ${
                      donationType === "one-time" ? "active" : ""
                    }`}
                    onClick={() => setDonationType("one-time")}
                  >
                    One-time
                  </button>
                  <button
                    className={`dm-toggle-btn ${
                      donationType === "monthly" ? "active" : ""
                    }`}
                    onClick={() => setDonationType("monthly")}
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
                      projectFull
                        ? "Goal already reached"
                        : "Enter custom amount"
                    }
                    value={customAmt}
                    min="1"
                    max={remainingAmount || undefined}
                    disabled={projectFull}
                    onChange={(e) => {
                      setCustomAmt(e.target.value);
                      setSelectedAmt(null);
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
                    Remaining to goal:{" "}
                    <strong>{formatNPR(remainingAmount)}</strong>
                  </span>
                </div>

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
                  <span className="dm-pay-chip esewa">eSewa</span>
                  <span className="dm-pay-chip khalti">Khalti</span>
                  <span className="dm-pay-chip">VISA</span>
                  <span className="dm-pay-chip">MC</span>
                </div>

                <button
                  className="dm-btn-primary dm-full dm-mt16"
                  disabled={
                    projectFull ||
                    !baseAmount ||
                    baseAmount <= 0 ||
                    exceedsRemaining
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
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                  {errors.email && (
                    <span className="dm-err">{errors.email}</span>
                  )}
                </div>

                <div className="dm-field">
                  <textarea
                    className="dm-input dm-textarea"
                    placeholder="Your Message (optional)"
                    rows={3}
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
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
                    ℹ️ If you give anonymously this project won't be able to
                    thank you or keep you updated
                  </p>
                )}

                <div className="dm-field">
                  <input
                    className={`dm-input ${errors.address ? "error" : ""}`}
                    placeholder="Address *"
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                  />
                  {errors.address && (
                    <span className="dm-err">{errors.address}</span>
                  )}
                </div>

                <div className="dm-field-row">
                  <input
                    className="dm-input"
                    placeholder="City"
                    value={form.city}
                    onChange={(e) =>
                      setForm({ ...form, city: e.target.value })
                    }
                  />
                  <select
                    className="dm-input"
                    value={form.country}
                    onChange={(e) =>
                      setForm({ ...form, country: e.target.value })
                    }
                  >
                    {[
                      "Nepal",
                      "Australia",
                      "India",
                      "USA",
                      "UK",
                      "Canada",
                      "Germany",
                      "France",
                      "Japan",
                      "Other",
                    ].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <button
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
                    <strong>{project.title}</strong>
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
                    <span>Type</span>
                    <strong style={{ textTransform: "capitalize" }}>
                      {donationType}
                    </strong>
                  </div>

                  {form.message && (
                    <div className="dm-summary-row">
                      <span>Message</span>
                      <strong>"{form.message}"</strong>
                    </div>
                  )}

                  <div className="dm-summary-row">
                    <span>Country</span>
                    <strong>{form.country}</strong>
                  </div>
                </div>

                <div className="dm-amount-breakdown">
                  <div className="dm-breakdown-main">
                    {formatNPR(baseAmount)}
                  </div>

                  <div className="dm-breakdown-fee">
                    + {formatNPR(platformFee)} Cover Platform Costs
                    <button
                      className="dm-fee-toggle"
                      onClick={() => setCoverFee((f) => !f)}
                    >
                      {coverFee ? "Remove" : "Add"}
                    </button>
                  </div>

                  <div className="dm-breakdown-hint">
                    ℹ️ Covering platform costs ensures 100% of your donation
                    goes to the project
                  </div>
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
                  className="dm-btn-donate dm-full"
                  disabled={submitting || projectFull || baseAmount <= 0}
                  onClick={handleDonate}
                >
                  {submitting
                    ? "Processing…"
                    : `♥ Donate ${formatNPR(totalAmount)}`}
                </button>

                <p className="dm-secure-note">
                  🔒 Secure payment · Receipt sent to {form.email}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}