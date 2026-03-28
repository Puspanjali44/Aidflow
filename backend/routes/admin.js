const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const NGO = require('../models/NGO');

// Simple admin protection (we'll improve later)
const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: "No token" });
  // For now, skip full JWT check - just check if token exists
  next();
};

const adminOnly = (req, res, next) => {
  // TODO: Add proper role check later
  next();
};

// GET NGOs for admin
router.get('/ngos', protect, adminOnly, async (req, res) => {
  try {
    const ngos = await NGO.find().select('organizationName name email verificationStatus');
    res.json(ngos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET Projects for admin
router.get('/projects/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const status = req.query.status;
    const query = status ? { status } : {};
    const projects = await Project.find(query).populate('ngo', 'name organizationName');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/recent-activity', protect, adminOnly, (req, res) => {
  res.json([]); // empty for now
});

module.exports = router;