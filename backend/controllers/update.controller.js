const Update = require("../models/Update");
const Project = require("../models/Project");


// CREATE UPDATE
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



// GET PROJECT UPDATES
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



// EDIT UPDATE
exports.editUpdate = async (req, res) => {
  try {
    if (req.user.role !== "ngo") {
      return res.status(403).json({ message: "Only NGO can edit updates" });
    }

    const update = await Update.findById(req.params.id);
    if (!update) return res.status(404).json({ message: "Update not found" });

    // Only the owning NGO can edit
    if (update.ngo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { title, description, expenseUsed, expenseCategory } = req.body;

    // If new photos uploaded, use them; otherwise keep existing
    const photos =
      req.files?.length > 0
        ? req.files.map((file) => file.filename)
        : update.photos;

    const oldExpense = update.expenseUsed || 0;
    const newExpense = Number(expenseUsed) || 0;
    const diff = newExpense - oldExpense;

    update.title = title || update.title;
    update.description = description || update.description;
    update.expenseUsed = newExpense;
    update.expenseCategory = expenseCategory || update.expenseCategory;
    update.photos = photos;

    await update.save();

    // Adjust project totalSpent by the difference
    if (diff !== 0) {
      await Project.findByIdAndUpdate(update.project, {
        $inc: { totalSpent: diff },
      });
    }

    res.json(update);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// DELETE UPDATE
exports.deleteUpdate = async (req, res) => {
  try {
    if (req.user.role !== "ngo") {
      return res.status(403).json({ message: "Only NGO can delete updates" });
    }

    const update = await Update.findById(req.params.id);
    if (!update) return res.status(404).json({ message: "Update not found" });

    if (update.ngo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Reverse the expense from project totalSpent
    if (update.expenseUsed) {
      await Project.findByIdAndUpdate(update.project, {
        $inc: { totalSpent: -(update.expenseUsed) },
      });
    }

    await update.deleteOne();

    res.json({ message: "Update deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};