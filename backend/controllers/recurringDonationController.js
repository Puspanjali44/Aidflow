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
      donationType,
      interval,
    } = req.body;

    if (donationType !== "monthly" && interval !== "monthly") {
      return res.status(400).json({ message: "Invalid recurring donation type" });
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
      nextBillingDate: new Date(), // initial payment success pachi update gare jhan ramro
    });

    // for now same Khalti URL flow initiate garna sakchau
    // but callback ma yo recurring record use garera ACTIVE banaune

    return res.status(200).json({
      message: "Recurring donation initiated",
      recurringDonationId: recurring._id,
      payment_url: `http://localhost:5000/api/payments/khalti/placeholder/${recurring._id}`,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Failed to initiate recurring donation",
    });
  }
};