const Update = require("../models/Update");
const Project = require("../models/Project");

exports.createUpdate = async (req, res) => {
  try {
    const { projectId, title, description, expenseUsed, expenseCategory } =
      req.body;

    if (req.user.role !== "ngo") {
      return res.status(403).json({ message: "Only NGO can update project" });
    }

    const photos = req.files?.map((file) => file.filename) || [];

    const newUpdate = new Update({
      project: projectId,
      ngo: req.user._id,
      title,
      description,
      expenseUsed,
      expenseCategory,
      photos,
    });

    await newUpdate.save();

    await Project.findByIdAndUpdate(projectId, {
      $inc: { totalSpent: expenseUsed || 0 },
    });

    res.status(201).json(newUpdate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProjectUpdates = async (req, res) => {
  try {
    const updates = await Update.find({
      project: req.params.projectId,
    }).sort({ createdAt: -1 });

    res.json(updates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};