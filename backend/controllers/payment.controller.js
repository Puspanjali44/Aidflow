const axios = require("axios");
const Donation = require("../models/Donation");
const Project = require("../models/Project");

const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY;
const KHALTI_BASE_URL =
  process.env.KHALTI_BASE_URL || "https://dev.khalti.com/api/v2";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

exports.initiateKhaltiPayment = async (req, res) => {
  try {
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

    if (!projectId || !amount) {
      return res.status(400).json({ message: "Project and amount required" });
    }

    const numericAmount = Number(amount);

    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: "Invalid donation amount" });
    }

    const project = await Project.findById(projectId);
    if (!project || project.status !== "active") {
      return res.status(400).json({ message: "Project not available" });
    }

    const purchaseOrderId = `AIDFLOW-${Date.now()}-${projectId}`;
    const totalAmountPaisa = Math.round(numericAmount * 100);

    const pendingDonation = await Donation.create({
      donor: req.user._id,
      project: projectId,
      amount: numericAmount,
      baseAmount: Number(baseAmount || amount),
      platformFee: Number(platformFee || 0),
      donationType: donationType || "one-time",
      donorName: donorName || "",
      receiptName: receiptName || "",
      email: email || "",
      message: message || "",
      anonymous: !!anonymous,
      address: address || "",
      city: city || "",
      country: country || "",
      paymentStatus: "PENDING",
      khaltiPurchaseOrderId: purchaseOrderId,
    });

    const payload = {
      return_url: `${FRONTEND_URL}/khalti-return`,
      website_url: FRONTEND_URL,
      amount: totalAmountPaisa,
      purchase_order_id: purchaseOrderId,
      purchase_order_name: project.title,
      customer_info: {
        name: donorName || "Donor",
        email: email || "donor@example.com",
        phone: "9800000001",
      },
    };

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
    });

    return res.status(200).json({
      payment_url: response.data.payment_url,
      pidx: response.data.pidx,
      donationId: pendingDonation._id,
    });
  } catch (error) {
    console.error(
      "KHALTI INITIATE ERROR:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      message:
        error.response?.data?.detail ||
        error.response?.data?.error_key ||
        "Failed to initiate Khalti payment",
      error: error.response?.data || error.message,
    });
  }
};

exports.verifyKhaltiPayment = async (req, res) => {
  try {
    const { pidx } = req.body;

    if (!pidx) {
      return res.status(400).json({ message: "pidx required" });
    }

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

    const result = response.data;

    const donation = await Donation.findOne({ khaltiPidx: pidx });
    if (!donation) {
      return res.status(404).json({ message: "Donation record not found" });
    }

    if (result.status === "Completed") {
      if (donation.paymentStatus !== "SUCCESS") {
        donation.paymentStatus = "SUCCESS";
        donation.khaltiTransactionId = result.transaction_id || "";
        await donation.save();

        const project = await Project.findById(donation.project);
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
        }
      }
    } else if (
      result.status === "Expired" ||
      result.status === "User canceled"
    ) {
      donation.paymentStatus = "FAILED";
      await donation.save();
    }

    return res.json(result);
  } catch (error) {
    console.error(
      "KHALTI VERIFY ERROR:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      message:
        error.response?.data?.detail ||
        error.response?.data?.error_key ||
        "Failed to verify Khalti payment",
      error: error.response?.data || error.message,
    });
  }
};