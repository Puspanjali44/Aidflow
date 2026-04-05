const axios = require("axios");
const Donation = require("../models/Donation");
const RecurringDonation = require("../models/RecurringDonation");
const Project = require("../models/Project");

const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY;
const KHALTI_BASE_URL =
  process.env.KHALTI_BASE_URL || "https://dev.khalti.com/api/v2";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

exports.initiateRecurringDonation = async (req, res) => {
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
      currency,
      donorName,
      receiptName,
      email,
      message,
      anonymous,
      address,
      city,
      country,
    } = req.body;

    if (!projectId || !amount || !baseAmount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const numericAmount = Number(amount);
    const numericBaseAmount = Number(baseAmount);
    const numericPlatformFee = Number(platformFee || 0);

    if (
      Number.isNaN(numericAmount) ||
      Number.isNaN(numericBaseAmount) ||
      numericAmount <= 0 ||
      numericBaseAmount <= 0
    ) {
      return res.status(400).json({ message: "Invalid donation amount" });
    }

    const project = await Project.findById(projectId);
    if (!project || project.status !== "active") {
      return res.status(400).json({ message: "Project not available" });
    }

    const recurring = await RecurringDonation.create({
      donor: req.user._id,
      project: projectId,
      amount: numericAmount,
      baseAmount: numericBaseAmount,
      platformFee: numericPlatformFee,
      currency: currency || "NPR",
      donorName: donorName || "",
      receiptName: receiptName || "",
      email: email || "",
      message: message || "",
      anonymous: !!anonymous,
      address: address || "",
      city: city || "",
      country: country || "Nepal",
      interval: "monthly",
      status: "PENDING",
      paymentStatus: "PENDING",
      paymentMethod: "khalti",
    });

    const purchaseOrderId = `AIDFLOW-REC-${Date.now()}-${projectId}`;
    const totalAmountPaisa = Math.round(numericAmount * 100);

    const donation = await Donation.create({
      donor: req.user._id,
      project: projectId,
      recurringDonation: recurring._id,
      amount: numericAmount,
      baseAmount: numericBaseAmount,
      platformFee: numericPlatformFee,
      currency: currency || "NPR",
      donationType: "monthly",
      donorName: donorName || "",
      receiptName: receiptName || "",
      email: email || "",
      message: message || "",
      anonymous: !!anonymous,
      address: address || "",
      city: city || "",
      country: country || "Nepal",
      paymentMethod: "khalti",
      paymentStatus: "PENDING",
      khaltiPurchaseOrderId: purchaseOrderId,
    });

    const payload = {
      return_url: `${FRONTEND_URL}/khalti-return`,
      website_url: FRONTEND_URL,
      amount: totalAmountPaisa,
      purchase_order_id: purchaseOrderId,
      purchase_order_name: `${project.title} Monthly Donation`,
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

    await Donation.findByIdAndUpdate(donation._id, {
      khaltiPidx: response.data.pidx,
      khaltiPaymentUrl: response.data.payment_url,
      providerReference: response.data.pidx,
    });

    await RecurringDonation.findByIdAndUpdate(recurring._id, {
      providerReference: response.data.pidx,
    });

    return res.status(200).json({
      message: "Recurring donation initiated",
      recurringDonationId: recurring._id,
      donationId: donation._id,
      payment_url: response.data.payment_url,
      pidx: response.data.pidx,
      projectId,
    });
  } catch (error) {
    console.error(
      "RECURRING KHALTI INITIATE ERROR:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      message:
        error.response?.data?.detail ||
        error.response?.data?.error_key ||
        error.message ||
        "Failed to initiate recurring donation",
      error: error.response?.data || error.message,
    });
  }
};

exports.getMyRecurringDonations = async (req, res) => {
  try {
    const subscriptions = await RecurringDonation.find({
      donor: req.user._id,
    })
      .populate("project", "title goalAmount raisedAmount image")
      .sort({ createdAt: -1 });

    res.status(200).json(subscriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.cancelRecurringDonation = async (req, res) => {
  try {
    const recurring = await RecurringDonation.findById(req.params.id);

    if (!recurring) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    if (String(recurring.donor) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    recurring.status = "CANCELLED";
    recurring.cancelledAt = new Date();
    await recurring.save();

    res.status(200).json({
      message: "Subscription cancelled successfully",
      recurring,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.pauseRecurringDonation = async (req, res) => {
  try {
    const recurring = await RecurringDonation.findById(req.params.id);

    if (!recurring) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    if (String(recurring.donor) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    recurring.status = "PAUSED";
    recurring.pausedAt = new Date();
    await recurring.save();

    res.status(200).json({
      message: "Subscription paused successfully",
      recurring,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};