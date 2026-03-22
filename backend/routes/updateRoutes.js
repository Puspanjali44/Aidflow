const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const { protect } = require("../middleware/authMiddleware");
const updateController = require("../controllers/update.controller");


// NGO create update
router.post(
  "/add",
  protect,
  upload.array("photos", 5),
  updateController.createUpdate
);


// Get updates by project
router.get("/:projectId", updateController.getProjectUpdates);


// NGO edit update
router.put(
  "/:id",
  protect,
  upload.array("photos", 5),
  updateController.editUpdate
);


// NGO delete update
router.delete(
  "/:id",
  protect,
  updateController.deleteUpdate
);


module.exports = router;