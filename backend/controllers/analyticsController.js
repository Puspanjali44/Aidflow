// backend/controllers/analyticsController.js
const Project = require('../models/Project');
const Donation = require('../models/Donation');

exports.getStats = async (req, res) => {
  try {
    const ngoId = req.user._id; // Fixed: NGO model uses user field

    const projects = await Project.find({ ngo: ngoId });

    const totalRaised = projects.reduce((sum, p) => sum + (p.raisedAmount || 0), 0);
    const totalDonors = projects.reduce((sum, p) => sum + (p.donorCount || 0), 0);
    const avgDonation = totalDonors > 0 ? Math.round(totalRaised / totalDonors) : 0;

    res.json({
      totalRaised,
      totalDonors,
      avgDonation,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getDonationTrends = async (req, res) => {
  try {
    const ngoId = req.user._id;

    const trends = [
      { month: "Oct", amount: 45000 },
      { month: "Nov", amount: 62000 },
      { month: "Dec", amount: 78000 },
      { month: "Jan", amount: 55000 },
      { month: "Feb", amount: 89000 },
      { month: "Mar", amount: 112000 },
    ];

    res.json(trends);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getDonorGrowth = async (req, res) => {
  try {
    const ngoId = req.user._id;

    const growth = [
      { month: "Oct", count: 12 },
      { month: "Nov", count: 18 },
      { month: "Dec", count: 25 },
      { month: "Jan", count: 22 },
      { month: "Feb", count: 35 },
      { month: "Mar", count: 42 },
    ];

    res.json(growth);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getProjectPerformance = async (req, res) => {
  try {
    const ngoId = req.user._id;

    const projects = await Project.find({ ngo: ngoId })
      .select('title raisedAmount goalAmount');

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

