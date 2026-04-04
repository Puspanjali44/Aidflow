require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// ======================
// Middlewares
// ======================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================
// Routes
// ======================
const authRoutes = require("./routes/authRoutes");
const ngoRoutes = require("./routes/ngoRoutes");
const projectRoutes = require("./routes/projectRoutes");
const donationRoutes = require("./routes/donationRoutes");
const updateRoutes = require("./routes/updateRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const adminRoutes = require("./routes/admin");
const paymentRoutes = require("./routes/paymentRoutes");
const recurringDonationRoutes = require("./routes/recurringDonationRoutes");

app.use("/api/payments", paymentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/ngo", ngoRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/updates", updateRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/recurring-donations", recurringDonationRoutes);

// ======================
// Static Uploads Folder
// ======================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ======================
// Default Route
// ======================
app.get("/", (req, res) => {
  res.send("AidFlow API Running...");
});

// ======================
module.exports = app;