const User = require("../models/user.models");
const NGO = require("../models/NGO");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, registrationNumber } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (Donor or NGO)
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "donor",
    });

    // 🔥 If NGO → create NGO profile automatically
    if (user.role === "ngo") {
      await NGO.create({
        user: user._id, // link to user
        name: name,
        email: email,
        registrationNumber: registrationNumber || "N/A"
      });
    }

    return res.status(201).json({
      message: "Registration successful",
      role: user.role,
    });

  } catch (error) {
    console.log("REGISTER ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Include password field explicitly
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({ message: "Invalid email" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Wrong password" });
    }

    // Generate token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login successful",
      token,
      role: user.role,
    });

  } catch (error) {
    console.log("LOGIN ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};