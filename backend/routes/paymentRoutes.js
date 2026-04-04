const express = require("express");
const router = express.Router();

const {
  initiateKhaltiPayment,
  verifyKhaltiPayment,
  mockKhaltiPage,
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

router.get("/khalti/mock/:donationId", mockKhaltiPage);

module.exports = router;