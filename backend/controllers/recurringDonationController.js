const Donation = require("../models/Donation");
const RecurringDonation = require("../models/RecurringDonation");
const Project = require("../models/Project");

exports.initiateRecurringDonation = async (req, res) => {
  try {
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

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const recurring = await RecurringDonation.create({
      donor: req.user?._id || null,
      project: projectId,
      amount,
      baseAmount,
      platformFee,
      currency: currency || "NPR",
      donorName,
      receiptName,
      email,
      message,
      anonymous,
      address,
      city,
      country,
      interval: "monthly",
      status: "PENDING",
      paymentStatus: "PENDING",
      provider: "khalti",
    });

    const donation = await Donation.create({
      donor: req.user?._id || null,
      project: projectId,
      recurringDonation: recurring._id,
      amount,
      baseAmount,
      platformFee,
      currency: currency || "NPR",
      donationType: "monthly",
      donorName,
      receiptName,
      email,
      message,
      anonymous,
      address,
      city,
      country,
      paymentMethod: "khalti",
      paymentStatus: "PENDING",
    });

    // Replace this part with your real Khalti initiate code
    // Important: pass donationId and recurringDonationId in return_url or purchase_order_id
    const payment_url = `http://localhost:5000/api/payments/khalti/mock/${donation._id}`;

    return res.status(200).json({
      message: "Recurring donation initiated",
      recurringDonationId: recurring._id,
      donationId: donation._id,
      payment_url,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Failed to initiate recurring donation",
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