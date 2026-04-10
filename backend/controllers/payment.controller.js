const axios = require("axios");
const Donation = require("../models/Donation");
const Project = require("../models/Project");
const RecurringDonation = require("../models/RecurringDonation");
const generateReceipt = require("../utils/generateReceipt");

const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY;
const KHALTI_BASE_URL =
  process.env.KHALTI_BASE_URL || "https://dev.khalti.com/api/v2";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

exports.initiateKhaltiPayment = async (req, res) => {
  try {
    if (!KHALTI_SECRET_KEY) {
      return res.status(500).json({ message: "Khalti secret key is missing" });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      projectId,
      amount,
      baseAmount,
      platformFee,
      donationType,
      donorName,
      receiptName,
      email,
      message,
      anonymous,
      address,
      city,
      country,
    } = req.body;

    if (!projectId || amount === undefined || amount === null) {
      return res.status(400).json({ message: "Project and amount required" });
    }

    const numericAmount = Number(amount);
    const numericBaseAmount = Number(baseAmount ?? amount);
    const numericPlatformFee = Number(platformFee ?? 0);

    if (
      Number.isNaN(numericAmount) ||
      Number.isNaN(numericBaseAmount) ||
      Number.isNaN(numericPlatformFee) ||
      numericAmount <= 0 ||
      numericBaseAmount <= 0
    ) {
      return res.status(400).json({ message: "Invalid donation amount" });
    }

    if (numericAmount < 10) {
      return res
        .status(400)
        .json({ message: "Minimum donation amount is NPR 10" });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.status !== "active") {
      return res.status(400).json({
        message: `Project not available for donation. Current status: ${project.status}`,
      });
    }

    let recurringDonationId = null;

    if (donationType === "monthly") {
      const recurringDonation = await RecurringDonation.create({
        donor: req.user._id,
        project: projectId,
        amount: numericAmount,
        baseAmount: numericBaseAmount,
        platformFee: numericPlatformFee,
        currency: "NPR",
        interval: "monthly",
        donorName: donorName || "",
        receiptName: receiptName || "",
        email: email || "",
        message: message || "",
        anonymous: !!anonymous,
        address: address || "",
        city: city || "",
        country: country || "Nepal",
        provider: "khalti",
        status: "PENDING",
        paymentStatus: "PENDING",
      });

      recurringDonationId = recurringDonation._id;
    }

    const purchaseOrderId = `AIDFLOW-${Date.now()}-${projectId}`;
    const totalAmountPaisa = Math.round(numericAmount * 100);

    if (!Number.isInteger(totalAmountPaisa) || totalAmountPaisa <= 0) {
      return res.status(400).json({ message: "Invalid Khalti amount" });
    }

    const pendingDonation = await Donation.create({
      donor: req.user._id,
      project: projectId,
      recurringDonation: recurringDonationId,
      amount: numericAmount,
      baseAmount: numericBaseAmount,
      platformFee: numericPlatformFee,
      donationType: donationType || "one-time",
      donorName: donorName || "",
      receiptName: receiptName || "",
      email: email || "",
      message: message || "",
      anonymous: !!anonymous,
      address: address || "",
      city: city || "",
      country: country || "Nepal",
      paymentStatus: "PENDING",
      khaltiPurchaseOrderId: purchaseOrderId,
    });

    const payload = {
      return_url: `${FRONTEND_URL}/khalti-return`,
      website_url: FRONTEND_URL,
      amount: totalAmountPaisa,
      purchase_order_id: purchaseOrderId,
      purchase_order_name:
        donationType === "monthly"
          ? `${project.title} Monthly Donation`
          : project.title,
      customer_info: {
        name: donorName || "Donor",
        email: email || "donor@example.com",
        phone: "9800000001",
      },
    };

    console.log("KHALTI INITIATE PAYLOAD:", payload);
    console.log("KHALTI BASE URL:", KHALTI_BASE_URL);
    console.log("PROJECT STATUS:", project.status);

    const response = await axios.post(
      `${KHALTI_BASE_URL}/epayment/initiate/`,
      payload,
      {
        headers: {
          Authorization: `Key ${KHALTI_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    await Donation.findByIdAndUpdate(pendingDonation._id, {
      khaltiPidx: response.data.pidx,
      khaltiPaymentUrl: response.data.payment_url,
      providerReference: response.data.pidx,
    });

    if (recurringDonationId) {
      await RecurringDonation.findByIdAndUpdate(recurringDonationId, {
        providerReference: response.data.pidx,
      });
    }

    return res.status(200).json({
      payment_url: response.data.payment_url,
      pidx: response.data.pidx,
      donationId: pendingDonation._id,
      recurringDonationId,
      projectId,
    });
  } catch (error) {
    console.error(
      "KHALTI INITIATE ERROR:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      message:
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.response?.data?.error_key ||
        error.message ||
        "Failed to initiate Khalti payment",
      error: error.response?.data || error.message,
    });
  }
};

exports.verifyKhaltiPayment = async (req, res) => {
  try {
    if (!KHALTI_SECRET_KEY) {
      return res.status(500).json({ message: "Khalti secret key is missing" });
    }

    const { pidx, donationId, status, transactionId } = req.body;

    let donation = null;
    let result = null;

    if (pidx) {
      const response = await axios.post(
        `${KHALTI_BASE_URL}/epayment/lookup/`,
        { pidx },
        {
          headers: {
            Authorization: `Key ${KHALTI_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      result = response.data;
      donation = await Donation.findOne({ khaltiPidx: pidx }).populate(
        "project donor"
      );
    } else if (donationId) {
      donation = await Donation.findById(donationId).populate("project donor");

      result = {
        status: status || "FAILED",
        transaction_id: transactionId || "",
        pidx: donation?.khaltiPidx || "",
      };
    } else {
      return res.status(400).json({ message: "pidx or donationId required" });
    }

    if (!donation) {
      return res.status(404).json({ message: "Donation record not found" });
    }

    const isSuccess =
      result.status === "Completed" || result.status === "SUCCESS";
    const isFailed =
      result.status === "Expired" ||
      result.status === "User canceled" ||
      result.status === "FAILED";

    if (isSuccess) {
      if (donation.paymentStatus !== "SUCCESS") {
        donation.paymentStatus = "SUCCESS";
        donation.khaltiTransactionId = result.transaction_id || "";
        donation.providerReference =
          result.pidx || result.transaction_id || donation.providerReference;
        donation.paidAt = new Date();
        await donation.save();

        if (donation.recurringDonation) {
          const now = new Date();
          const nextDate = new Date(now);
          nextDate.setMonth(nextDate.getMonth() + 1);

          await RecurringDonation.findByIdAndUpdate(donation.recurringDonation, {
            status: "ACTIVE",
            paymentStatus: "SUCCESS",
            providerReference: result.pidx || result.transaction_id || "",
            lastDonation: donation._id,
            lastChargedAt: now,
            nextBillingDate: nextDate,
          });
        }

        const project = await Project.findById(donation.project._id || donation.project);

        if (project) {
          project.raisedAmount =
            Number(project.raisedAmount || 0) +
            Number(donation.baseAmount || donation.amount);

          project.donorCount = await Donation.countDocuments({
            project: project._id,
            paymentStatus: "SUCCESS",
          });

          project.lastDonation = new Date();

          if (project.raisedAmount >= project.goalAmount) {
            project.status = "completed";
          }

          await project.save();

          const donorData = donation.donor || req.user || null;
          const receipt = await generateReceipt(donation, donorData, project);

          donation.receiptUrl = receipt.relativePath;
          await donation.save();
        }
      }
    } else if (isFailed) {
      donation.paymentStatus = "FAILED";
      donation.providerReference =
        result.pidx || result.transaction_id || donation.providerReference;
      await donation.save();

      if (donation.recurringDonation) {
        await RecurringDonation.findByIdAndUpdate(donation.recurringDonation, {
          status: "FAILED",
          paymentStatus: "FAILED",
          providerReference: result.pidx || result.transaction_id || "",
        });
      }
    }

    const refreshedDonation = await Donation.findById(donation._id);

    return res.status(200).json({
      ...result,
      donationId: donation._id,
      projectId: donation.project._id || donation.project,
      receiptUrl: refreshedDonation?.receiptUrl || null,
      redirectUrl: `/project/${donation.project._id || donation.project}`,
    });
  } catch (error) {
    console.error(
      "KHALTI VERIFY ERROR:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      message:
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.response?.data?.error_key ||
        "Failed to verify Khalti payment",
      error: error.response?.data || error.message,
    });
  }
};

exports.mockKhaltiPage = async (req, res) => {
  try {
    const { donationId } = req.params;

    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Mock Khalti Payment</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              text-align: center;
              background: #f8f9fb;
            }
            .card {
              max-width: 500px;
              margin: 40px auto;
              background: white;
              border-radius: 12px;
              padding: 32px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            }
            h2 {
              margin-bottom: 12px;
            }
            p {
              color: #444;
              margin-bottom: 24px;
              word-break: break-word;
            }
            button {
              padding: 12px 20px;
              margin: 10px;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 16px;
            }
            .success {
              background: #4caf50;
              color: white;
            }
            .fail {
              background: #f44336;
              color: white;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Mock Khalti Payment Page</h2>
            <p>Donation ID: ${donationId}</p>

            <button class="success" onclick="paySuccess()">Pay Success</button>
            <button class="fail" onclick="payFail()">Pay Failed</button>
          </div>

          <script>
            async function paySuccess() {
              try {
                const res = await fetch("/api/payments/khalti/verify", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({
                    donationId: "${donationId}",
                    status: "SUCCESS",
                    transactionId: "mock_txn_" + Date.now()
                  })
                });

                const data = await res.json();
                alert(data.message || "Payment successful");
                window.location.href = "http://localhost:3000/project";
              } catch (error) {
                alert("Failed to verify mock successful payment");
              }
            }

            async function payFail() {
              try {
                const res = await fetch("/api/payments/khalti/verify", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({
                    donationId: "${donationId}",
                    status: "FAILED",
                    transactionId: "mock_fail_" + Date.now()
                  })
                });

                const data = await res.json();
                alert(data.message || "Payment failed");
                window.location.href = "http://localhost:3000/project";
              } catch (error) {
                alert("Failed to verify mock failed payment");
              }
            }
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    return res.status(500).send("Failed to load mock Khalti page");
  }
};