const express = require("express");
const router = express.Router();

const {
  initiateKhaltiPayment,
  verifyKhaltiPayment,
} = require("../controllers/payment.controller");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.post(
  "/khalti/initiate",
  protect,
  authorizeRoles("donor"),
  initiateKhaltiPayment
);

router.post(
  "/khalti/verify",
  protect,
  authorizeRoles("donor"),
  verifyKhaltiPayment
);

module.exports = router;