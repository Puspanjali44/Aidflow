const NGO = require("../models/NGO");

// ================= GET NGO PROFILE =================
exports.getMyProfile = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ user: req.user._id });

    if (!ngo) {
      return res.status(404).json({ message: "NGO profile not found" });
    }

    res.json(ngo);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};


// ================= UPDATE NGO PROFILE =================
exports.updateProfile = async (req, res) => {
  try {
    const {
      description,
      mission,
      category,
      location,
      isPublic
    } = req.body;

    const ngo = await NGO.findOne({ user: req.user._id });

    if (!ngo) {
      return res.status(404).json({ message: "NGO profile not found" });
    }

    ngo.description = description ?? ngo.description;
    ngo.mission = mission ?? ngo.mission;
    ngo.category = category ?? ngo.category;
    ngo.location = location ?? ngo.location;

    if (typeof isPublic === "boolean") {
      ngo.isPublic = isPublic;
    }

    await ngo.save();

    res.json({ message: "Profile updated", ngo });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};